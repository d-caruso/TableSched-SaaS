"""SMSAPI DLR webhook handler."""

from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from apps.sms.models import SMSDeliveryLog
from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter


def _validate_ip(request: HttpRequest) -> bool:
    """Validate that the request originates from an allowed SMSAPI IP address."""
    allowed_ips: set = getattr(settings, "SMSAPI_WEBHOOK_ALLOWED_IPS", set())
    if not allowed_ips:
        return False
    ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
    # X-Forwarded-For may be a comma-separated list; take the first (client) IP.
    client_ip = ip.split(",")[0].strip()
    return client_ip in allowed_ips


@csrf_exempt
def smsapi_dlr(request: HttpRequest) -> HttpResponse:
    if request.method != "POST":
        return HttpResponse(status=405)

    if not _validate_ip(request):
        return HttpResponse(status=403)

    adapter = SMSAPISMSAdapter()
    delivery_status = adapter.handle_dlr(request.POST.dict())
    message_id = delivery_status.message_id

    try:
        log = SMSDeliveryLog.objects.get(provider_message_id=message_id, provider="smsapi")
    except SMSDeliveryLog.DoesNotExist:
        return HttpResponse(status=404)

    log.status = delivery_status.status
    log.error_code = delivery_status.error_code
    if delivery_status.status == "delivered":
        log.delivered_at = timezone.now()
    log.save(update_fields=["status", "error_code", "delivered_at"])

    return HttpResponse(status=204)
