"""Unit tests for SMS provider adapters."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from apps.sms.protocol import PermanentSMSError, TransientSMSError


# ---------------------------------------------------------------------------
# Twilio adapter
# ---------------------------------------------------------------------------

class TestTwilioSMSAdapter:
    def test_send_success_returns_sid(self):
        from apps.sms.providers.twilio.adapter import TwilioSMSAdapter
        mock_send = MagicMock(return_value="SM_TEST_123")
        with patch("apps.notifications.providers.twilio.adapter.TwilioSMSProvider.send", mock_send):
            result = TwilioSMSAdapter().send(phone="+39123", body="hello")
        assert result == "SM_TEST_123"

    def test_permanent_twilio_error_raises_permanent(self):
        from apps.sms.providers.twilio.adapter import TwilioSMSAdapter
        from twilio.base.exceptions import TwilioRestException  # type: ignore[import-untyped]
        exc = TwilioRestException(400, "url", "Invalid number", code=21211)
        with patch("apps.notifications.providers.twilio.adapter.TwilioSMSProvider.send", side_effect=exc):
            with pytest.raises(PermanentSMSError):
                TwilioSMSAdapter().send(phone="+39invalid", body="hi")

    def test_transient_twilio_error_raises_transient(self):
        from apps.sms.providers.twilio.adapter import TwilioSMSAdapter
        from twilio.base.exceptions import TwilioRestException  # type: ignore[import-untyped]
        exc = TwilioRestException(503, "url", "Service unavailable", code=20003)
        with patch("apps.notifications.providers.twilio.adapter.TwilioSMSProvider.send", side_effect=exc):
            with pytest.raises(TransientSMSError):
                TwilioSMSAdapter().send(phone="+39123", body="hi")

    def test_handle_dlr_delivered(self):
        from apps.sms.providers.twilio.adapter import TwilioSMSAdapter
        ds = TwilioSMSAdapter().handle_dlr({"MessageSid": "SM1", "MessageStatus": "delivered", "ErrorCode": ""})
        assert ds.status == "delivered" and ds.message_id == "SM1"

    def test_handle_dlr_failed(self):
        from apps.sms.providers.twilio.adapter import TwilioSMSAdapter
        ds = TwilioSMSAdapter().handle_dlr({"MessageSid": "SM2", "MessageStatus": "failed", "ErrorCode": "30008"})
        assert ds.status == "failed" and ds.error_code == "30008"

    def test_handle_dlr_pending(self):
        from apps.sms.providers.twilio.adapter import TwilioSMSAdapter
        ds = TwilioSMSAdapter().handle_dlr({"MessageSid": "SM3", "MessageStatus": "sent", "ErrorCode": ""})
        assert ds.status == "pending"


# ---------------------------------------------------------------------------
# Infobip adapter
# ---------------------------------------------------------------------------

class TestInfobipSMSAdapter:
    def _make_response(self, status_code: int, json_body=None, text=""):
        resp = MagicMock()
        resp.status_code = status_code
        resp.json.return_value = json_body or {}
        resp.text = text
        return resp

    def test_send_success_returns_message_id(self, settings):
        settings.INFOBIP_API_KEY = "key"
        settings.INFOBIP_BASE_URL = "https://api.infobip.com"
        settings.INFOBIP_FROM = "Test"
        from apps.sms.providers.infobip.adapter import InfobipSMSAdapter
        resp = self._make_response(200, {"messages": [{"messageId": "IB_123"}]})
        with patch("requests.post", return_value=resp):
            result = InfobipSMSAdapter().send(phone="+39123", body="hi")
        assert result == "IB_123"

    def test_send_429_raises_transient(self, settings):
        settings.INFOBIP_API_KEY = "key"
        settings.INFOBIP_BASE_URL = "https://api.infobip.com"
        settings.INFOBIP_FROM = "Test"
        from apps.sms.providers.infobip.adapter import InfobipSMSAdapter
        resp = self._make_response(429, text="rate limit")
        with patch("requests.post", return_value=resp):
            with pytest.raises(TransientSMSError):
                InfobipSMSAdapter().send(phone="+39123", body="hi")

    def test_send_400_invalid_destination_raises_permanent(self, settings):
        settings.INFOBIP_API_KEY = "key"
        settings.INFOBIP_BASE_URL = "https://api.infobip.com"
        settings.INFOBIP_FROM = "Test"
        from apps.sms.providers.infobip.adapter import InfobipSMSAdapter
        resp = self._make_response(400, text="INVALID_DESTINATION_ADDRESS")
        with patch("requests.post", return_value=resp):
            with pytest.raises(PermanentSMSError):
                InfobipSMSAdapter().send(phone="+39bad", body="hi")

    def test_handle_dlr_delivered(self):
        from apps.sms.providers.infobip.adapter import InfobipSMSAdapter
        ds = InfobipSMSAdapter().handle_dlr({"result": [{"messageId": "IB1", "status": {"groupName": "DELIVERED"}, "error": {"id": 0}}]})
        assert ds.status == "delivered"

    def test_handle_dlr_failed(self):
        from apps.sms.providers.infobip.adapter import InfobipSMSAdapter
        ds = InfobipSMSAdapter().handle_dlr({"result": [{"messageId": "IB2", "status": {"groupName": "UNDELIVERABLE"}, "error": {"id": 5}}]})
        assert ds.status == "failed"


# ---------------------------------------------------------------------------
# SMSAPI adapter
# ---------------------------------------------------------------------------

class TestSMSAPISMSAdapter:
    def _make_response(self, status_code: int, json_body=None, text=""):
        resp = MagicMock()
        resp.status_code = status_code
        resp.json.return_value = json_body or {}
        resp.text = text
        return resp

    def test_send_success_returns_id(self, settings):
        settings.SMSAPI_TOKEN = "token"
        settings.SMSAPI_FROM = "Test"
        from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter
        resp = self._make_response(200, {"list": [{"id": "SA_123"}]})
        with patch("requests.post", return_value=resp):
            result = SMSAPISMSAdapter().send(phone="+39123", body="hi")
        assert result == "SA_123"

    def test_send_429_raises_transient(self, settings):
        settings.SMSAPI_TOKEN = "token"
        settings.SMSAPI_FROM = "Test"
        from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter
        resp = self._make_response(429, text="rate limit")
        with patch("requests.post", return_value=resp):
            with pytest.raises(TransientSMSError):
                SMSAPISMSAdapter().send(phone="+39123", body="hi")

    def test_send_permanent_error_code_raises_permanent(self, settings):
        settings.SMSAPI_TOKEN = "token"
        settings.SMSAPI_FROM = "Test"
        from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter
        resp = self._make_response(200, {"invalid": [{"code": 8}]})
        with patch("requests.post", return_value=resp):
            with pytest.raises(PermanentSMSError):
                SMSAPISMSAdapter().send(phone="+39bad", body="hi")

    def test_handle_dlr_delivered(self):
        from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter
        ds = SMSAPISMSAdapter().handle_dlr({"id": "SA1", "status": "DELIVERED", "err": 0})
        assert ds.status == "delivered"

    def test_handle_dlr_failed(self):
        from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter
        ds = SMSAPISMSAdapter().handle_dlr({"id": "SA2", "status": "UNDELIVERED", "err": 8})
        assert ds.status == "failed"

    def test_handle_dlr_pending(self):
        from apps.sms.providers.smsapi.adapter import SMSAPISMSAdapter
        ds = SMSAPISMSAdapter().handle_dlr({"id": "SA3", "status": "QUEUE", "err": 0})
        assert ds.status == "pending"
