from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0002_seed_plans"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tenants", "0005_backfill_default_billing_account"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantLifecycleEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("from_status", models.CharField(max_length=32)),
                ("to_status", models.CharField(max_length=32)),
                ("reason", models.CharField(max_length=64)),
                ("stripe_event_id", models.CharField(blank=True, max_length=128)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("restaurant", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="lifecycle_events",
                    to="tenants.restaurant",
                )),
                ("triggered_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
