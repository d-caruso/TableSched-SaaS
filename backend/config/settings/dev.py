"""SaaS development settings."""

import pathlib
import environ

environ.Env.read_env(pathlib.Path(__file__).resolve().parents[2] / ".env")

from config.settings.base import *  # noqa: F401, F403 — saas base (which loads core)
from config.settings.base import INSTALLED_APPS, PLAN_LIMIT_PERMISSION_CLASS  # noqa: F401

Q_CLUSTER = {**Q_CLUSTER, "sync": True}  # type: ignore[name-defined]  # noqa: F821
