"""SaaS Twilio adapter — wraps core TwilioSMSProvider, maps exceptions to SMSError hierarchy."""

from __future__ import annotations

from apps.sms.protocol import DeliveryStatus, PermanentSMSError, TransientSMSError

# Twilio error codes that indicate a permanent failure (no point retrying with Twilio or another provider).
_PERMANENT_CODES = frozenset({
    21211,  # Invalid 'To' phone number
    21610,  # Attempt to send to unsubscribed recipient
    21614,  # 'To' number is not a valid mobile number
    21408,  # Account not allowed to send messages
    21212,  # Invalid 'From' phone number
    21215,  # Account not authorized for this number
})


class TwilioSMSAdapter:
    """Implements SMSProvider using core TwilioSMSProvider with SaaS error mapping."""

    def send(self, phone: str, body: str) -> str:
        from apps.notifications.providers.twilio.adapter import TwilioSMSProvider
        from twilio.base.exceptions import TwilioRestException  # type: ignore[import-untyped]

        try:
            return TwilioSMSProvider().send(phone=phone, body=body)
        except TwilioRestException as exc:
            code = exc.code
            if code in _PERMANENT_CODES:
                raise PermanentSMSError(f"Twilio permanent error {code}: {exc}") from exc
            raise TransientSMSError(f"Twilio transient error {code}: {exc}") from exc

    def handle_dlr(self, payload: dict) -> DeliveryStatus:
        """Normalise a Twilio DLR status callback payload."""
        message_id = payload.get("MessageSid", "")
        raw_status = payload.get("MessageStatus", "")
        if raw_status in ("delivered",):
            status = "delivered"
        elif raw_status in ("failed", "undelivered"):
            status = "failed"
        else:
            status = "pending"
        error_code = payload.get("ErrorCode", "")
        return DeliveryStatus(message_id=message_id, status=status, error_code=str(error_code))
