"""Plan limit permission — full implementation in doc 25."""

from rest_framework.permissions import BasePermission


class PlanLimitPermission(BasePermission):
    """Stub: always allows. Enforcement logic added in doc 25."""

    def has_permission(self, request, view):
        return True
