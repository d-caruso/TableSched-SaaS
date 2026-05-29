"""Twilio DLR webhook handler."""

from __future__ import annotations

import hashlib
import hmac
import base64
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from apps.sms.models import SMSDeliveryLog
from apps.sms.providers.twilio.adapter import TwilioSMSAdapter


def _validate_signature(request: HttpRequest) -> bool:
    """Validate X-Twilio-Signature using HMAC-SHA1 over full URL + sorted POST params."""
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
    signature = request.headers.get("X-Twilio-Signature", "")
    url = request.build_absolute_uri()
    params = dict(request.POST)
    # Twilio sorts params alphabetically and appends key+value pairs to URL.
    sorted_params = sorted((k, v[0] if isinstance(v, list) else v) for k, v in params.items())
    url_with_params = url + "".join(k + v for k, v in sorted_params)
    expected = base64.b64encode(
        hmac.new(auth_token.encode(), url_with_params.encode(), hashlib.sha1).digest()
    ).decode()
    return hmac.compare_digest(expected, signature)


@csrf_exempt
def twilio_dlr(request: HttpRequest) -> HttpResponse:
    if request.method != "POST":
        return HttpResponse(status=405)

    if not _validate_signature(request):
        return HttpResponse(status=403)

    adapter = TwilioSMSAdapter()
    delivery_status = adapter.handle_dlr(dict(request.POST))
    message_id = delivery_status.message_id

    try:
        log = SMSDeliveryLog.objects.get(provider_message_id=message_id, provider="twilio")
    except SMSDeliveryLog.DoesNotExist:
        return HttpResponse(status=404)

    log.status = delivery_status.status
    log.error_code = delivery_status.error_code
    if delivery_status.status == "delivered":
        log.delivered_at = timezone.now()
    log.save(update_fields=["status", "error_code", "delivered_at"])

    return HttpResponse(status=204)
