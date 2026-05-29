"""SaaS URL configuration — extends core public URLs with billing endpoints."""

from __future__ import annotations

import importlib.util
import os
import sys

from django.urls import include, path

from apps.billing.views import stripe_subscription_webhook
from apps.platform import urls as platform_urls
from apps.api_access import urls as api_access_urls
from apps.sms import urls as sms_urls


def _load_core_urlconf(filename: str):
    """Load a core config URL module by absolute path via editable install MAPPING."""
    for mod in sys.modules.values():
        mapping = getattr(mod, "MAPPING", None)
        if not isinstance(mapping, dict):
            continue
        if "config" not in mapping:
            continue
        candidate = os.path.join(mapping["config"], filename)
        if not os.path.exists(candidate):
            continue
        spec = importlib.util.spec_from_file_location(f"_core_config_{filename}", candidate)
        module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
        spec.loader.exec_module(module)  # type: ignore[union-attr]
        return module
    raise ImportError(f"Could not load core config/{filename} via editable install.")


_core_public = _load_core_urlconf("urls_public.py")

urlpatterns = [
    # SaaS-specific subscription webhook.
    path(
        "api/v1/billing/webhooks/stripe/subscription/",
        stripe_subscription_webhook,
        name="stripe-subscription-webhook",
    ),
    # Platform admin API.
    path("api/v1/platform/", include(platform_urls)),
    # Enterprise API key management.
    path("api/v1/platform/", include(api_access_urls)),
    # SMS DLR webhooks.
    path("saas/sms/", include(sms_urls)),
    # All core public URL patterns.
    *_core_public.urlpatterns,
]
