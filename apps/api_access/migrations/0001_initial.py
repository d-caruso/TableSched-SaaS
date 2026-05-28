from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("tenants", "0005_backfill_default_billing_account"),
    ]

    operations = [
        migrations.CreateModel(
            name="APIKey",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=128)),
                ("key_hash", models.CharField(db_index=True, max_length=128, unique=True)),
                ("key_prefix", models.CharField(max_length=8)),
                ("is_active", models.BooleanField(default=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("billing_account", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="api_keys",
                    to="tenants.billingaccount",
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="APIUsageLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("year", models.PositiveSmallIntegerField()),
                ("month", models.PositiveSmallIntegerField()),
                ("call_count", models.PositiveIntegerField(default=0)),
                ("api_key", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="usage_logs",
                    to="api_access.apikey",
                )),
            ],
        ),
        migrations.AddConstraint(
            model_name="apiusagelog",
            constraint=models.UniqueConstraint(
                fields=["api_key", "year", "month"],
                name="uniq_api_key_month",
            ),
        ),
    ]
