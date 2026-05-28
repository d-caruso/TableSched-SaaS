"""SaaS Stripe subscription webhook handler."""

from __future__ import annotations

import json
import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger("billing")

_HANDLED_EVENTS = {
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
}


@csrf_exempt
@require_POST
def stripe_subscription_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    secret = getattr(settings, "STRIPE_SUBSCRIPTION_WEBHOOK_SECRET", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, secret)
    except stripe.errors.SignatureVerificationError:
        logger.warning("stripe_subscription_webhook_bad_sig")
        return HttpResponse(status=400)
    except Exception:
        logger.exception("stripe_subscription_webhook_parse_error")
        return HttpResponse(status=400)

    event_type = event["type"]
    if event_type not in _HANDLED_EVENTS:
        return HttpResponse(status=200)

    try:
        _dispatch(event)
    except Exception:
        logger.exception("stripe_subscription_webhook_handler_error", extra={"event_type": event_type})
        return HttpResponse(status=500)

    return HttpResponse(status=200)


def _dispatch(event) -> None:
    from apps.billing.lifecycle import cancel_tenant, reactivate_tenant, suspend_tenant
    from apps.billing.models import Plan, Subscription

    event_type = event["type"]
    data = event["data"]["object"]
    stripe_event_id = event.get("id", "")

    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        _handle_subscription_upsert(data, Subscription, Plan)

    elif event_type == "customer.subscription.deleted":
        sub = Subscription.objects.filter(stripe_subscription_id=data["id"]).first()
        if sub:
            for restaurant in sub.billing_account.restaurants.all():
                cancel_tenant(
                    restaurant,
                    reason="owner_cancelled",
                    notes=f"Stripe event: {stripe_event_id}",
                )

    elif event_type == "invoice.paid":
        stripe_sub_id = data.get("subscription")
        if stripe_sub_id:
            sub = Subscription.objects.select_related("billing_account").filter(
                stripe_subscription_id=stripe_sub_id
            ).first()
            if sub:
                if sub.status == Subscription.STATUS_SUSPENDED:
                    for restaurant in sub.billing_account.restaurants.all():
                        reactivate_tenant(restaurant, stripe_event_id=stripe_event_id)
                else:
                    Subscription.objects.filter(pk=sub.pk).update(
                        status=Subscription.STATUS_ACTIVE,
                    )
            # Update current_period_end regardless.
            raw_end = data.get("lines", {}).get("data", [{}])[0].get("period", {}).get("end")
            if raw_end and stripe_sub_id:
                from datetime import datetime, timezone as dt_tz
                period_end = datetime.fromtimestamp(raw_end, tz=dt_tz.utc)
                Subscription.objects.filter(stripe_subscription_id=stripe_sub_id).update(
                    current_period_end=period_end,
                )

    elif event_type == "invoice.payment_failed":
        stripe_sub_id = data.get("subscription")
        if stripe_sub_id:
            sub = Subscription.objects.select_related("billing_account").filter(
                stripe_subscription_id=stripe_sub_id
            ).first()
            if sub and sub.status == Subscription.STATUS_ACTIVE:
                for restaurant in sub.billing_account.restaurants.all():
                    suspend_tenant(
                        restaurant,
                        reason="invoice.payment_failed",
                        stripe_event_id=stripe_event_id,
                    )


def _handle_subscription_upsert(data, Subscription, Plan) -> None:
    stripe_sub_id = data["id"]
    stripe_customer_id = data.get("customer", "")
    status_map = {
        "active": Subscription.STATUS_ACTIVE,
        "trialing": Subscription.STATUS_TRIALING,
        "past_due": Subscription.STATUS_PAST_DUE,
        "canceled": Subscription.STATUS_CANCELLED,
    }
    status = status_map.get(data.get("status", ""), Subscription.STATUS_ACTIVE)

    # Resolve period end.
    period_end = None
    raw_end = data.get("current_period_end")
    if raw_end:
        from datetime import datetime, timezone as dt_tz
        period_end = datetime.fromtimestamp(raw_end, tz=dt_tz.utc)

    # Resolve plan from the first item's price ID.
    plan = None
    items = data.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id", "")
        plan = Plan.objects.filter(stripe_price_id=price_id).first()

    updates = {
        "stripe_customer_id": stripe_customer_id,
        "status": status,
        "current_period_end": period_end,
    }
    if plan:
        updates["plan"] = plan

    Subscription.objects.filter(stripe_subscription_id=stripe_sub_id).update(**updates)
