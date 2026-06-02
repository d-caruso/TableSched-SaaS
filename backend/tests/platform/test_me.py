"""Tests for ``GET /me/`` and SaaS public-route resolution.

Covers the identity endpoint on both schemas plus a regression guard that the
SaaS public routes resolve under ``config.urls_public`` (the 404 gap fixed in
Task 1).
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection
from django.test import Client
from django.urls import resolve, set_urlconf
from django_tenants.utils import schema_context  # type: ignore[import-untyped]

from apps.memberships.models import StaffMembership
from apps.tenants.models import Domain, Restaurant

User = get_user_model()

ME_PUBLIC = "/api/v1/me/"


@contextmanager
def tenant_schema(prefix: str) -> Iterator[str]:
    """Create a migrated tenant schema with a primary domain and switch into it."""
    schema_name = f"{prefix}_{uuid4().hex[:8]}"
    with schema_context("public"):
        tenant = Restaurant.objects.create(schema_name=schema_name, name="Test Restaurant")
        Domain.objects.create(domain=schema_name, tenant=tenant, is_primary=True)
    call_command("migrate_schemas", schema_name=schema_name, interactive=False, verbosity=0)
    try:
        with schema_context(schema_name):
            yield schema_name
    finally:
        # transactional_db truncates tables but does not drop dynamically created
        # schemas; drop it so test schemas don't accumulate in the test database.
        with connection.cursor() as cursor:
            cursor.execute(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE')


def test_me_requires_authentication(public_tenant):
    resp = Client().get(ME_PUBLIC)
    assert resp.status_code == 403


def test_me_restaurant_staff_public_context(staff_user):
    client = Client()
    client.force_login(staff_user)

    resp = client.get(ME_PUBLIC)

    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "staff@example.com"
    assert body["platformAdmin"] is False
    assert body["role"] is None


def test_me_platform_staff(platform_user):
    client = Client()
    client.force_login(platform_user)

    resp = client.get(ME_PUBLIC)

    assert resp.status_code == 200
    body = resp.json()
    assert body["platformAdmin"] is True


def test_me_tenant_scope_returns_role(public_tenant):
    user = User.objects.create_user(
        username=f"mgr_{uuid4().hex[:8]}",
        email="manager@example.com",
        password="testpass123",
    )
    with tenant_schema("rolecheck") as schema_name:
        StaffMembership.objects.create(
            user=user, role=StaffMembership.ROLE_MANAGER, is_active=True
        )

        client = Client()
        client.force_login(user)
        resp = client.get(f"/api/v1/restaurants/{schema_name}/me/")

        assert resp.status_code == 200
        assert resp.json()["role"] == StaffMembership.ROLE_MANAGER


def test_public_routes_resolve():
    """Regression: SaaS public routes resolve under the new public urlconf."""
    set_urlconf("config.urls_public")
    try:
        assert resolve(ME_PUBLIC).view_name == "me"
        assert resolve("/api/v1/platform/tenants/").view_name == "platform-tenant-list"
    finally:
        set_urlconf(None)
