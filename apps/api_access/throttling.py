"""Per-API-key rate throttles."""

from __future__ import annotations

from rest_framework.throttling import SimpleRateThrottle

from apps.api_access.models import APIKey


class _APIKeyThrottle(SimpleRateThrottle):
    """Base: only active when request.auth is an APIKey instance."""

    def get_cache_key(self, request, view):
        if not isinstance(request.auth, APIKey):
            return None  # Not an API key request — skip throttle.
        return self.cache_format % {
            "scope": self.scope,
            "ident": request.auth.key_hash,
        }


class APIKeyHourlyThrottle(_APIKeyThrottle):
    scope = "api_key_hourly"
    rate = "100/hour"


class APIKeyDailyThrottle(_APIKeyThrottle):
    scope = "api_key_daily"
    rate = "1000/day"
