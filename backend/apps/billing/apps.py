from django.apps import AppConfig


class BillingConfig(AppConfig):
    name = "apps.billing"

    def ready(self):
        from apps.tenants.signals import tenant_activated, tenant_onboarding_committed
        from apps.billing.signals import (
            handle_tenant_activated,
            handle_tenant_onboarding_committed,
        )
        tenant_activated.connect(handle_tenant_activated)
        tenant_onboarding_committed.connect(handle_tenant_onboarding_committed)
        self._register_scheduled_tasks()

    def _register_scheduled_tasks(self) -> None:
        import django.db
        try:
            from django_q.models import Schedule

            Schedule.objects.get_or_create(
                name="billing.report_daily_sms_overage",
                defaults={
                    "func": "apps.billing.tasks.report_daily_sms_overage",
                    "schedule_type": Schedule.DAILY,
                    "repeats": -1,
                },
            )
        except django.db.OperationalError:
            # DB not reachable or migrations not yet applied — skip silently.
            pass
        except Exception:
            import logging
            logging.getLogger("billing").exception("failed_to_register_scheduled_tasks")
