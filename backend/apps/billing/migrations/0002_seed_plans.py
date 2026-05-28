"""Seed the three plan tiers. Prices and limits match docs/saas-roadmap.md."""

from django.db import migrations

PLANS = [
    {
        "slug": "free",
        "display_name": "Free",
        "price_cents": 0,
        "max_locations": 1,
        "max_staff_per_location": 1,
        "max_tables": 10,
        "max_rooms": 2,
        "max_bookings_per_month": 50,
        "sms_daily_quota": None,
        "feature_flags": {
            "sms_notifications": False,
            "booking_reminders": False,
            "cross_location_analytics": False,
        },
    },
    {
        "slug": "premium",
        "display_name": "Premium",
        "price_cents": 2900,
        "max_locations": 3,
        "max_staff_per_location": 3,
        "max_tables": None,
        "max_rooms": None,
        "max_bookings_per_month": None,
        "sms_daily_quota": 10,
        "feature_flags": {
            "sms_notifications": True,
            "booking_reminders": True,
            "cross_location_analytics": False,
        },
    },
    {
        "slug": "enterprise",
        "display_name": "Enterprise",
        "price_cents": 7900,
        "max_locations": 8,
        "max_staff_per_location": 10,
        "max_tables": None,
        "max_rooms": None,
        "max_bookings_per_month": None,
        "sms_daily_quota": 30,
        "feature_flags": {
            "sms_notifications": True,
            "booking_reminders": True,
            "cross_location_analytics": True,
        },
    },
]


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    for data in PLANS:
        Plan.objects.update_or_create(slug=data["slug"], defaults=data)


def unseed_plans(apps, schema_editor):
    Plan = apps.get_model("billing", "Plan")
    Plan.objects.filter(slug__in=[p["slug"] for p in PLANS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plans, reverse_code=unseed_plans),
    ]
