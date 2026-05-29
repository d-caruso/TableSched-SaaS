"""Billing models — public schema, SaaS-only."""

from __future__ import annotations

import datetime

from django.db import models
from django.db.models import UniqueConstraint

from django.contrib.auth import get_user_model

from apps.tenants.models import BillingAccount, Restaurant


class Plan(models.Model):
    """Pricing tier definition. Seeded via data migration; not tenant-editable."""

    slug: str = models.SlugField(max_length=32, unique=True)
    display_name: str = models.CharField(max_length=64)
    price_cents: int = models.PositiveIntegerField(default=0)
    stripe_price_id: str = models.CharField(max_length=128, blank=True)
    stripe_sms_price_id: str = models.CharField(max_length=128, blank=True)
    max_locations: int = models.PositiveSmallIntegerField(default=1)
    max_staff_per_location: int = models.PositiveSmallIntegerField(default=1)
    max_tables: int | None = models.PositiveSmallIntegerField(null=True, blank=True)
    max_rooms: int | None = models.PositiveSmallIntegerField(null=True, blank=True)
    max_bookings_per_month: int | None = models.PositiveIntegerField(null=True, blank=True)
    sms_daily_quota: int | None = models.PositiveSmallIntegerField(null=True, blank=True)
    feature_flags: dict = models.JSONField(default=dict)

    class Meta:
        ordering = ["price_cents"]

    def __str__(self) -> str:
        return self.display_name


class Subscription(models.Model):
    """One per BillingAccount — links account to its current plan and Stripe subscription."""

    STATUS_ACTIVE = "active"
    STATUS_TRIALING = "trialing"
    STATUS_PAST_DUE = "past_due"
    STATUS_SUSPENDED = "suspended"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_TRIALING, "Trialing"),
        (STATUS_PAST_DUE, "Past due"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    billing_account_id: int
    billing_account: BillingAccount = models.OneToOneField(
        BillingAccount, on_delete=models.CASCADE, related_name="subscription"
    )
    plan_id: int
    plan: Plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    status: str = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    stripe_subscription_id: str = models.CharField(max_length=128, blank=True, db_index=True)
    stripe_customer_id: str = models.CharField(max_length=128, blank=True, db_index=True)
    trial_ends_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    current_period_end: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    cancelled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    location_limit_override: int | None = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.billing_account} / {self.plan.slug} / {self.status}"


class MonthlyBookingUsage(models.Model):
    """Booking count per tenant per calendar month (public schema)."""

    restaurant_id: int
    restaurant: Restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name="monthly_booking_usage"
    )
    year: int = models.PositiveSmallIntegerField()
    month: int = models.PositiveSmallIntegerField()
    count: int = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["restaurant", "year", "month"],
                name="uniq_restaurant_month",
            )
        ]

    def __str__(self) -> str:
        return f"{self.restaurant_id} {self.year}-{self.month:02d}: {self.count}"


class DailySmsUsage(models.Model):
    """SMS sent per BillingAccount per day — quota enforcement + Stripe overage tracking."""

    billing_account_id: int
    billing_account: BillingAccount = models.ForeignKey(
        BillingAccount, on_delete=models.CASCADE, related_name="daily_sms_usage"
    )
    date: datetime.date = models.DateField()
    count: int = models.PositiveIntegerField(default=0)
    overage_reported_count: int = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["billing_account", "date"],
                name="uniq_billing_account_date",
            )
        ]

    def __str__(self) -> str:
        return f"{self.billing_account_id} {self.date}: {self.count}"


class TenantLifecycleEvent(models.Model):
    """Append-only log of all tenant subscription state transitions."""

    REASON_PAYMENT_FAILED = "invoice.payment_failed"
    REASON_PAYMENT_RECEIVED = "invoice.paid"
    REASON_PLATFORM_ADMIN = "platform_admin"
    REASON_OWNER_CANCELLED = "owner_cancelled"
    REASON_RETENTION_EXPIRED = "retention_expired"

    restaurant_id: int | None
    restaurant: Restaurant | None = models.ForeignKey(
        Restaurant, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="lifecycle_events"
    )
    from_status: str = models.CharField(max_length=32)
    to_status: str = models.CharField(max_length=32)
    reason: str = models.CharField(max_length=64)
    triggered_by_id: int | None
    triggered_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL
    )
    stripe_event_id: str = models.CharField(max_length=128, blank=True)
    notes: str = models.TextField(blank=True)
    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.restaurant_id}: {self.from_status} → {self.to_status} ({self.reason})"
