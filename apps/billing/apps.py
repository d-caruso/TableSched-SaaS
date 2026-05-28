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
