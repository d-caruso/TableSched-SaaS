"""Fixtures for platform/identity endpoint tests (tenant-aware)."""

from __future__ import annotations

from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from apps.tenants.models import Restaurant

User = get_user_model()


@pytest.fixture
def public_tenant(transactional_db):
    """Public tenant row required by TenantSubfolderMiddleware on public requests."""
    Restaurant.objects.get_or_create(schema_name="public", defaults={"name": "Public"})


@pytest.fixture
def staff_user(public_tenant):
    """A plain restaurant user — authenticated, not a platform operator."""
    return User.objects.create_user(
        username=f"staff_{uuid4().hex[:8]}",
        email="staff@example.com",
        password="testpass123",
    )


@pytest.fixture
def platform_user(public_tenant):
    """A user in the ``platform_staff`` group."""
    user = User.objects.create_user(
        username=f"operator_{uuid4().hex[:8]}",
        email="operator@example.com",
        password="testpass123",
    )
    group, _ = Group.objects.get_or_create(name="platform_staff")
    user.groups.add(group)
    return user
