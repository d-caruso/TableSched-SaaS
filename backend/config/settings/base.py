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
from types import ModuleType


def _load_core_settings() -> ModuleType:
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

# Explicit imports from core — every uppercase setting must be listed here so
# that mypy (and django-stubs) can resolve their types without dynamic globals().
SECRET_KEY: str = _core.SECRET_KEY
DEBUG: bool = _core.DEBUG
ALLOWED_HOSTS: list = _core.ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS: list = _core.CORS_ALLOWED_ORIGINS
DATABASES: dict = _core.DATABASES
DATABASE_ROUTERS: tuple = _core.DATABASE_ROUTERS
SHARED_APPS: tuple = _core.SHARED_APPS
TENANT_APPS: tuple = _core.TENANT_APPS
TENANT_MODEL: str = _core.TENANT_MODEL
TENANT_DOMAIN_MODEL: str = _core.TENANT_DOMAIN_MODEL
TENANT_SUBFOLDER_PREFIX: str = _core.TENANT_SUBFOLDER_PREFIX
MIDDLEWARE: list = list(_core.MIDDLEWARE)
ROOT_URLCONF: str = _core.ROOT_URLCONF
PUBLIC_SCHEMA_URLCONF: str = _core.PUBLIC_SCHEMA_URLCONF
SHOW_PUBLIC_IF_NO_TENANT_FOUND: bool = _core.SHOW_PUBLIC_IF_NO_TENANT_FOUND
TEMPLATES: list = _core.TEMPLATES
WSGI_APPLICATION: str = _core.WSGI_APPLICATION
AUTHENTICATION_BACKENDS: tuple = _core.AUTHENTICATION_BACKENDS
SITE_ID: int = _core.SITE_ID
AUTH_USER_MODEL: str = _core.AUTH_USER_MODEL
HEADLESS_ONLY: bool = _core.HEADLESS_ONLY
HEADLESS_TOKEN_STRATEGY: str = _core.HEADLESS_TOKEN_STRATEGY
HEADLESS_FRONTEND_URLS: dict = _core.HEADLESS_FRONTEND_URLS
HEADLESS_JWT_SECRET_KEY: str = _core.HEADLESS_JWT_SECRET_KEY
HEADLESS_JWT_ALGORITHM: str = _core.HEADLESS_JWT_ALGORITHM
HEADLESS_JWT_ACCESS_TOKEN_EXPIRATION: int = _core.HEADLESS_JWT_ACCESS_TOKEN_EXPIRATION
HEADLESS_JWT_REFRESH_TOKEN_EXPIRATION: int = _core.HEADLESS_JWT_REFRESH_TOKEN_EXPIRATION
HEADLESS_JWT_ROTATE_REFRESH_TOKEN: bool = _core.HEADLESS_JWT_ROTATE_REFRESH_TOKEN
ACCOUNT_LOGIN_METHODS: set = _core.ACCOUNT_LOGIN_METHODS
ACCOUNT_SIGNUP_FIELDS: list = _core.ACCOUNT_SIGNUP_FIELDS
ACCOUNT_EMAIL_VERIFICATION: str = _core.ACCOUNT_EMAIL_VERIFICATION
ACCOUNT_ADAPTER: str = _core.ACCOUNT_ADAPTER
REST_FRAMEWORK: dict = dict(_core.REST_FRAMEWORK)
CACHES: dict = _core.CACHES
LANGUAGE_CODE: str = _core.LANGUAGE_CODE
TIME_ZONE: str = _core.TIME_ZONE
USE_I18N: bool = _core.USE_I18N
USE_TZ: bool = _core.USE_TZ
STATIC_URL: str = _core.STATIC_URL
DEFAULT_AUTO_FIELD: str = _core.DEFAULT_AUTO_FIELD
EMAIL_BACKEND: str = _core.EMAIL_BACKEND
EMAIL_HOST: str = _core.EMAIL_HOST
EMAIL_PORT: int = _core.EMAIL_PORT
EMAIL_HOST_USER: str = _core.EMAIL_HOST_USER
EMAIL_HOST_PASSWORD: str = _core.EMAIL_HOST_PASSWORD
EMAIL_USE_TLS: bool = _core.EMAIL_USE_TLS
DEFAULT_FROM_EMAIL: str = _core.DEFAULT_FROM_EMAIL
STRIPE_API_KEY: str = _core.STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET: str = _core.STRIPE_WEBHOOK_SECRET
STRIPE_API_KEY_2: str = _core.STRIPE_API_KEY_2
STRIPE_WEBHOOK_SECRET_2: str = _core.STRIPE_WEBHOOK_SECRET_2
FIELD_ENCRYPTION_KEY: str = _core.FIELD_ENCRYPTION_KEY
TWILIO_ACCOUNT_SID: str = _core.TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN: str = _core.TWILIO_AUTH_TOKEN
TWILIO_FROM: str = _core.TWILIO_FROM
TWILIO_STUB: bool = _core.TWILIO_STUB
PUBLIC_BOOKING_RESTAURANT_NAME: str = _core.PUBLIC_BOOKING_RESTAURANT_NAME
PUBLIC_BOOKING_BASE_URL: str = _core.PUBLIC_BOOKING_BASE_URL
PUBLIC_BOOKING_RETURN_URL: str = _core.PUBLIC_BOOKING_RETURN_URL
PUBLIC_BOOKING_CANCEL_URL: str = _core.PUBLIC_BOOKING_CANCEL_URL
LOGGING: dict = _core.LOGGING
Q_CLUSTER: dict = dict(_core.Q_CLUSTER)
MAINTENANCE_PING_TOKEN: str = _core.MAINTENANCE_PING_TOKEN

_SHARED_APPS = _core.SHARED_APPS
_TENANT_APPS = _core.TENANT_APPS

# Inject SaaS-only public schema apps.
INSTALLED_APPS: list = list(_SHARED_APPS) + [
    "apps.billing",
    "apps.platform",
    "apps.api_access",
    "apps.sms",
] + [app for app in _TENANT_APPS if app not in _SHARED_APPS]

# Plan limit permission class injected into core views via get_plan_limit_permission().
PLAN_LIMIT_PERMISSION_CLASS: str = "apps.billing.permissions.PlanLimitPermission"

# SMS hook functions — quota/record resolve to billing; send delegates to LCR router.
SMS_QUOTA_CHECK_FN: str = "apps.billing.services.check_sms_quota"
SMS_RECORD_FN: str = "apps.billing.services.record_sms_sent"
SMS_SEND_FN: str = "apps.sms.router.send"

# Least-cost routing table: E.164 prefix → ordered provider list.
# "default" is used when no prefix matches.
SMS_ROUTING_TABLE: dict = {
    "+39": ["smsapi", "infobip", "twilio"],   # Italy
    "+44": ["infobip", "twilio"],              # UK
    "default": ["twilio"],
}

# Tenant suspension hook — resolve to lifecycle service function.
TENANT_SUSPENSION_CHECK_FN: str = "apps.billing.lifecycle.tenant_is_active"

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
if _tenant_mw in MIDDLEWARE and _suspension_mw not in MIDDLEWARE:
    _idx = MIDDLEWARE.index(_tenant_mw)
    MIDDLEWARE.insert(_idx + 1, _suspension_mw)

# Append API usage tracking middleware.
_usage_mw = "apps.api_access.middleware.APIUsageMiddleware"
if _usage_mw not in MIDDLEWARE:
    MIDDLEWARE.append(_usage_mw)

# Add APIKeyAuthentication to DRF authentication classes.
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
