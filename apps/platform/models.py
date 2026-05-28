"""Platform admin models — public schema, SaaS-only."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import models

from apps.tenants.models import Restaurant

User = get_user_model()


class ImpersonationToken(models.Model):
    """One-time token allowing platform staff to enter a tenant's session."""

    token_hash = models.CharField(max_length=128, unique=True, db_index=True)
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name="impersonation_tokens"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="issued_impersonation_tokens"
    )
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"ImpersonationToken({self.restaurant_id}, expires={self.expires_at})"


class PlatformActionLog(models.Model):
    """Append-only audit log for all platform admin actions."""

    actor = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="platform_actions"
    )
    action = models.CharField(max_length=64)
    target_restaurant = models.ForeignKey(
        Restaurant, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="platform_action_logs",
    )
    detail = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.actor_id} / {self.action} / {self.target_restaurant_id}"
