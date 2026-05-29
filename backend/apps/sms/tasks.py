"""Scheduled tasks for SMS delivery monitoring."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

logger = logging.getLogger(__name__)

# Minimum delivery rate below which a warning is logged (0.0–1.0).
_DELIVERY_RATE_THRESHOLD = 0.8
# Look-back window for rate calculation.
_WINDOW_MINUTES = 60


def check_delivery_rates() -> None:
    """Log a warning for any provider whose delivery rate falls below the threshold."""
    from apps.sms.models import SMSDeliveryLog

    since = timezone.now() - timedelta(minutes=_WINDOW_MINUTES)
    providers = SMSDeliveryLog.objects.filter(sent_at__gte=since).values_list(
        "provider", flat=True
    ).distinct()

    for provider in providers:
        qs = SMSDeliveryLog.objects.filter(provider=provider, sent_at__gte=since)
        total = qs.count()
        if total == 0:
            continue
        delivered = qs.filter(status=SMSDeliveryLog.STATUS_DELIVERED).count()
        rate = delivered / total
        if rate < _DELIVERY_RATE_THRESHOLD:
            logger.warning(
                "SMS delivery rate below threshold for provider=%s rate=%.2f total=%d delivered=%d",
                provider,
                rate,
                total,
                delivered,
            )
        else:
            logger.info(
                "SMS delivery rate ok for provider=%s rate=%.2f total=%d",
                provider,
                rate,
                total,
            )
