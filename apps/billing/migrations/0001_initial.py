from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("tenants", "0005_backfill_default_billing_account"),
    ]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(max_length=32, unique=True)),
                ("display_name", models.CharField(max_length=64)),
                ("price_cents", models.PositiveIntegerField(default=0)),
                ("stripe_price_id", models.CharField(blank=True, max_length=128)),
                ("stripe_sms_price_id", models.CharField(blank=True, max_length=128)),
                ("max_locations", models.PositiveSmallIntegerField(default=1)),
                ("max_staff_per_location", models.PositiveSmallIntegerField(default=1)),
                ("max_tables", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("max_rooms", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("max_bookings_per_month", models.PositiveIntegerField(blank=True, null=True)),
                ("sms_daily_quota", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("feature_flags", models.JSONField(default=dict)),
            ],
            options={"ordering": ["price_cents"]},
        ),
        migrations.CreateModel(
            name="Subscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(
                    choices=[
                        ("active", "Active"),
                        ("trialing", "Trialing"),
                        ("past_due", "Past due"),
                        ("cancelled", "Cancelled"),
                    ],
                    default="active",
                    max_length=32,
                )),
                ("stripe_subscription_id", models.CharField(blank=True, db_index=True, max_length=128)),
                ("stripe_customer_id", models.CharField(blank=True, db_index=True, max_length=128)),
                ("trial_ends_at", models.DateTimeField(blank=True, null=True)),
                ("current_period_end", models.DateTimeField(blank=True, null=True)),
                ("cancelled_at", models.DateTimeField(blank=True, null=True)),
                ("location_limit_override", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("billing_account", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="subscription",
                    to="tenants.billingaccount",
                )),
                ("plan", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="subscriptions",
                    to="billing.plan",
                )),
            ],
        ),
        migrations.CreateModel(
            name="MonthlyBookingUsage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("year", models.PositiveSmallIntegerField()),
                ("month", models.PositiveSmallIntegerField()),
                ("count", models.PositiveIntegerField(default=0)),
                ("restaurant", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="monthly_booking_usage",
                    to="tenants.restaurant",
                )),
            ],
        ),
        migrations.AddConstraint(
            model_name="monthlybookingusage",
            constraint=models.UniqueConstraint(
                fields=["restaurant", "year", "month"],
                name="uniq_restaurant_month",
            ),
        ),
        migrations.CreateModel(
            name="DailySmsUsage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("count", models.PositiveIntegerField(default=0)),
                ("overage_reported_count", models.PositiveIntegerField(default=0)),
                ("billing_account", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="daily_sms_usage",
                    to="tenants.billingaccount",
                )),
            ],
        ),
        migrations.AddConstraint(
            model_name="dailysmsusage",
            constraint=models.UniqueConstraint(
                fields=["billing_account", "date"],
                name="uniq_billing_account_date",
            ),
        ),
    ]
