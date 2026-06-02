"""SaaS public-schema URL configuration.

Extends core's public URL patterns with the SaaS-only public routes (platform
admin API, billing subscription webhook, SMS delivery-receipt webhooks).

Because this module exists, ``PUBLIC_SCHEMA_URLCONF = "config.urls_public"``
resolves here (the local submodule shadows core's editable fall-through),
restoring the SaaS public routes that otherwise 404 on the public schema.
"""

from __future__ import annotations

from django.urls import include, path

from apps.api_access import urls as api_access_urls
from apps.billing.views import stripe_subscription_webhook
from apps.platform import urls as platform_urls
from apps.platform.views_me import MeView
from apps.sms import urls as sms_urls
from config.urls import _load_core_urlconf

_core_public = _load_core_urlconf("urls_public.py")

urlpatterns = [
    # Identity endpoint (public schema → role is null).
    path("api/v1/me/", MeView.as_view(), name="me"),
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
