"""Platform admin API views."""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.lifecycle import (
    cancel_tenant,
    reactivate_tenant,
    schedule_schema_deletion,
    suspend_tenant,
)
from apps.billing.models import Subscription, TenantLifecycleEvent
from apps.platform.models import PlatformActionLog
from apps.platform.permissions import IsPlatformStaff
from apps.platform.serializers import (
    PlatformActionLogSerializer,
    SubscriptionOverrideSerializer,
    TenantDetailSerializer,
    TenantLifecycleEventSerializer,
    TenantListSerializer,
)
from apps.platform.services import (
    create_impersonation_token,
    exchange_impersonation_token,
    override_subscription,
)
from apps.tenants.models import Restaurant

_PLATFORM_PERMISSIONS = [IsAuthenticated, IsPlatformStaff]
_PLATFORM_AUTH = [SessionAuthentication]


def _get_restaurant(pk):
    return get_object_or_404(Restaurant, pk=pk)


def _log(actor, action, restaurant=None, detail=None):
    PlatformActionLog.objects.create(
        actor=actor,
        action=action,
        target_restaurant=restaurant,
        detail=detail or {},
    )


# ---------------------------------------------------------------------------
# Tenant list / detail
# ---------------------------------------------------------------------------

class TenantListView(generics.ListAPIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS
    serializer_class = TenantListSerializer

    def get_queryset(self):
        restaurants = list(Restaurant.objects.order_by("name"))
        subs = {
            sub.billing_account_id: sub
            for sub in Subscription.objects.select_related("plan").all()
        }
        for r in restaurants:
            r._subscription = subs.get(r.billing_account_id)
        return restaurants


class TenantDetailView(generics.RetrieveAPIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS
    serializer_class = TenantDetailSerializer
    queryset = Restaurant.objects.all()


# ---------------------------------------------------------------------------
# Lifecycle actions
# ---------------------------------------------------------------------------

class TenantSuspendView(APIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS

    def post(self, request, pk):
        restaurant = _get_restaurant(pk)
        notes = request.data.get("notes", "")
        suspend_tenant(
            restaurant,
            reason="platform_admin",
            triggered_by=request.user,
            notes=notes,
        )
        _log(request.user, "suspend_tenant", restaurant, {"notes": notes})
        return Response({"detail": "suspended"})


class TenantReactivateView(APIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS

    def post(self, request, pk):
        restaurant = _get_restaurant(pk)
        reactivate_tenant(restaurant)
        _log(request.user, "reactivate_tenant", restaurant)
        return Response({"detail": "reactivated"})


class TenantCancelView(APIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS

    def post(self, request, pk):
        restaurant = _get_restaurant(pk)
        notes = request.data.get("notes", "")
        cancel_tenant(
            restaurant,
            reason="platform_admin",
            triggered_by=request.user,
            notes=notes,
        )
        _log(request.user, "cancel_tenant", restaurant, {"notes": notes})
        return Response({"detail": "cancelled"})


class TenantDeleteView(APIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS

    def post(self, request, pk):
        restaurant = _get_restaurant(pk)
        try:
            billing_account = restaurant.billing_account
            sub = getattr(billing_account, "subscription", None)
        except Exception:
            sub = None
        if sub is None or sub.status != Subscription.STATUS_CANCELLED:
            return Response(
                {"detail": "Tenant must be in 'cancelled' status before deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        schedule_schema_deletion(restaurant)
        _log(request.user, "schedule_deletion", restaurant)
        return Response({"detail": "schema deletion scheduled"})


# ---------------------------------------------------------------------------
# Subscription override
# ---------------------------------------------------------------------------

class SubscriptionOverrideView(APIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS

    def patch(self, request, pk):
        restaurant = _get_restaurant(pk)
        serializer = SubscriptionOverrideSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sub = override_subscription(restaurant, request.user, **serializer.validated_data)
        return Response(SubscriptionOverrideSerializer(sub).data)


# ---------------------------------------------------------------------------
# Event logs
# ---------------------------------------------------------------------------

class TenantLifecycleEventListView(generics.ListAPIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS
    serializer_class = TenantLifecycleEventSerializer

    def get_queryset(self):
        restaurant = _get_restaurant(self.kwargs["pk"])
        return TenantLifecycleEvent.objects.filter(restaurant=restaurant)


class PlatformActionLogListView(generics.ListAPIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS
    serializer_class = PlatformActionLogSerializer
    queryset = PlatformActionLog.objects.all()


# ---------------------------------------------------------------------------
# Impersonation
# ---------------------------------------------------------------------------

class ImpersonateView(APIView):
    authentication_classes = _PLATFORM_AUTH
    permission_classes = _PLATFORM_PERMISSIONS

    def post(self, request, pk):
        restaurant = _get_restaurant(pk)
        raw_token = create_impersonation_token(restaurant, request.user)
        return Response({"token": raw_token})


class ImpersonateExchangeView(APIView):
    permission_classes: list[type] = []  # Token is the credential.
    authentication_classes = [SessionAuthentication]

    def post(self, request):
        raw_token = request.data.get("token", "")
        restaurant_id = request.data.get("restaurant_id", "")
        try:
            restaurant = exchange_impersonation_token(raw_token, restaurant_id)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        request.session["impersonating_restaurant_id"] = str(restaurant.pk)
        return Response({"detail": "ok"})
