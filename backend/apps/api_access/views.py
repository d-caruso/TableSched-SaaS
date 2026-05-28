"""Enterprise API key management views."""

from __future__ import annotations

import hashlib
import secrets

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api_access.models import APIKey, APIUsageLog, MAX_ACTIVE_KEYS_PER_ACCOUNT
from apps.api_access.permissions import IsEnterpriseOrgMember
from apps.api_access.serializers import APIKeyCreateSerializer, APIKeySerializer, APIUsageLogSerializer


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class APIKeyListCreateView(APIView):
    """GET: list active keys. POST: create new key (max 5)."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsEnterpriseOrgMember]

    def get(self, request):
        billing_account = request.tenant.billing_account
        keys = APIKey.objects.filter(billing_account=billing_account, is_active=True)
        return Response(APIKeySerializer(keys, many=True).data)

    def post(self, request):
        billing_account = request.tenant.billing_account
        active_count = APIKey.objects.filter(
            billing_account=billing_account, is_active=True
        ).count()
        if active_count >= MAX_ACTIVE_KEYS_PER_ACCOUNT:
            return Response(
                {"detail": f"Maximum {MAX_ACTIVE_KEYS_PER_ACCOUNT} active keys allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = APIKeyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw_key = f"tse_{secrets.token_urlsafe(40)}"
        key_hash = _hash(raw_key)
        key_prefix = raw_key[:8]

        api_key = APIKey.objects.create(
            billing_account=billing_account,
            name=serializer.validated_data["name"],
            key_hash=key_hash,
            key_prefix=key_prefix,
            expires_at=serializer.validated_data.get("expires_at"),
        )
        api_key.raw_key = raw_key
        return Response(APIKeyCreateSerializer(api_key).data, status=status.HTTP_201_CREATED)


class APIKeyRevokeView(APIView):
    """DELETE: revoke a key (set is_active=False)."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsEnterpriseOrgMember]

    def delete(self, request, pk):
        billing_account = request.tenant.billing_account
        try:
            api_key = APIKey.objects.get(pk=pk, billing_account=billing_account, is_active=True)
        except APIKey.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        api_key.is_active = False
        api_key.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class APIUsageLogView(APIView):
    """GET: monthly usage log for a specific key."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsEnterpriseOrgMember]

    def get(self, request, pk):
        billing_account = request.tenant.billing_account
        try:
            api_key = APIKey.objects.get(pk=pk, billing_account=billing_account)
        except APIKey.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        logs = APIUsageLog.objects.filter(api_key=api_key).order_by("-year", "-month")
        return Response(APIUsageLogSerializer(logs, many=True).data)
