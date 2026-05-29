"""Infobip DLR webhook handler."""

from __future__ import annotations

import hashlib
import hmac
import json

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from apps.sms.models import SMSDeliveryLog
from apps.sms.providers.infobip.adapter import InfobipSMSAdapter


def _validate_signature(request: HttpRequest) -> bool:
    """Validate Infobip HMAC-SHA256 signature header."""
    secret = getattr(settings, "INFOBIP_WEBHOOK_SECRET", "")
    if not secret:
        return False
    signature = request.headers.get("X-Hub-Signature-256", "")
    if signature.startswith("sha256="):
        signature = signature[len("sha256="):]
    expected = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@csrf_exempt
def infobip_dlr(request: HttpRequest) -> HttpResponse:
    if request.method != "POST":
        return HttpResponse(status=405)

    if not _validate_signature(request):
        return HttpResponse(status=403)

    try:
        payload = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return HttpResponse(status=400)

    adapter = InfobipSMSAdapter()
    delivery_status = adapter.handle_dlr(payload)
    message_id = delivery_status.message_id

    try:
        log = SMSDeliveryLog.objects.get(provider_message_id=message_id, provider="infobip")
    except SMSDeliveryLog.DoesNotExist:
        return HttpResponse(status=404)

    log.status = delivery_status.status
    log.error_code = delivery_status.error_code
    if delivery_status.status == "delivered":
        log.delivered_at = timezone.now()
    log.save(update_fields=["status", "error_code", "delivered_at"])

    return HttpResponse(status=204)
