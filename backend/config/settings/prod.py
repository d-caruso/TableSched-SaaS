"""SaaS production settings."""

import os
import environ

environ.Env.read_env(os.path.join(os.path.dirname(__file__), '..', '..', '.env.prod'))

from config.settings.base import *  # noqa: F401, F403
from config.settings.base import INSTALLED_APPS, PLAN_LIMIT_PERMISSION_CLASS  # noqa: F401

DEBUG = False
PUBLIC_DOMAIN = os.environ.get("PUBLIC_DOMAIN", "")

_extra_hosts = [h.strip() for h in os.environ.get("EXTRA_ALLOWED_HOSTS", "").split(",") if h.strip()]
ALLOWED_HOSTS = ([PUBLIC_DOMAIN] if PUBLIC_DOMAIN else []) + _extra_hosts or ["*"]

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "3600"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get("SECURE_HSTS_INCLUDE_SUBDOMAINS", "False").lower() == "true"
SECURE_HSTS_PRELOAD = os.environ.get("SECURE_HSTS_PRELOAD", "False").lower() == "true"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_REDIRECT_EXEMPT = [r"^healthz/$", r"^readyz/$"]
DATA_UPLOAD_MAX_MEMORY_SIZE = 5_242_880
CSRF_TRUSTED_ORIGINS = [f"https://{h}" for h in ALLOWED_HOSTS if h and h != "*"]

import os as _os  # noqa: E402
if not _os.environ.get("SENTRY_TRACES_SAMPLE_RATE"):
    _os.environ.setdefault("SENTRY_TRACES_SAMPLE_RATE", "0.05")
