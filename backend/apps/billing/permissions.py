"""PlanLimitPermission — enforces per-plan resource limits on DRF views."""

from __future__ import annotations

from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.billing.services import check_booking_quota, get_effective_limits


def _get_billing_account(request):
    """Derive the billing account from the current tenant (restaurant)."""
    tenant = getattr(request, "tenant", None)
    if tenant is None:
        return None
    return getattr(tenant, "billing_account", None)


def _check_limit(resource: str, limits, tenant) -> bool:
    if resource == "location":
        from apps.tenants.models import Restaurant
        count = Restaurant.objects.filter(billing_account=tenant.billing_account).count()
        return count < limits.max_locations

    if resource == "staff":
        from apps.memberships.models import StaffMembership
        count = StaffMembership.objects.count()
        return count < limits.max_staff_per_location

    if resource == "table":
        if limits.max_tables is None:
            return True
        from apps.restaurants.models import Table
        return Table.objects.count() < limits.max_tables

    if resource == "room":
        if limits.max_rooms is None:
            return True
        from apps.restaurants.models import Room
        return Room.objects.count() < limits.max_rooms

    if resource == "booking":
        return check_booking_quota(tenant)

    return True


class PlanLimitPermission(BasePermission):
    """Check plan limits based on the view's `limit_resource` attribute.

    Views declare which resource they gate:
        class RoomListCreateView(...):
            limit_resource = "room"

    Safe methods (GET, HEAD, OPTIONS) are always allowed.
    """

    def has_permission(self, request, view) -> bool:
        resource = getattr(view, "limit_resource", None)
        if resource is None or request.method in SAFE_METHODS:
            return True

        billing_account = _get_billing_account(request)
        if billing_account is None:
            return True  # No billing context — standalone core, allow.

        limits = get_effective_limits(billing_account)
        tenant = getattr(request, "tenant", None)
        allowed = _check_limit(resource, limits, tenant)
        if not allowed:
            self.message = f"Plan limit reached for resource: {resource}"
        return allowed
