"""SaaS base settings — extends tablesched core.

Both repos share the 'config' package namespace. Python's PathFinder finds
saas's config/ first (CWD on sys.path), shadowing the editable install's
MetaPathFinder that maps 'config' → core's directory. We resolve this by
reading the editable install's MAPPING directly to locate core settings,
then loading core's base.py by absolute file path to bypass the namespace.
"""

from __future__ import annotations

import importlib.util
import pathlib
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
        core_config_dir = pathlib.Path(mapping["config"])
        candidate = core_config_dir / "settings" / "base.py"
        if not candidate.exists():
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

# Inject the billing app into the public schema.
INSTALLED_APPS = list(_SHARED_APPS) + [
    "apps.billing",
] + [app for app in _TENANT_APPS if app not in _SHARED_APPS]

# Plan limit permission class injected into core views via get_plan_limit_permission().
PLAN_LIMIT_PERMISSION_CLASS = "apps.billing.permissions.PlanLimitPermission"

# SMS quota hook functions — resolve to billing service functions.
SMS_QUOTA_CHECK_FN = "apps.billing.services.check_sms_quota"
SMS_RECORD_FN = "apps.billing.services.record_sms_sent"

# Tenant suspension hook — resolve to lifecycle service function.
TENANT_SUSPENSION_CHECK_FN = "apps.billing.lifecycle.tenant_is_active"

# Maximum active Free tenants before Free plan is closed to new signups.
# Set via environment variable; unset or 0 means no cap.
import environ as _environ  # noqa: E402
_env = _environ.Env()
_saas_max_free = _env.int("SAAS_MAX_FREE_TENANTS", default=0)
SAAS_MAX_FREE_TENANTS: int | None = _saas_max_free if _saas_max_free > 0 else None
