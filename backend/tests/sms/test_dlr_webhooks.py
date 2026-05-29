"""Tests for DLR webhook handlers: Twilio, Infobip, SMSAPI."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
from unittest.mock import MagicMock, patch

from django.test import RequestFactory


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_twilio_signature(auth_token: str, url: str, params: dict) -> str:
    sorted_params = sorted(params.items())
    url_with_params = url + "".join(k + v for k, v in sorted_params)
    return base64.b64encode(
        hmac.new(auth_token.encode(), url_with_params.encode(), hashlib.sha1).digest()
    ).decode()


def _make_infobip_signature(secret: str, body: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


_DoesNotExist = type("DoesNotExist", (Exception,), {})


def _mock_model_cls():
    """Return a mock SMSDeliveryLog class with a real DoesNotExist exception."""
    mock_cls = MagicMock()
    mock_cls.DoesNotExist = _DoesNotExist
    return mock_cls


def _mock_log(status="pending"):
    log = MagicMock()
    log.status = status
    log.error_code = ""
    log.delivered_at = None
    return log


# ---------------------------------------------------------------------------
# Twilio DLR
# ---------------------------------------------------------------------------

class TestTwilioDLR:
    factory = RequestFactory()

    def _post(self, params: dict, signature: str, url: str = "http://testserver/saas/sms/dlr/twilio/"):
        request = self.factory.post(url, data=params)
        request.META["HTTP_X_TWILIO_SIGNATURE"] = signature
        setattr(request, "build_absolute_uri", MagicMock(return_value=url))
        return request

    def test_valid_signature_delivered(self, settings):
        settings.TWILIO_AUTH_TOKEN = "secret"
        params = {"MessageSid": "SM123", "MessageStatus": "delivered"}
        sig = _make_twilio_signature("secret", "http://testserver/saas/sms/dlr/twilio/", params)
        request = self._post(params, sig)

        log = _mock_log()
        mock_model = _mock_model_cls()
        mock_model.objects.get.return_value = log
        with patch("apps.sms.webhooks.twilio.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.twilio import twilio_dlr
            response = twilio_dlr(request)

        assert response.status_code == 204
        assert log.status == "delivered"
        assert log.delivered_at is not None
        log.save.assert_called_once()

    def test_invalid_signature_returns_403(self, settings):
        settings.TWILIO_AUTH_TOKEN = "secret"
        params = {"MessageSid": "SM123", "MessageStatus": "delivered"}
        request = self._post(params, "bad-signature")

        from apps.sms.webhooks.twilio import twilio_dlr
        response = twilio_dlr(request)

        assert response.status_code == 403

    def test_unknown_message_id_returns_404(self, settings):
        settings.TWILIO_AUTH_TOKEN = "secret"
        params = {"MessageSid": "SM_UNKNOWN", "MessageStatus": "delivered"}
        sig = _make_twilio_signature("secret", "http://testserver/saas/sms/dlr/twilio/", params)
        request = self._post(params, sig)

        mock_model = _mock_model_cls()
        mock_model.objects.get.side_effect = mock_model.DoesNotExist
        with patch("apps.sms.webhooks.twilio.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.twilio import twilio_dlr
            response = twilio_dlr(request)

        assert response.status_code == 404

    def test_get_method_returns_405(self):
        request = self.factory.get("/saas/sms/dlr/twilio/")
        from apps.sms.webhooks.twilio import twilio_dlr
        response = twilio_dlr(request)
        assert response.status_code == 405

    def test_failed_status_sets_failed(self, settings):
        settings.TWILIO_AUTH_TOKEN = "secret"
        params = {"MessageSid": "SM123", "MessageStatus": "failed"}
        sig = _make_twilio_signature("secret", "http://testserver/saas/sms/dlr/twilio/", params)
        request = self._post(params, sig)

        log = _mock_log()
        mock_model = _mock_model_cls()
        mock_model.objects.get.return_value = log
        with patch("apps.sms.webhooks.twilio.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.twilio import twilio_dlr
            twilio_dlr(request)

        assert log.status == "failed"
        assert log.delivered_at is None


# ---------------------------------------------------------------------------
# Infobip DLR
# ---------------------------------------------------------------------------

class TestInfobipDLR:
    factory = RequestFactory()

    def _payload(self, message_id: str = "IB123", group_name: str = "DELIVERED") -> dict:
        return {
            "result": [
                {
                    "messageId": message_id,
                    "status": {"groupName": group_name},
                    "error": {"id": 0},
                }
            ]
        }

    def _post(self, payload: dict, secret: str = "secret"):
        body = json.dumps(payload).encode()
        sig = _make_infobip_signature(secret, body)
        request = self.factory.post(
            "/saas/sms/dlr/infobip/",
            data=body,
            content_type="application/json",
        )
        request.META["HTTP_X_HUB_SIGNATURE_256"] = sig
        return request

    def test_valid_signature_delivered(self, settings):
        settings.INFOBIP_WEBHOOK_SECRET = "secret"
        log = _mock_log()
        mock_model = _mock_model_cls()
        mock_model.objects.get.return_value = log
        with patch("apps.sms.webhooks.infobip.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.infobip import infobip_dlr
            response = infobip_dlr(self._post(self._payload()))

        assert response.status_code == 204
        assert log.status == "delivered"
        assert log.delivered_at is not None

    def test_invalid_signature_returns_403(self, settings):
        settings.INFOBIP_WEBHOOK_SECRET = "secret"
        body = json.dumps(self._payload()).encode()
        request = self.factory.post(
            "/saas/sms/dlr/infobip/",
            data=body,
            content_type="application/json",
        )
        request.META["HTTP_X_HUB_SIGNATURE_256"] = "sha256=badhash"

        from apps.sms.webhooks.infobip import infobip_dlr
        response = infobip_dlr(request)
        assert response.status_code == 403

    def test_unknown_message_id_returns_404(self, settings):
        settings.INFOBIP_WEBHOOK_SECRET = "secret"
        mock_model = _mock_model_cls()
        mock_model.objects.get.side_effect = mock_model.DoesNotExist
        with patch("apps.sms.webhooks.infobip.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.infobip import infobip_dlr
            response = infobip_dlr(self._post(self._payload(message_id="UNKNOWN")))

        assert response.status_code == 404

    def test_get_method_returns_405(self):
        request = self.factory.get("/saas/sms/dlr/infobip/")
        from apps.sms.webhooks.infobip import infobip_dlr
        response = infobip_dlr(request)
        assert response.status_code == 405

    def test_missing_secret_returns_403(self, settings):
        settings.INFOBIP_WEBHOOK_SECRET = ""
        from apps.sms.webhooks.infobip import infobip_dlr
        response = infobip_dlr(self._post(self._payload()))
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# SMSAPI DLR
# ---------------------------------------------------------------------------

class TestSMSAPIDLR:
    factory = RequestFactory()

    def _post(self, params: dict, client_ip: str = "91.216.191.10"):
        request = self.factory.post("/saas/sms/dlr/smsapi/", data=params)
        request.META["REMOTE_ADDR"] = client_ip
        return request

    def test_valid_ip_delivered(self, settings):
        settings.SMSAPI_WEBHOOK_ALLOWED_IPS = {"91.216.191.10"}
        log = _mock_log()
        mock_model = _mock_model_cls()
        mock_model.objects.get.return_value = log
        with patch("apps.sms.webhooks.smsapi.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.smsapi import smsapi_dlr
            response = smsapi_dlr(self._post({"id": "SA123", "status": "DELIVERED"}))

        assert response.status_code == 204
        assert log.status == "delivered"
        assert log.delivered_at is not None

    def test_disallowed_ip_returns_403(self, settings):
        settings.SMSAPI_WEBHOOK_ALLOWED_IPS = {"91.216.191.10"}
        from apps.sms.webhooks.smsapi import smsapi_dlr
        response = smsapi_dlr(self._post({"id": "SA123", "status": "DELIVERED"}, client_ip="1.2.3.4"))
        assert response.status_code == 403

    def test_empty_allowlist_returns_403(self, settings):
        settings.SMSAPI_WEBHOOK_ALLOWED_IPS = set()
        from apps.sms.webhooks.smsapi import smsapi_dlr
        response = smsapi_dlr(self._post({"id": "SA123", "status": "DELIVERED"}))
        assert response.status_code == 403

    def test_unknown_message_id_returns_404(self, settings):
        settings.SMSAPI_WEBHOOK_ALLOWED_IPS = {"91.216.191.10"}
        mock_model = _mock_model_cls()
        mock_model.objects.get.side_effect = mock_model.DoesNotExist
        with patch("apps.sms.webhooks.smsapi.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.smsapi import smsapi_dlr
            response = smsapi_dlr(self._post({"id": "UNKNOWN", "status": "DELIVERED"}))

        assert response.status_code == 404

    def test_get_method_returns_405(self):
        request = self.factory.get("/saas/sms/dlr/smsapi/")
        from apps.sms.webhooks.smsapi import smsapi_dlr
        response = smsapi_dlr(request)
        assert response.status_code == 405

    def test_forwarded_for_header_used(self, settings):
        settings.SMSAPI_WEBHOOK_ALLOWED_IPS = {"91.216.191.10"}
        request = self.factory.post("/saas/sms/dlr/smsapi/", data={"id": "SA123", "status": "DELIVERED"})
        request.META["HTTP_X_FORWARDED_FOR"] = "91.216.191.10, 10.0.0.1"
        request.META["REMOTE_ADDR"] = "10.0.0.1"

        log = _mock_log()
        mock_model = _mock_model_cls()
        mock_model.objects.get.return_value = log
        with patch("apps.sms.webhooks.smsapi.SMSDeliveryLog", mock_model):
            from apps.sms.webhooks.smsapi import smsapi_dlr
            response = smsapi_dlr(request)

        assert response.status_code == 204
