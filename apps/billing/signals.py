"""Billing signal handlers — stubs expanded in doc 25."""


def handle_tenant_activated(sender, tenant, **kwargs):
    pass  # Create Stripe customer + subscription in doc 25.


def handle_tenant_onboarding_committed(sender, tenant, draft, **kwargs):
    pass  # Initialise billing account in doc 25.
