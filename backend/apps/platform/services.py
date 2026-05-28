"""Platform admin services: impersonation and subscription overrides."""

from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.platform.models import ImpersonationToken, PlatformActionLog


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def create_impersonation_token(restaurant, created_by) -> str:
    raw_token = secrets.token_urlsafe(48)
    ImpersonationToken.objects.create(
        token_hash=_hash_token(raw_token),
        restaurant=restaurant,
        created_by=created_by,
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    PlatformActionLog.objects.create(
        actor=created_by,
        action="impersonate",
        target_restaurant=restaurant,
        detail={"restaurant_id": str(restaurant.pk)},
    )
    return raw_token


def exchange_impersonation_token(raw_token: str, restaurant_id) -> "Restaurant":
    from apps.tenants.models import Restaurant

    token_hash = _hash_token(raw_token)
    now = timezone.now()
    token = (
        ImpersonationToken.objects.select_related("restaurant")
        .filter(token_hash=token_hash, used_at__isnull=True, expires_at__gt=now)
        .first()
    )
    if token is None:
        raise ValidationError("Invalid, expired, or already-used impersonation token.")
    if str(token.restaurant_id) != str(restaurant_id):
        raise ValidationError("Token restaurant mismatch.")

    ImpersonationToken.objects.filter(pk=token.pk).update(used_at=now)
    return token.restaurant


def override_subscription(restaurant, actor, **fields) -> "Subscription":
    from apps.billing.models import Subscription

    allowed = {"location_limit_override", "plan", "trial_ends_at"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        raise ValidationError("No valid fields to update.")

    Subscription.objects.filter(billing_account__restaurants=restaurant).update(**updates)
    sub = Subscription.objects.get(billing_account__restaurants=restaurant)

    log_detail = {k: (v.pk if hasattr(v, "pk") else v) for k, v in updates.items()}
    PlatformActionLog.objects.create(
        actor=actor,
        action="override_limit",
        target_restaurant=restaurant,
        detail=log_detail,
    )
    return sub
