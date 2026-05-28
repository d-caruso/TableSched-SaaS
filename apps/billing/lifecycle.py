"""Tenant lifecycle state machine and schema deletion."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.db import connection
from django.utils import timezone

from apps.billing.models import Subscription, TenantLifecycleEvent
from apps.billing.services import get_subscription

logger = logging.getLogger("billing")

# Legal transitions: (from_status, to_status)
_LEGAL_TRANSITIONS = {
    ("active", "suspended"),
    ("suspended", "active"),
    ("active", "cancelled"),
    ("suspended", "cancelled"),
}

_RETENTION_DAYS = 90


def tenant_is_active(tenant) -> bool:
    """Return False if the tenant subscription is suspended or cancelled.

    Called by TenantSuspensionMiddleware via TENANT_SUSPENSION_CHECK_FN.
    """
    if tenant is None:
        return True
    billing_account = getattr(tenant, "billing_account", None)
    if billing_account is None:
        return True
    sub = get_subscription(billing_account)
    if sub is None:
        return True  # Pre-SaaS tenant — no subscription row.
    return sub.status == Subscription.STATUS_ACTIVE


def suspend_tenant(
    restaurant,
    reason: str,
    triggered_by=None,
    stripe_event_id: str = "",
    notes: str = "",
) -> None:
    sub = get_subscription(restaurant.billing_account)
    if sub is None:
        return
    _transition(
        sub=sub,
        restaurant=restaurant,
        from_status=Subscription.STATUS_ACTIVE,
        to_status=Subscription.STATUS_SUSPENDED,
        reason=reason,
        triggered_by=triggered_by,
        stripe_event_id=stripe_event_id,
        notes=notes,
    )
    # Fire core signal so other subsystems can react (e.g. send notification).
    from apps.tenants.signals import tenant_suspended
    tenant_suspended.send(sender=restaurant.__class__, tenant=restaurant, reason=reason)


def reactivate_tenant(restaurant, stripe_event_id: str = "") -> None:
    sub = get_subscription(restaurant.billing_account)
    if sub is None:
        return
    _transition(
        sub=sub,
        restaurant=restaurant,
        from_status=Subscription.STATUS_SUSPENDED,
        to_status=Subscription.STATUS_ACTIVE,
        reason=TenantLifecycleEvent.REASON_PAYMENT_RECEIVED,
        stripe_event_id=stripe_event_id,
    )


def cancel_tenant(
    restaurant,
    reason: str,
    triggered_by=None,
    notes: str = "",
) -> None:
    sub = get_subscription(restaurant.billing_account)
    if sub is None:
        return
    from_status = sub.status
    _transition(
        sub=sub,
        restaurant=restaurant,
        from_status=from_status,
        to_status=Subscription.STATUS_CANCELLED,
        reason=reason,
        triggered_by=triggered_by,
        notes=notes,
    )
    Subscription.objects.filter(pk=sub.pk).update(cancelled_at=timezone.now())
    schedule_schema_deletion(restaurant)


def _transition(
    sub: Subscription,
    restaurant,
    from_status: str,
    to_status: str,
    reason: str,
    triggered_by=None,
    stripe_event_id: str = "",
    notes: str = "",
) -> None:
    if (from_status, to_status) not in _LEGAL_TRANSITIONS:
        raise ValueError(
            f"Illegal lifecycle transition: {from_status!r} → {to_status!r}"
        )
    if sub.status != from_status:
        logger.info(
            "lifecycle_transition_skipped",
            extra={
                "restaurant_id": restaurant.pk,
                "expected_status": from_status,
                "actual_status": sub.status,
                "to_status": to_status,
                "reason": reason,
            },
        )
        return  # Idempotent — already in target or wrong source state.

    Subscription.objects.filter(pk=sub.pk).update(status=to_status)
    sub.status = to_status  # Keep in-memory object in sync.

    TenantLifecycleEvent.objects.create(
        restaurant=restaurant,
        from_status=from_status,
        to_status=to_status,
        reason=reason,
        triggered_by=triggered_by,
        stripe_event_id=stripe_event_id,
        notes=notes,
    )
    logger.info("lifecycle_transition", extra={
        "restaurant_id": restaurant.pk,
        "from_status": from_status,
        "to_status": to_status,
        "reason": reason,
    })


def schedule_schema_deletion(restaurant) -> None:
    """Schedule delete_tenant_schema to run after the 90-day retention window."""
    try:
        from django_q.models import Schedule
        from django_q.tasks import schedule as q_schedule

        run_at = timezone.now() + timedelta(days=_RETENTION_DAYS)
        Schedule.objects.get_or_create(
            name=f"billing.delete_tenant_schema.{restaurant.pk}",
            defaults={
                "func": "apps.billing.lifecycle.delete_tenant_schema",
                "args": str(restaurant.pk),
                "schedule_type": Schedule.ONCE,
                "next_run": run_at,
                "repeats": 1,
            },
        )
    except Exception:
        logger.exception(
            "schedule_schema_deletion_failed",
            extra={"restaurant_id": restaurant.pk},
        )


def delete_tenant_schema(restaurant_id: int) -> None:
    """Irreversibly drop the tenant schema and delete the Restaurant row.

    Aborts if the subscription is not in 'cancelled' state (guard against
    accidental reactivation between scheduling and execution).
    """
    from apps.tenants.models import Restaurant

    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id)
    except Restaurant.DoesNotExist:
        logger.warning("delete_tenant_schema_not_found", extra={"restaurant_id": restaurant_id})
        return

    sub = get_subscription(restaurant.billing_account)
    if sub is None or sub.status != Subscription.STATUS_CANCELLED:
        logger.warning(
            "delete_tenant_schema_aborted",
            extra={"restaurant_id": restaurant_id, "status": getattr(sub, "status", None)},
        )
        return

    schema = restaurant.schema_name
    with connection.cursor() as cursor:
        cursor.execute(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE')  # noqa: S608

    TenantLifecycleEvent.objects.create(
        restaurant=restaurant,
        from_status=Subscription.STATUS_CANCELLED,
        to_status="deleted",
        reason=TenantLifecycleEvent.REASON_RETENTION_EXPIRED,
    )
    logger.info("tenant_schema_deleted", extra={"restaurant_id": restaurant_id, "schema": schema})
    restaurant.delete()
