from django.urls import path

from apps.sms.webhooks.twilio import twilio_dlr

urlpatterns = [
    path("dlr/twilio/", twilio_dlr, name="sms-dlr-twilio"),
]
