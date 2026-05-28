"""Billing service functions."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timezone

import stripe
from django.conf import settings
from django.db.models import F
from django.utils import timezone as dj_timezone

from apps.billing.models import DailySmsUsage, MonthlyBookingUsage, Plan, Subscription

logger = logging.getLogger("billing")


@dataclass
class PlanLimits:
    max_locations: int
    max_staff_per_location: int
    max_tables: int | None
    max_rooms: int | None
    max_bookings_per_month: int | None
    sms_daily_quota: int | None
    feature_flags: dict


def _free_plan_limits() -> PlanLimits:
    try:
        plan = Plan.objects.get(slug="free")
        return PlanLimits(
            max_locations=plan.max_locations,
            max_staff_per_location=plan.max_staff_per_location,
            max_tables=plan.max_tables,
            max_rooms=plan.max_rooms,
            max_bookings_per_month=plan.max_bookings_per_month,
            sms_daily_quota=plan.sms_daily_quota,
            feature_flags=plan.feature_flags,
        )
    except Plan.DoesNotExist:
        # Fallback hard-coded values if seed hasn't run yet.
        return PlanLimits(
            max_locations=1,
            max_staff_per_location=1,
            max_tables=10,
            max_rooms=2,
            max_bookings_per_month=50,
            sms_daily_quota=None,
            feature_flags={},
        )


def get_subscription(billing_account) -> Subscription | None:
    try:
        return billing_account.subscription
    except Subscription.DoesNotExist:
        return None


def get_effective_limits(billing_account) -> PlanLimits:
    sub = get_subscription(billing_account)
    if sub is None:
        return _free_plan_limits()
    plan = sub.plan
    max_locations = (
        sub.location_limit_override
        if sub.location_limit_override is not None
        else plan.max_locations
    )
    return PlanLimits(
        max_locations=max_locations,
        max_staff_per_location=plan.max_staff_per_location,
        max_tables=plan.max_tables,
        max_rooms=plan.max_rooms,
        max_bookings_per_month=plan.max_bookings_per_month,
        sms_daily_quota=plan.sms_daily_quota,
        feature_flags=plan.feature_flags,
    )


def check_booking_quota(restaurant) -> bool:
    """Return True if the tenant can create another booking this month."""
    limits = get_effective_limits(restaurant.billing_account)
    if limits.max_bookings_per_month is None:
        return True
    now = dj_timezone.now()
    usage, _ = MonthlyBookingUsage.objects.get_or_create(
        restaurant=restaurant, year=now.year, month=now.month
    )
    return usage.count < limits.max_bookings_per_month


def increment_booking_count(restaurant) -> None:
    now = dj_timezone.now()
    MonthlyBookingUsage.objects.filter(
        restaurant=restaurant, year=now.year, month=now.month
    ).update(count=F("count") + 1)


def check_sms_quota(billing_account) -> bool:
    """Return True if the account can send another SMS today."""
    limits = get_effective_limits(billing_account)
    if limits.sms_daily_quota is None:
        return False  # No SMS entitlement on this plan.
    today = dj_timezone.now().date()
    usage = DailySmsUsage.objects.filter(billing_account=billing_account, date=today).first()
    count = usage.count if usage else 0
    return count < limits.sms_daily_quota


def record_sms_sent(billing_account) -> None:
    today = dj_timezone.now().date()
    DailySmsUsage.objects.update_or_create(
        billing_account=billing_account,
        date=today,
        defaults={},
    )
    DailySmsUsage.objects.filter(billing_account=billing_account, date=today).update(
        count=F("count") + 1
    )


def report_sms_overage_to_stripe(billing_account, count: int) -> None:
    sub = get_subscription(billing_account)
    if sub is None or not sub.stripe_subscription_id:
        return
    plan = sub.plan
    if not plan.stripe_sms_price_id:
        return
    try:
        stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")
        stripe.billing.MeterEvent.create(
            event_name="sms_overage",
            payload={
                "stripe_customer_id": sub.stripe_customer_id,
                "value": str(count),
            },
        )
    except stripe.StripeError:
        logger.exception("stripe_sms_overage_failed", extra={"billing_account_id": billing_account.pk})


def free_tier_available() -> bool:
    """Return True if the Free plan is still open to new signups."""
    max_free = getattr(settings, "SAAS_MAX_FREE_TENANTS", None)
    if max_free is None:
        return True
    count = Subscription.objects.filter(plan__slug="free", status=Subscription.STATUS_ACTIVE).count()
    return count < max_free
