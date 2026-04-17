import bcrypt
import secrets
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from models.database import User, PasswordReset, BetaFeedback, get_db
from services.email_service import send_verification_email, send_password_reset_email

DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com",
    "throwaway.email", "yopmail.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "guerrillamail.info", "spam4.me", "trashmail.com", "trashmail.me",
    "trashmail.net", "dispostable.com", "maildrop.cc", "spamgourmet.com",
    "tempr.email", "discard.email", "mailnull.com", "spamhereplease.com",
    "spamex.com", "mailnesia.com", "spamfree24.org", "tempinbox.com",
    "fakeinbox.com", "mailforspam.com", "spamhole.com", "spamify.com",
    "mt2015.com", "spamthisplease.com", "getairmail.com", "filzmail.com",
    "throwam.com", "spamgob.com", "wegwerfmail.de", "muellmail.com",
    "trash-mail.at", "tempail.com", "emailondeck.com", "owlpic.com",
}

router = APIRouter(prefix="/auth")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


REGISTRATION_OPEN = os.getenv("REGISTRATION_OPEN", "false").lower() == "true"


@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if not REGISTRATION_OPEN:
        raise HTTPException(
            status_code=403,
            detail="Die Registrierung ist derzeit geschlossen. Repvio befindet sich in der Beta-Phase.",
        )
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben.")
    domain = body.email.split("@")[-1].lower()
    if domain in DISPOSABLE_DOMAINS:
        raise HTTPException(status_code=400, detail="Wegwerf-E-Mail-Adressen sind nicht erlaubt.")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert.")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    token = secrets.token_urlsafe(32)
    user = User(email=body.email, hashed_password=hashed, verification_token=token)
    db.add(user)
    db.commit()

    try:
        send_verification_email(body.email, token)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")

    return {"email": user.email, "message": "Bitte bestätige deine E-Mail-Adresse."}


MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch.")

    # Check lockout
    if user.locked_until and datetime.utcnow() < user.locked_until:
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(status_code=429, detail=f"Konto gesperrt. Versuche es in {remaining} Minuten erneut.")

    # Reset lockout if expired
    if user.locked_until and datetime.utcnow() >= user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None

    if not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            raise HTTPException(status_code=429, detail=f"Zu viele Versuche. Konto für {LOCKOUT_MINUTES} Minuten gesperrt.")
        db.commit()
        remaining = MAX_LOGIN_ATTEMPTS - user.failed_login_attempts
        raise HTTPException(status_code=401, detail=f"E-Mail oder Passwort falsch. Noch {remaining} Versuche.")

    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Bitte bestätige zuerst deine E-Mail-Adresse.")

    # Reset on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    return {"email": user.email}


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == body.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Ungültiger Verifizierungs-Token.")
    user.email_verified = 1
    user.verification_token = None
    db.commit()
    return {"message": "E-Mail erfolgreich bestätigt!", "email": user.email}


class ResendVerificationRequest(BaseModel):
    email: EmailStr


@router.post("/resend-verification")
def resend_verification(body: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or user.email_verified:
        return {"message": "Falls die E-Mail existiert, wurde ein neuer Link gesendet."}
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    db.commit()
    try:
        send_verification_email(body.email, token)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
    return {"message": "Falls die E-Mail existiert, wurde ein neuer Link gesendet."}


class SocialLoginRequest(BaseModel):
    email: EmailStr
    name: str = ""
    provider: str = "google"


@router.post("/social-login")
def social_login(body: SocialLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Auto-create user with random password (they use Google to login)
        random_pw = secrets.token_urlsafe(32)
        hashed = bcrypt.hashpw(random_pw.encode(), bcrypt.gensalt()).decode()
        user = User(email=body.email, hashed_password=hashed)
        db.add(user)
        db.commit()
    return {"email": user.email, "plan": user.plan}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "Falls die E-Mail existiert, wurde ein Reset-Link gesendet."}

    token = secrets.token_urlsafe(32)
    reset = PasswordReset(email=body.email, token=token)
    db.add(reset)
    db.commit()

    try:
        send_password_reset_email(body.email, token)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")

    return {"message": "Falls die E-Mail existiert, wurde ein Reset-Link gesendet."}


class DeleteAccountRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/delete-account")
def delete_account(body: DeleteAccountRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")
    # Google users have random password — allow deletion with special token or skip pw check
    if user.hashed_password and not user.hashed_password.startswith("$2"):
        raise HTTPException(status_code=400, detail="Konto kann nicht gelöscht werden.")
    if user.hashed_password and user.hashed_password.startswith("$2"):
        if not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
            raise HTTPException(status_code=401, detail="Falsches Passwort.")

    # Delete all related sessions and resets
    from models.database import AnalysisSession
    db.query(AnalysisSession).filter(AnalysisSession.user_email == body.email).delete()
    db.query(PasswordReset).filter(PasswordReset.email == body.email).delete()
    db.delete(user)
    db.commit()
    return {"message": "Konto wurde erfolgreich gelöscht."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben.")

    reset = db.query(PasswordReset).filter(
        PasswordReset.token == body.token,
        PasswordReset.used == 0
    ).first()

    if not reset:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Token.")

    # Check if token is older than 1 hour
    if datetime.utcnow() - reset.created_at > timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Token abgelaufen. Bitte erneut anfordern.")

    user = db.query(User).filter(User.email == reset.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Benutzer nicht gefunden.")

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user.hashed_password = hashed
    reset.used = 1
    db.commit()

    return {"message": "Passwort wurde erfolgreich zurückgesetzt."}


class BetaFeedbackRequest(BaseModel):
    email: EmailStr
    message: str


@router.post("/beta-feedback")
def submit_beta_feedback(body: BetaFeedbackRequest, db: Session = Depends(get_db)):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Feedback darf nicht leer sein.")
    if len(body.message) > 2000:
        raise HTTPException(status_code=400, detail="Feedback zu lang (max. 2000 Zeichen).")
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")
    feedback = BetaFeedback(user_email=body.email, message=body.message.strip())
    db.add(feedback)
    db.commit()
    return {"message": "Danke für dein Feedback!"}
