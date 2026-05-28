"""SMS provider protocol, error hierarchy, and delivery status for SaaS LCR."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable


class SMSError(Exception):
    """Base class for SMS send failures."""


class TransientSMSError(SMSError):
    """Temporary failure — try the next provider in the chain."""


class PermanentSMSError(SMSError):
    """Unrecoverable failure — stop the chain immediately (e.g. invalid number)."""


@dataclass
class DeliveryStatus:
    message_id: str
    status: str  # "delivered" | "failed" | "pending"
    error_code: str = field(default="")


@runtime_checkable
class SMSProvider(Protocol):
    def send(self, phone: str, body: str) -> str:
        """Send SMS. Returns provider message ID. Raises SMSError on failure."""
        ...

    def handle_dlr(self, payload: dict) -> DeliveryStatus:
        """Normalise a DLR webhook payload to DeliveryStatus."""
        ...
