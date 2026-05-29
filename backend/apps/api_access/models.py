"""Enterprise API access models — public schema, SaaS-only."""

from __future__ import annotations

import datetime

from django.db import models
from django.db.models import UniqueConstraint

from apps.tenants.models import BillingAccount

MAX_ACTIVE_KEYS_PER_ACCOUNT = 5


class APIKey(models.Model):
    """Per-BillingAccount API key. Raw key shown once; only SHA-256 hash stored."""

    billing_account_id: int
    billing_account: BillingAccount = models.ForeignKey(
        BillingAccount, on_delete=models.CASCADE, related_name="api_keys"
    )
    name: str = models.CharField(max_length=128)
    key_hash: str = models.CharField(max_length=128, unique=True, db_index=True)
    key_prefix: str = models.CharField(max_length=8)
    is_active: bool = models.BooleanField(default=True)
    last_used_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    expires_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.key_prefix}… ({self.billing_account_id})"


class APIUsageLog(models.Model):
    """Monthly call count per API key."""

    api_key_id: int
    api_key: APIKey = models.ForeignKey(
        APIKey, on_delete=models.CASCADE, related_name="usage_logs"
    )
    year: int = models.PositiveSmallIntegerField()
    month: int = models.PositiveSmallIntegerField()
    call_count: int = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["api_key", "year", "month"],
                name="uniq_api_key_month",
            )
        ]

    def __str__(self) -> str:
        return f"{self.api_key_id} {self.year}-{self.month:02d}: {self.call_count}"
