"""Billing models — public schema, SaaS-only."""

from __future__ import annotations

from django.db import models
from django.db.models import UniqueConstraint

from apps.tenants.models import BillingAccount, Restaurant


class Plan(models.Model):
    """Pricing tier definition. Seeded via data migration; not tenant-editable."""

    slug = models.SlugField(max_length=32, unique=True)
    display_name = models.CharField(max_length=64)
    price_cents = models.PositiveIntegerField(default=0)
    stripe_price_id = models.CharField(max_length=128, blank=True)
    stripe_sms_price_id = models.CharField(max_length=128, blank=True)
    max_locations = models.PositiveSmallIntegerField(default=1)
    max_staff_per_location = models.PositiveSmallIntegerField(default=1)
    max_tables = models.PositiveSmallIntegerField(null=True, blank=True)
    max_rooms = models.PositiveSmallIntegerField(null=True, blank=True)
    max_bookings_per_month = models.PositiveIntegerField(null=True, blank=True)
    sms_daily_quota = models.PositiveSmallIntegerField(null=True, blank=True)
    feature_flags = models.JSONField(default=dict)

    class Meta:
        ordering = ["price_cents"]

    def __str__(self) -> str:
        return self.display_name


class Subscription(models.Model):
    """One per BillingAccount — links account to its current plan and Stripe subscription."""

    STATUS_ACTIVE = "active"
    STATUS_TRIALING = "trialing"
    STATUS_PAST_DUE = "past_due"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_TRIALING, "Trialing"),
        (STATUS_PAST_DUE, "Past due"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    billing_account = models.OneToOneField(
        BillingAccount, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    stripe_subscription_id = models.CharField(max_length=128, blank=True, db_index=True)
    stripe_customer_id = models.CharField(max_length=128, blank=True, db_index=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    location_limit_override = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.billing_account} / {self.plan.slug} / {self.status}"


class MonthlyBookingUsage(models.Model):
    """Booking count per tenant per calendar month (public schema)."""

    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name="monthly_booking_usage"
    )
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    count = models.PositiveIntegerField(default=0)

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

    billing_account = models.ForeignKey(
        BillingAccount, on_delete=models.CASCADE, related_name="daily_sms_usage"
    )
    date = models.DateField()
    count = models.PositiveIntegerField(default=0)
    overage_reported_count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["billing_account", "date"],
                name="uniq_billing_account_date",
            )
        ]

    def __str__(self) -> str:
        return f"{self.billing_account_id} {self.date}: {self.count}"
