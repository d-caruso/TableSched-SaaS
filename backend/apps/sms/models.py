"""SMS delivery log model for SaaS multi-gateway tracking."""

from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone


class SMSDeliveryLog(models.Model):
    STATUS_PENDING = "pending"
    STATUS_DELIVERED = "delivered"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_FAILED, "Failed"),
    ]

    id: models.UUIDField = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # UUID of core NotificationLog — stored as plain field, no FK (cross-schema).
    notification_log_id: models.UUIDField = models.UUIDField(null=True, blank=True, db_index=True)
    provider: models.CharField = models.CharField(max_length=32)  # "twilio" | "infobip" | "smsapi"
    provider_message_id: models.CharField = models.CharField(max_length=255, blank=True)
    status: models.CharField = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    error_code: models.CharField = models.CharField(max_length=64, blank=True)
    phone: models.CharField = models.CharField(max_length=32)
    sent_at: models.DateTimeField = models.DateTimeField(default=timezone.now)
    delivered_at: models.DateTimeField = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["provider", "status", "sent_at"]),
            models.Index(fields=["provider_message_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.provider} {self.phone} {self.status}"
