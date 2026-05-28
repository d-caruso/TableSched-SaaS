"""SaaS test settings."""

import pathlib
import environ

environ.Env.read_env(pathlib.Path(__file__).resolve().parents[2] / ".env.test")

from config.settings.base import *  # noqa: F401, F403 — saas base (which loads core)
from config.settings.base import INSTALLED_APPS, PLAN_LIMIT_PERMISSION_CLASS  # noqa: F401

REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = [  # type: ignore[name-defined]  # noqa: F821
    "rest_framework.authentication.SessionAuthentication",
    "apps.common.authentication.AllauthJWTAuthentication",
]

Q_CLUSTER = {**Q_CLUSTER, "sync": True}  # type: ignore[name-defined]  # noqa: F821

STRIPE_WEBHOOK_SECRET = "whsec_test"
