"""SaaS tenant (ROOT) URL configuration.

Serves the per-tenant restaurant schema. After ``TenantSubfolderMiddleware``
strips the ``api/v1/restaurants/<slug>/`` prefix, the remainder is matched
against core's **tenant** URL patterns (unprefixed, e.g. ``bookings/``), giving
clean single-prefix tenant URLs like ``/api/v1/restaurants/<slug>/bookings/``.
Public-only routes (admin, allauth, Stripe webhook, health probes) and the SaaS
public routes live in ``config.urls_public`` instead — they are not exposed per
tenant.
"""

from __future__ import annotations

import importlib.util
import os
import sys

from django.urls import path

from apps.platform.views_me import MeView


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


_core_tenant = _load_core_urlconf("urls.py")

urlpatterns = [
    # Identity endpoint (tenant schema → real StaffMembership role).
    # Served at /api/v1/restaurants/<slug>/me/ after the subfolder prefix strip.
    path("me/", MeView.as_view(), name="me"),
    # All core tenant URL patterns (unprefixed; serve the per-restaurant schema).
    *_core_tenant.urlpatterns,
]
