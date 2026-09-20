"""
Alert dispatch — sends a real-world notification when a zone crosses into
HIGH/VERY_HIGH/CRITICAL risk. This is NOT wired to a live provider yet,
because that requires an account and API key only you can provide (see
SETUP.md's "Sending real alerts to phones" section for the concrete
options). What's here is the real integration code for each option,
ready to uncomment once you have credentials - not a fake/mocked call.

Call send_alert(...) from wherever a new HIGH+ risk alert is created
(e.g. in zones.py's get_alerts(), or a scheduled job that re-scores zones
periodically) once you've picked and configured a provider below.
"""
import os


def send_sms_msg91(phone_e164: str, message: str) -> None:
    """MSG91 (India-focused SMS, DLT-compliant - what most Indian gov/
    enterprise SMS senders use). Needs MSG91_AUTH_KEY and a registered
    DLT template ID.
    pip install requests
    """
    import requests
    auth_key = os.environ["MSG91_AUTH_KEY"]
    template_id = os.environ["MSG91_TEMPLATE_ID"]
    requests.post(
        "https://control.msg91.com/api/v5/flow/",
        headers={"authkey": auth_key, "Content-Type": "application/json"},
        json={
            "template_id": template_id,
            "recipients": [{"mobiles": phone_e164, "VAR1": message}],
        },
        timeout=10,
    )


def send_sms_twilio(phone_e164: str, message: str) -> None:
    """Twilio (global SMS). Needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER.
    pip install twilio
    """
    from twilio.rest import Client
    client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
    client.messages.create(body=message, from_=os.environ["TWILIO_FROM_NUMBER"], to=phone_e164)


def send_push_fcm(device_token: str, title: str, body: str) -> None:
    """Firebase Cloud Messaging (push notification to a phone/PWA) - the
    natural choice since you already have Google Cloud. Needs a Firebase
    service account JSON at GOOGLE_APPLICATION_CREDENTIALS.
    pip install firebase-admin
    """
    import firebase_admin
    from firebase_admin import credentials, messaging
    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"]))
    messaging.send(messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        token=device_token,
    ))


def send_alert(subscribers: list[dict], zone_name: str, risk_level: str) -> None:
    """
    subscribers: [{"phone": "+91XXXXXXXXXX", "device_token": "..."}], e.g.
    loaded from a `subscribers` table keyed by district (see SETUP.md).
    Wire this to whichever function(s) above you've configured.
    """
    message = f"LandslideGuard Alert: {risk_level} risk near {zone_name}. Avoid travel through this corridor."
    for sub in subscribers:
        if sub.get("phone"):
            pass  # send_sms_msg91(sub["phone"], message) or send_sms_twilio(...)
        if sub.get("device_token"):
            pass  # send_push_fcm(sub["device_token"], "Landslide Alert", message)
