from django.apps import AppConfig


class SMSConfig(AppConfig):
    name = "apps.sms"
    label = "sms"

    def ready(self) -> None:
        self._schedule_delivery_rate_check()

    @staticmethod
    def _schedule_delivery_rate_check() -> None:
        """Register the delivery-rate monitor as a recurring django-q schedule."""
        try:
            from django_q.models import Schedule

            Schedule.objects.get_or_create(
                func="apps.sms.tasks.check_delivery_rates",
                defaults={
                    "name": "SMS delivery rate check",
                    "schedule_type": Schedule.HOURLY,
                },
            )
        except Exception:
            # Table may not exist during migrations or tests — skip silently.
            pass
