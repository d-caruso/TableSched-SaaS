from rest_framework import serializers

from apps.api_access.models import APIKey, APIUsageLog


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ["id", "name", "key_prefix", "is_active", "last_used_at", "expires_at", "created_at"]
        read_only_fields = ["key_prefix", "is_active", "last_used_at", "created_at"]


class APIKeyCreateSerializer(serializers.ModelSerializer):
    raw_key = serializers.CharField(read_only=True)

    class Meta:
        model = APIKey
        fields = ["id", "name", "expires_at", "key_prefix", "raw_key", "created_at"]
        read_only_fields = ["key_prefix", "raw_key", "created_at"]


class APIUsageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIUsageLog
        fields = ["id", "year", "month", "call_count"]
