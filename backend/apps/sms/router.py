"""Least-cost routing (LCR) SMS router.

Reads SMS_ROUTING_TABLE from settings to determine which providers to try
for a given destination phone number, in order. Falls back to the "default"
key if no prefix matches.

This module is wired as SMS_SEND_FN in SaaS settings so core delegates to it.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.utils import timezone

from apps.sms.protocol import PermanentSMSError, TransientSMSError

logger = logging.getLogger("sms.router")

_PROVIDER_REGISTRY: dict[str, type] = {}


def _get_provider_registry() -> dict[str, type]:
    global _PROVIDER_REGISTRY
    if not _PROVIDER_REGISTRY:
        from apps.sms.providers.twilio.adapter import TwilioSMSAdapter
        from apps.sms.providers.infobip.adapter import InfobipSMSAdapter
        from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter
        _PROVIDER_REGISTRY = {
            "twilio": TwilioSMSAdapter,
            "infobip": InfobipSMSAdapter,
            "smsapi": SMSAPISMSAdapter,
        }
    return _PROVIDER_REGISTRY


def _resolve_providers(phone: str) -> list[str]:
    """Return ordered provider list for the given E.164 phone number."""
    routing_table: dict[str, list[str]] = getattr(settings, "SMS_ROUTING_TABLE", {})
    for prefix, providers in routing_table.items():
        if prefix == "default":
            continue
        if phone.startswith(prefix):
            return providers
    return routing_table.get("default", ["twilio"])


def send(phone: str, body: str, billing_account=None) -> str:
    """LCR send function — try each provider in order, stop on success or permanent failure.

    This is the callable wired as SMS_SEND_FN in SaaS settings.
    Returns provider message ID on success. Raises the last exception on full chain failure.
    """
    from apps.sms.models import SMSDeliveryLog

    providers = _resolve_providers(phone)
    registry = _get_provider_registry()
    last_exc: Exception = TransientSMSError("No providers configured")

    for provider_name in providers:
        provider_cls = registry.get(provider_name)
        if provider_cls is None:
            logger.warning("sms_router_unknown_provider", extra={"provider": provider_name})
            continue

        provider = provider_cls()
        log = SMSDeliveryLog.objects.create(
            provider=provider_name,
            phone=phone,
            status=SMSDeliveryLog.STATUS_PENDING,
        )

        try:
            message_id = provider.send(phone=phone, body=body)
            log.provider_message_id = message_id
            log.status = SMSDeliveryLog.STATUS_DELIVERED
            log.delivered_at = timezone.now()
            log.save(update_fields=["provider_message_id", "status", "delivered_at"])
            logger.info("sms_sent", extra={"provider": provider_name, "phone": phone, "message_id": message_id})
            return message_id

        except PermanentSMSError as exc:
            log.status = SMSDeliveryLog.STATUS_FAILED
            log.error_code = str(exc)[:64]
            log.save(update_fields=["status", "error_code"])
            logger.warning("sms_permanent_failure", extra={"provider": provider_name, "phone": phone, "error": str(exc)})
            raise

        except TransientSMSError as exc:
            log.status = SMSDeliveryLog.STATUS_FAILED
            log.error_code = str(exc)[:64]
            log.save(update_fields=["status", "error_code"])
            logger.warning("sms_transient_failure", extra={"provider": provider_name, "phone": phone, "error": str(exc)})
            last_exc = exc
            continue

    raise last_exc
