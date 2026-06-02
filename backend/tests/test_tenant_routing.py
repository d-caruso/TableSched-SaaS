"""Regression: the tenant (ROOT) urlconf serves core *tenant* routes only.

The SaaS tenant urlconf loads core's tenant patterns (not its public ones), so
per-restaurant API paths are single-prefixed
(``/api/v1/restaurants/<slug>/bookings/…``) and public-only endpoints (admin,
allauth, the Stripe webhook, health probes) are not exposed per tenant. Those
public endpoints remain available on the public urlconf.
"""

from __future__ import annotations

import pytest
from django.urls import Resolver404, resolve, set_urlconf

TENANT_URLCONF = "config.urls"
PUBLIC_URLCONF = "config.urls_public"

# Paths below are the post-strip remainders the subfolder middleware passes to
# the tenant urlconf (the client URL is /api/v1/restaurants/<slug>/<remainder>).


def test_tenant_urlconf_serves_tenant_routes():
    set_urlconf(TENANT_URLCONF)
    try:
        assert resolve("/me/").view_name == "me"
        assert resolve("/bookings/").view_name == "bookings:bookings-list"
        assert resolve("/rooms/").view_name == "restaurants:rooms"
    finally:
        set_urlconf(None)


@pytest.mark.parametrize(
    "path",
    [
        "/admin/",
        "/api/v1/payments/webhooks/stripe/",
        "/healthz/",
        "/_allauth/app/v1/auth/login",
    ],
)
def test_tenant_urlconf_excludes_public_only_routes(path):
    set_urlconf(TENANT_URLCONF)
    try:
        with pytest.raises(Resolver404):
            resolve(path)
    finally:
        set_urlconf(None)


def test_public_urlconf_still_serves_public_only_routes():
    set_urlconf(PUBLIC_URLCONF)
    try:
        assert resolve("/admin/").view_name == "admin:index"
        assert resolve("/api/v1/payments/webhooks/stripe/").view_name == "stripe-webhook"
        assert resolve("/healthz/").view_name == "healthz"
    finally:
        set_urlconf(None)
