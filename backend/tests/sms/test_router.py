"""Unit tests for LCR SMS router."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from apps.sms.protocol import PermanentSMSError, TransientSMSError


@pytest.fixture(autouse=True)
def clear_provider_registry():
    """Reset the provider registry cache between tests."""
    import apps.sms.router as router_module
    router_module._PROVIDER_REGISTRY = {}
    yield
    router_module._PROVIDER_REGISTRY = {}


@pytest.fixture(autouse=True)
def mock_delivery_log():
    """Mock SMSDeliveryLog DB calls — router logic tests don't need a real table."""
    mock_log = MagicMock()
    mock_log.STATUS_PENDING = "pending"
    mock_log.STATUS_DELIVERED = "delivered"
    mock_log.STATUS_FAILED = "failed"
    mock_instance = MagicMock()
    mock_log.objects.create.return_value = mock_instance
    with patch("apps.sms.models.SMSDeliveryLog", mock_log):
        yield mock_log


def test_router_uses_correct_provider_for_italy(settings):
    settings.SMS_ROUTING_TABLE = {"+39": ["smsapi", "twilio"], "default": ["twilio"]}
    tried = []

    def fake_smsapi_send(self, phone, body):
        tried.append("smsapi")
        return "SA_1"

    with patch("apps.sms.providers.smsapi.adapter.SMSAPISMSAdapter.send", fake_smsapi_send):
        from apps.sms.router import send
        result = send(phone="+39123456789", body="hello")

    assert result == "SA_1"
    assert tried == ["smsapi"]


def test_router_falls_back_on_transient_error(settings):
    settings.SMS_ROUTING_TABLE = {"+39": ["smsapi", "twilio"], "default": ["twilio"]}
    tried = []

    def fake_smsapi_send(self, phone, body):
        tried.append("smsapi")
        raise TransientSMSError("SMSAPI down")

    def fake_twilio_send(self, phone, body):
        tried.append("twilio")
        return "TW_1"

    with patch("apps.sms.providers.smsapi.adapter.SMSAPISMSAdapter.send", fake_smsapi_send), \
         patch("apps.sms.providers.twilio.adapter.TwilioSMSAdapter.send", fake_twilio_send):
        from apps.sms.router import send
        result = send(phone="+39123456789", body="hello")

    assert result == "TW_1"
    assert tried == ["smsapi", "twilio"]


def test_router_stops_on_permanent_error(settings):
    settings.SMS_ROUTING_TABLE = {"+39": ["smsapi", "twilio"], "default": ["twilio"]}
    tried = []

    def fake_smsapi_send(self, phone, body):
        tried.append("smsapi")
        raise PermanentSMSError("invalid number")

    with patch("apps.sms.providers.smsapi.adapter.SMSAPISMSAdapter.send", fake_smsapi_send):
        from apps.sms.router import send
        with pytest.raises(PermanentSMSError):
            send(phone="+39bad", body="hello")

    assert tried == ["smsapi"]  # twilio never tried


def test_router_falls_back_to_default_prefix(settings):
    settings.SMS_ROUTING_TABLE = {"+39": ["smsapi"], "default": ["twilio"]}
    tried = []

    def fake_twilio_send(self, phone, body):
        tried.append("twilio")
        return "TW_DEFAULT"

    with patch("apps.sms.providers.twilio.adapter.TwilioSMSAdapter.send", fake_twilio_send):
        from apps.sms.router import send
        result = send(phone="+1650123456", body="hello")

    assert result == "TW_DEFAULT"
    assert tried == ["twilio"]


def test_router_logs_attempt_to_smsdeliverylog(settings, mock_delivery_log):
    settings.SMS_ROUTING_TABLE = {"default": ["twilio"]}

    def fake_twilio_send(self, phone, body):
        return "TW_LOG"

    with patch("apps.sms.providers.twilio.adapter.TwilioSMSAdapter.send", fake_twilio_send):
        from apps.sms.router import send
        send(phone="+1650123456", body="hello")

    mock_delivery_log.objects.create.assert_called_once()
    call_kwargs = mock_delivery_log.objects.create.call_args.kwargs
    assert call_kwargs["provider"] == "twilio"
