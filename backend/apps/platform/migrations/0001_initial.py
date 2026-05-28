from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tenants", "0005_backfill_default_billing_account"),
    ]

    operations = [
        migrations.CreateModel(
            name="ImpersonationToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token_hash", models.CharField(db_index=True, max_length=128, unique=True)),
                ("expires_at", models.DateTimeField()),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="issued_impersonation_tokens",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("restaurant", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="impersonation_tokens",
                    to="tenants.restaurant",
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="PlatformActionLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(max_length=64)),
                ("detail", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="platform_actions",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("target_restaurant", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="platform_action_logs",
                    to="tenants.restaurant",
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
