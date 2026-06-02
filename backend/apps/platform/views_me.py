"""Identity endpoint for post-login routing.

``GET /api/v1/me/`` returns the one authenticated, tenant-independent fact the
SaaS frontend needs before any restaurant is chosen: whether the user is a
platform operator. The same view is mounted on both the public and tenant
urlconfs; ``role`` is only populated when served from a tenant schema, because
``StaffMembership`` is a tenant-only model (see ``docs/me-endpoint-analysis.md``).
"""

from __future__ import annotations

from django.db import connection
from django_tenants.utils import get_public_schema_name
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.memberships.models import StaffMembership
from apps.platform.permissions import IsPlatformStaff


class MeView(APIView):
    """Return the current user's identity, platform flag, and tenant role."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(
            {
                "email": request.user.email,
                "platformAdmin": IsPlatformStaff().has_permission(request, self),
                "role": self._tenant_role(request),
            }
        )

    @staticmethod
    def _tenant_role(request: Request) -> str | None:
        """Active StaffMembership role for the tenant schema; None in public.

        ``StaffMembership`` lives only in tenant schemas, so querying it on the
        public schema (where the table does not exist) would error — short-circuit.
        """
        # ``schema_name`` is injected onto the connection by django-tenants at runtime.
        if connection.schema_name == get_public_schema_name():  # type: ignore[attr-defined]
            return None
        membership = StaffMembership.objects.filter(
            user=request.user, is_active=True
        ).first()
        return membership.role if membership else None
