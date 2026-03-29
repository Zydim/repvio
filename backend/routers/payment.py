import os

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from models.database import User, get_db

router = APIRouter(prefix="/payment")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

PRICE_MAP = {
    "pro": "price_1TGPZl1Mjn2g7FFmRt74Heg3",
    "elite": "price_1TGPZx1Mjn2g7FFmAebOA3ek",
}

FRONTEND_URL = os.getenv("CORS_ORIGIN", "http://localhost:3000")


class CheckoutRequest(BaseModel):
    email: EmailStr
    plan: str


@router.post("/create-checkout-session")
def create_checkout_session(body: CheckoutRequest, db: Session = Depends(get_db)):
    if body.plan not in PRICE_MAP:
        raise HTTPException(status_code=400, detail="Ungültiger Plan.")

    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")

    if user.plan == body.plan:
        raise HTTPException(status_code=400, detail=f"Du hast bereits den {body.plan.capitalize()}-Plan.")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": PRICE_MAP[body.plan], "quantity": 1}],
            customer_email=body.email,
            success_url=f"{FRONTEND_URL}/pricing?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/pricing?canceled=true",
            metadata={"user_email": body.email, "plan": body.plan},
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook-Secret nicht konfiguriert.")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Fehlende Webhook-Signatur.")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Ungültige Webhook-Signatur.")

    if event.get("type") == "checkout.session.completed":
        session_data = event["data"]["object"]
        user_email = session_data.get("metadata", {}).get("user_email")
        plan = session_data.get("metadata", {}).get("plan")

        if user_email and plan:
            user = db.query(User).filter(User.email == user_email).first()
            if user:
                user.plan = plan
                user.stripe_customer_id = session_data.get("customer")
                user.stripe_subscription_id = session_data.get("subscription")
                db.commit()

    return {"status": "ok"}


@router.post("/verify-session")
def verify_session(session_id: str, db: Session = Depends(get_db)):
    """Fallback: Verify checkout session and update plan if paid."""
    try:
        checkout_session = stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError:
        raise HTTPException(status_code=400, detail="Ungültige Session.")

    if checkout_session.payment_status != "paid":
        return {"status": "not_paid"}

    user_email = checkout_session.metadata.get("user_email")
    plan = checkout_session.metadata.get("plan")

    if user_email and plan:
        user = db.query(User).filter(User.email == user_email).first()
        if user and user.plan != plan:
            user.plan = plan
            user.stripe_customer_id = checkout_session.customer
            user.stripe_subscription_id = checkout_session.subscription
            db.commit()

    return {"status": "ok", "plan": plan}


class CancelRequest(BaseModel):
    email: EmailStr


@router.post("/cancel-subscription")
def cancel_subscription(body: CancelRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")
    if not user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="Kein aktives Abo gefunden.")
    try:
        stripe.Subscription.modify(
            user.stripe_subscription_id,
            cancel_at_period_end=True,
        )
        return {"message": "Abo wird zum Ende des Abrechnungszeitraums gekündigt."}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-plan")
def get_user_plan(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden.")
    return {
        "plan": user.plan,
        "analyses_this_month": user.analyses_this_month,
    }
