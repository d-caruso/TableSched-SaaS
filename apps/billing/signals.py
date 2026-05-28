"""Billing signal handlers — connect core lifecycle signals to billing state."""

from __future__ import annotations

import logging

logger = logging.getLogger("billing")


def _ensure_free_subscription(billing_account) -> None:
    from apps.billing.models import Plan, Subscription

    if Subscription.objects.filter(billing_account=billing_account).exists():
        return
    try:
        free_plan = Plan.objects.get(slug="free")
    except Plan.DoesNotExist:
        logger.error("free_plan_missing", extra={"billing_account_id": billing_account.pk})
        return
    Subscription.objects.create(
        billing_account=billing_account,
        plan=free_plan,
        status=Subscription.STATUS_ACTIVE,
    )
    logger.info("subscription_created", extra={
        "billing_account_id": billing_account.pk,
        "plan": "free",
    })


def handle_tenant_activated(sender, tenant, **kwargs) -> None:
    billing_account = getattr(tenant, "billing_account", None)
    if billing_account is None:
        return
    _ensure_free_subscription(billing_account)


def handle_tenant_onboarding_committed(sender, tenant, draft, **kwargs) -> None:
    billing_account = getattr(tenant, "billing_account", None)
    if billing_account is None:
        return
    _ensure_free_subscription(billing_account)
