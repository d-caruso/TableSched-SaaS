from rest_framework.permissions import BasePermission


class IsPlatformStaff(BasePermission):
    """Allow access only to members of the 'platform_staff' Django group."""

    def has_permission(self, request, view) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name="platform_staff").exists()
        )
