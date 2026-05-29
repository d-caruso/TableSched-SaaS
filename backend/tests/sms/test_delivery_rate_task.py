"""Tests for the SMS delivery rate monitoring task."""

from __future__ import annotations

from unittest.mock import MagicMock, patch


def _run_task(providers, total, delivered):
    mock_log_cls = MagicMock()
    mock_log_cls.STATUS_DELIVERED = "delivered"

    # First filter call chains into values_list().distinct() to yield provider names.
    provider_qs = MagicMock()
    provider_qs.values_list.return_value.distinct.return_value = iter(providers)

    # Second filter call (per-provider window) returns a qs with count + inner filter.
    inner_delivered_qs = MagicMock()
    inner_delivered_qs.count.return_value = delivered

    per_provider_qs = MagicMock()
    per_provider_qs.count.return_value = total
    per_provider_qs.filter.return_value = inner_delivered_qs

    call_count = {"n": 0}

    def _filter_side_effect(*args, **kwargs):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return provider_qs
        return per_provider_qs

    mock_log_cls.objects.filter.side_effect = _filter_side_effect

    with patch("apps.sms.models.SMSDeliveryLog", mock_log_cls):
        from apps.sms import tasks
        tasks.check_delivery_rates()

    return mock_log_cls


def test_low_delivery_rate_logs_warning():
    with patch("apps.sms.tasks.logger") as mock_logger:
        _run_task(providers=["twilio"], total=100, delivered=70)

    mock_logger.warning.assert_called_once()
    msg = mock_logger.warning.call_args[0][0]
    assert "below threshold" in msg


def test_healthy_delivery_rate_logs_info():
    with patch("apps.sms.tasks.logger") as mock_logger:
        _run_task(providers=["twilio"], total=100, delivered=95)

    mock_logger.warning.assert_not_called()
    mock_logger.info.assert_called_once()
    msg = mock_logger.info.call_args[0][0]
    assert "ok" in msg


def test_zero_messages_skipped():
    with patch("apps.sms.tasks.logger") as mock_logger:
        _run_task(providers=["twilio"], total=0, delivered=0)

    mock_logger.warning.assert_not_called()
    mock_logger.info.assert_not_called()
