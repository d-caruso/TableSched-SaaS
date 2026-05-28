from django.apps import AppConfig


class BillingConfig(AppConfig):
    name = "apps.billing"

    def ready(self):
        pass  # Signal handlers wired in doc 25.
