"""Platform admin serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.billing.models import Subscription, TenantLifecycleEvent
from apps.platform.models import PlatformActionLog
from apps.tenants.models import Restaurant


class TenantListSerializer(serializers.ModelSerializer):
    subscription_status = serializers.SerializerMethodField()
    plan_slug = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = ["id", "name", "schema_name", "subscription_status", "plan_slug", "created_on"]

    def get_subscription_status(self, obj):
        sub = getattr(obj, "_subscription", None)
        return sub.status if sub else None

    def get_plan_slug(self, obj):
        sub = getattr(obj, "_subscription", None)
        return sub.plan.slug if sub else None


class TenantDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ["id", "name", "schema_name", "description", "default_language", "created_on"]


class SubscriptionOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["location_limit_override", "plan", "trial_ends_at", "status"]
        extra_kwargs = {field: {"required": False} for field in fields}


class TenantLifecycleEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantLifecycleEvent
        fields = [
            "id", "from_status", "to_status", "reason",
            "triggered_by", "stripe_event_id", "notes", "created_at",
        ]


class PlatformActionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformActionLog
        fields = ["id", "actor", "action", "target_restaurant", "detail", "created_at"]
