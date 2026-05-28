"""APIKeyAuthentication — DRF BaseAuthentication for Enterprise API keys."""

from __future__ import annotations

import hashlib

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.api_access.models import APIKey


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class APIKeyAuthentication(BaseAuthentication):
    """Authenticate via X-Api-Key header.

    Returns (billing_account, api_key) on success so that downstream code
    (throttles, middleware) can identify the caller.
    Enterprise plan check is enforced here so non-Enterprise accounts cannot
    use the API even with a valid key row.
    """

    def authenticate(self, request):
        raw = request.headers.get("X-Api-Key")
        if not raw:
            return None

        key_hash = _hash(raw)
        try:
            api_key = APIKey.objects.select_related(
                "billing_account__subscription__plan"
            ).get(key_hash=key_hash, is_active=True)
        except APIKey.DoesNotExist:
            raise AuthenticationFailed("Invalid API key.")

        if api_key.expires_at and api_key.expires_at < timezone.now():
            raise AuthenticationFailed("API key expired.")

        # Enterprise plan check.
        sub = getattr(api_key.billing_account, "subscription", None)
        if sub is None or sub.plan.slug != "enterprise":
            raise AuthenticationFailed("API access requires the Enterprise plan.")

        APIKey.objects.filter(pk=api_key.pk).update(last_used_at=timezone.now())
        return (api_key.billing_account, api_key)

    def authenticate_header(self, request):
        return "X-Api-Key"
