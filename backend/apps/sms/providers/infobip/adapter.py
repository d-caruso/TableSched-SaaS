"""Infobip SMS provider adapter."""

from __future__ import annotations

import requests
from django.conf import settings

from apps.sms.protocol import DeliveryStatus, PermanentSMSError, TransientSMSError

# Infobip groupName values that indicate permanent failure.
_PERMANENT_GROUP_NAMES = frozenset({
    "UNDELIVERABLE",
    "REJECTED",
})

# Infobip error descriptions that indicate an invalid destination (permanent).
_PERMANENT_ERROR_FRAGMENTS = (
    "INVALID_DESTINATION_ADDRESS",
    "INVALID_DESTINATION",
    "BLACKLISTED",
    "UNSUBSCRIBED",
)


class InfobipSMSAdapter:
    """Implements SMSProvider using the Infobip REST API."""

    def _base_url(self) -> str:
        return getattr(settings, "INFOBIP_BASE_URL", "").rstrip("/")

    def _headers(self) -> dict:
        return {
            "Authorization": f"App {settings.INFOBIP_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def send(self, phone: str, body: str) -> str:
        url = f"{self._base_url()}/sms/2/text/advanced"
        payload = {
            "messages": [
                {
                    "from": settings.INFOBIP_FROM,
                    "destinations": [{"to": phone}],
                    "text": body,
                }
            ]
        }
        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        except requests.Timeout as exc:
            raise TransientSMSError("Infobip request timed out") from exc
        except requests.ConnectionError as exc:
            raise TransientSMSError("Infobip connection error") from exc

        if response.status_code == 200:
            try:
                message_id = response.json()["messages"][0]["messageId"]
                return message_id
            except (KeyError, IndexError, ValueError) as exc:
                raise TransientSMSError(f"Infobip unexpected response: {response.text}") from exc

        if response.status_code == 429:
            raise TransientSMSError("Infobip rate limit exceeded")

        if response.status_code >= 500:
            raise TransientSMSError(f"Infobip server error {response.status_code}")

        # 4xx — check if permanent
        try:
            body_text = response.text.upper()
        except Exception:
            body_text = ""
        if any(frag in body_text for frag in _PERMANENT_ERROR_FRAGMENTS):
            raise PermanentSMSError(f"Infobip permanent error {response.status_code}: {response.text}")

        raise TransientSMSError(f"Infobip error {response.status_code}: {response.text}")

    def handle_dlr(self, payload: dict) -> DeliveryStatus:
        """Normalise an Infobip DLR webhook result."""
        result = payload.get("result") or [{}]
        entry = result[0] if result else {}
        message_id = entry.get("messageId", "")
        group_name = (entry.get("status") or {}).get("groupName", "")
        error_code = str((entry.get("error") or {}).get("id", ""))

        if group_name == "DELIVERED":
            status = "delivered"
        elif group_name in _PERMANENT_GROUP_NAMES:
            status = "failed"
        else:
            status = "pending"

        return DeliveryStatus(message_id=message_id, status=status, error_code=error_code)
