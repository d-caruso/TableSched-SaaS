import uuid

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SMSDeliveryLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("notification_log_id", models.UUIDField(blank=True, db_index=True, null=True)),
                ("provider", models.CharField(max_length=32)),
                ("provider_message_id", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(
                    choices=[("pending", "Pending"), ("delivered", "Delivered"), ("failed", "Failed")],
                    default="pending",
                    max_length=16,
                )),
                ("error_code", models.CharField(blank=True, max_length=64)),
                ("phone", models.CharField(max_length=32)),
                ("sent_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "ordering": ["-sent_at"],
            },
        ),
        migrations.AddIndex(
            model_name="smsdeliverylog",
            index=models.Index(fields=["provider", "status", "sent_at"], name="sms_deliv_prov_stat_sent_idx"),
        ),
        migrations.AddIndex(
            model_name="smsdeliverylog",
            index=models.Index(fields=["provider_message_id"], name="sms_deliv_msg_id_idx"),
        ),
    ]
