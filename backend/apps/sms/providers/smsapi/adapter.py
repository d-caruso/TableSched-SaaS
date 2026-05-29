"""SMSAPI SMS provider adapter."""

from __future__ import annotations

import requests
from django.conf import settings

from apps.sms.protocol import DeliveryStatus, PermanentSMSError, TransientSMSError

_BASE_URL = "https://api.smsapi.com"

# SMSAPI status values that indicate permanent failure.
_PERMANENT_STATUSES = frozenset({
    "UNDELIVERED",
    "REJECTED",
    "BLACKLISTED",
    "FAILED",
})

# SMSAPI error codes that indicate a permanent failure.
_PERMANENT_ERROR_CODES = frozenset({
    8,   # Invalid phone number
    13,  # Number on blacklist
    14,  # Invalid sender name
    54,  # Number blocked
})


class SMSAPISMSAdapter:
    """Implements SMSProvider using the SMSAPI REST API."""

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {settings.SMSAPI_TOKEN}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

    def send(self, phone: str, body: str) -> str:
        url = f"{_BASE_URL}/sms.do"
        data = {
            "to": phone,
            "message": body,
            "from": settings.SMSAPI_FROM,
            "format": "json",
        }
        try:
            response = requests.post(url, data=data, headers=self._headers(), timeout=10)
        except requests.Timeout as exc:
            raise TransientSMSError("SMSAPI request timed out") from exc
        except requests.ConnectionError as exc:
            raise TransientSMSError("SMSAPI connection error") from exc

        if response.status_code == 429:
            raise TransientSMSError("SMSAPI rate limit exceeded")

        if response.status_code >= 500:
            raise TransientSMSError(f"SMSAPI server error {response.status_code}")

        if response.status_code != 200:
            raise TransientSMSError(f"SMSAPI error {response.status_code}: {response.text}")

        try:
            data_resp = response.json()
        except ValueError as exc:
            raise TransientSMSError(f"SMSAPI unexpected response: {response.text}") from exc

        # SMSAPI returns {"invalid": [...]} or {"list": [...]}
        if "invalid" in data_resp and data_resp["invalid"]:
            error_code = data_resp["invalid"][0].get("code", 0)
            if error_code in _PERMANENT_ERROR_CODES:
                raise PermanentSMSError(f"SMSAPI permanent error code {error_code}")
            raise TransientSMSError(f"SMSAPI invalid recipient, code {error_code}")

        if "error" in data_resp:
            error_code = data_resp.get("code", 0)
            if error_code in _PERMANENT_ERROR_CODES:
                raise PermanentSMSError(f"SMSAPI permanent error code {error_code}")
            raise TransientSMSError(f"SMSAPI error: {data_resp}")

        try:
            message_id = data_resp["list"][0]["id"]
            return str(message_id)
        except (KeyError, IndexError) as exc:
            raise TransientSMSError(f"SMSAPI unexpected response shape: {data_resp}") from exc

    def handle_dlr(self, payload: dict) -> DeliveryStatus:
        """Normalise an SMSAPI DLR callback payload."""
        message_id = payload.get("id", "")
        raw_status = (payload.get("status") or "").upper()
        error_code = str(payload.get("err", ""))

        if raw_status == "DELIVERED":
            status = "delivered"
        elif raw_status in _PERMANENT_STATUSES:
            status = "failed"
        else:
            status = "pending"

        return DeliveryStatus(message_id=str(message_id), status=status, error_code=error_code)
