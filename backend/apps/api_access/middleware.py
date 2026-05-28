"""APIUsageMiddleware — increments monthly call count for API key requests."""

from __future__ import annotations

from django.db.models import F
from django.utils import timezone

from apps.api_access.models import APIKey, APIUsageLog


class APIUsageMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if isinstance(getattr(request, "auth", None), APIKey):
            now = timezone.now()
            APIUsageLog.objects.update_or_create(
                api_key=request.auth,
                year=now.year,
                month=now.month,
                defaults={},
            )
            APIUsageLog.objects.filter(
                api_key=request.auth, year=now.year, month=now.month
            ).update(call_count=F("call_count") + 1)
        return response
