"""SaaS test settings."""

import os
import environ

environ.Env.read_env(os.path.join(os.path.dirname(__file__), '..', '..', '.env.test'))

from config.settings.base import *  # noqa: F401, F403 — saas base (which loads core)
from config.settings.base import INSTALLED_APPS, PLAN_LIMIT_PERMISSION_CLASS, Q_CLUSTER, REST_FRAMEWORK  # noqa: F401

REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"] = [
    "rest_framework.authentication.SessionAuthentication",
    "apps.common.authentication.AllauthJWTAuthentication",
]

Q_CLUSTER = {**Q_CLUSTER, "sync": True}

STRIPE_WEBHOOK_SECRET = "whsec_test"
