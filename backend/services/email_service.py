import os
import resend
from dotenv import load_dotenv

load_dotenv(override=True)

resend.api_key = os.getenv("RESEND_API_KEY", "")

FRONTEND_URL = os.getenv("CORS_ORIGIN", "http://localhost:3000")


def send_verification_email(to_email: str, token: str):
    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"

    resend.Emails.send({
        "from": "Repvio <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Bestätige deine E-Mail – Repvio",
        "html": f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Willkommen bei Repvio!</h1>
            <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
                Klicke auf den Button um deine E-Mail-Adresse zu bestätigen.
            </p>
            <a href="{verify_link}"
               style="display: inline-block; background: #fff; color: #09090b; padding: 12px 32px;
                      border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
                E-Mail bestätigen
            </a>
            <p style="color: #52525b; font-size: 12px; margin-top: 32px;">
                Oder kopiere diesen Link: {verify_link}
            </p>
        </div>
        """,
    })


def send_password_reset_email(to_email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    resend.Emails.send({
        "from": "Repvio <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Passwort zurücksetzen – Repvio",
        "html": f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Passwort zurücksetzen</h1>
            <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
                Klicke auf den Button um ein neues Passwort zu setzen. Der Link ist 1 Stunde gültig.
            </p>
            <a href="{reset_link}"
               style="display: inline-block; background: #fff; color: #09090b; padding: 12px 32px;
                      border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Neues Passwort setzen
            </a>
            <p style="color: #52525b; font-size: 12px; margin-top: 32px;">
                Oder kopiere diesen Link: {reset_link}
            </p>
            <p style="color: #52525b; font-size: 12px; margin-top: 16px;">
                Falls du kein neues Passwort angefordert hast, ignoriere diese E-Mail.
            </p>
        </div>
        """,
    })
