from django.urls import path

from apps.sms.webhooks.infobip import infobip_dlr
from apps.sms.webhooks.smsapi import smsapi_dlr
from apps.sms.webhooks.twilio import twilio_dlr

urlpatterns = [
    path("dlr/twilio/", twilio_dlr, name="sms-dlr-twilio"),
    path("dlr/infobip/", infobip_dlr, name="sms-dlr-infobip"),
    path("dlr/smsapi/", smsapi_dlr, name="sms-dlr-smsapi"),
]
