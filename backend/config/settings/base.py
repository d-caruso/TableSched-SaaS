"""SaaS base settings — extends tablesched core.

Both repos share the 'config' package namespace. Python's PathFinder finds
saas's config/ first (CWD on sys.path), shadowing the editable install's
MetaPathFinder that maps 'config' → core's directory. We resolve this by
reading the editable install's MAPPING directly to locate core settings,
then loading core's base.py by absolute file path to bypass the namespace.
"""

from __future__ import annotations

import importlib.util
import os
import sys


def _load_core_settings():
    """Load core tablesched settings via the editable install MAPPING.

    The editable install module (e.g. __editable___tablesched_backend_*_finder)
    lives in sys.modules and carries MAPPING = {'config': '<core_config_path>'}.
    We read it from there rather than from the finder class (MAPPING is a
    module-level variable, not a class attribute, so getattr(cls) misses it).
    """
    for mod in sys.modules.values():
        mapping = getattr(mod, "MAPPING", None)
        if not isinstance(mapping, dict):
            continue
        if "config" not in mapping:
            continue
        candidate = os.path.join(mapping["config"], "settings", "base.py")
        if not os.path.exists(candidate):
            continue
        # Skip if this resolves to the current file — SaaS has its own editable
        # install MAPPING that also contains a 'config' key. We must not load
        # ourselves recursively.
        if os.path.normcase(os.path.abspath(candidate)) == os.path.normcase(os.path.abspath(__file__)):
            continue
        # Load by absolute path to bypass the 'config' namespace collision.
        spec = importlib.util.spec_from_file_location(
            "_tablesched_core_settings_base", candidate
        )
        module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
        spec.loader.exec_module(module)  # type: ignore[union-attr]
        return module
    raise ImportError(
        "Could not find tablesched core settings via editable install. "
        "Run: pip install -e ../TableSched/backend"
    )


_core = _load_core_settings()

# Pull all uppercase settings from core into this module's namespace.
for _name in dir(_core):
    if _name.isupper():
        globals()[_name] = getattr(_core, _name)

_SHARED_APPS = _core.SHARED_APPS
_TENANT_APPS = _core.TENANT_APPS

# Inject SaaS-only public schema apps.
INSTALLED_APPS = list(_SHARED_APPS) + [
    "apps.billing",
    "apps.platform",
    "apps.api_access",
    "apps.sms",
] + [app for app in _TENANT_APPS if app not in _SHARED_APPS]

# Plan limit permission class injected into core views via get_plan_limit_permission().
PLAN_LIMIT_PERMISSION_CLASS = "apps.billing.permissions.PlanLimitPermission"

# SMS hook functions — quota/record resolve to billing; send delegates to LCR router.
SMS_QUOTA_CHECK_FN = "apps.billing.services.check_sms_quota"
SMS_RECORD_FN = "apps.billing.services.record_sms_sent"
SMS_SEND_FN = "apps.sms.router.send"

# Least-cost routing table: E.164 prefix → ordered provider list.
# "default" is used when no prefix matches.
SMS_ROUTING_TABLE: dict = {
    "+39": ["smsapi", "infobip", "twilio"],   # Italy
    "+44": ["infobip", "twilio"],              # UK
    "default": ["twilio"],
}

# Tenant suspension hook — resolve to lifecycle service function.
TENANT_SUSPENSION_CHECK_FN = "apps.billing.lifecycle.tenant_is_active"

# Maximum active Free tenants before Free plan is closed to new signups.
# Set via environment variable; unset or 0 means no cap.
import environ as _environ  # noqa: E402
_env = _environ.Env()
_saas_max_free = _env.int("SAAS_MAX_FREE_TENANTS", default=0)
SAAS_MAX_FREE_TENANTS: int | None = _saas_max_free if _saas_max_free > 0 else None

# Insert TenantSuspensionMiddleware after TenantSubfolderMiddleware so that
# request.tenant is already populated when the suspension check runs.
_tenant_mw = "django_tenants.middleware.TenantSubfolderMiddleware"
_suspension_mw = "apps.common.middleware.TenantSuspensionMiddleware"
if _tenant_mw in MIDDLEWARE and _suspension_mw not in MIDDLEWARE:  # type: ignore[name-defined]
    _idx = MIDDLEWARE.index(_tenant_mw)  # type: ignore[name-defined]
    MIDDLEWARE = list(MIDDLEWARE)  # type: ignore[name-defined]
    MIDDLEWARE.insert(_idx + 1, _suspension_mw)

# Append API usage tracking middleware.
_usage_mw = "apps.api_access.middleware.APIUsageMiddleware"
if _usage_mw not in MIDDLEWARE:  # type: ignore[name-defined]
    MIDDLEWARE = list(MIDDLEWARE)  # type: ignore[name-defined]
    MIDDLEWARE.append(_usage_mw)

# Add APIKeyAuthentication to DRF authentication classes.
REST_FRAMEWORK = dict(REST_FRAMEWORK)  # type: ignore[name-defined]
_api_key_auth = "apps.api_access.authentication.APIKeyAuthentication"
_auth_classes = list(REST_FRAMEWORK.get("DEFAULT_AUTHENTICATION_CLASSES", []))
if _api_key_auth not in _auth_classes:
    _auth_classes.append(_api_key_auth)
REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = _auth_classes

# Add API key rate throttles.
_throttle_classes = list(REST_FRAMEWORK.get("DEFAULT_THROTTLE_CLASSES", []))
for _tc in [
    "apps.api_access.throttling.APIKeyHourlyThrottle",
    "apps.api_access.throttling.APIKeyDailyThrottle",
]:
    if _tc not in _throttle_classes:
        _throttle_classes.append(_tc)
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = _throttle_classes
_throttle_rates = dict(REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}))
_throttle_rates.update({
    "api_key_hourly": "100/hour",
    "api_key_daily": "1000/day",
})
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = _throttle_rates
