"""Billing django-q async tasks."""

from __future__ import annotations

import logging
from datetime import date, timedelta

logger = logging.getLogger("billing")


def report_daily_sms_overage() -> None:
    """Report yesterday's SMS overage to Stripe for all paid billing accounts.

    Runs nightly. Idempotent: overage_reported_count tracks what has already
    been sent to Stripe so re-runs do not double-report.
    """
    from apps.billing.models import DailySmsUsage
    from apps.billing.services import get_effective_limits, report_sms_overage_to_stripe

    yesterday = date.today() - timedelta(days=1)
    rows = (
        DailySmsUsage.objects.filter(date=yesterday)
        .select_related("billing_account__subscription__plan")
    )

    for row in rows:
        billing_account = row.billing_account
        limits = get_effective_limits(billing_account)
        quota = limits.sms_daily_quota

        if quota is None:
            continue  # Plan has no SMS; nothing to report.

        overage = row.count - quota - row.overage_reported_count
        if overage <= 0:
            continue

        report_sms_overage_to_stripe(billing_account, overage)
        DailySmsUsage.objects.filter(pk=row.pk).update(
            overage_reported_count=row.overage_reported_count + overage
        )
        logger.info("sms_overage_reported", extra={
            "billing_account_id": billing_account.pk,
            "date": yesterday.isoformat(),
            "overage": overage,
        })
