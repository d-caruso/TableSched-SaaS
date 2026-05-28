"""API access permission classes."""

from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsEnterpriseOrgMember(BasePermission):
    """Session-authenticated org member whose BillingAccount is on the Enterprise plan."""

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return False
        billing_account = getattr(tenant, "billing_account", None)
        if billing_account is None:
            return False
        sub = getattr(billing_account, "subscription", None)
        return sub is not None and sub.plan.slug == "enterprise"
