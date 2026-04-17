"""
Script: Beta-Tester Accounts erstellen
Erstellt 20 Accounts (beta1@repvio.app - beta20@repvio.app) mit
zufälligen Passwörtern, Plan "beta" (10 Analysen/Monat) und
email_verified=1. Gibt eine CSV-Datei aus.
"""
import csv
import secrets
import string
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
from datetime import datetime
from models.database import SessionLocal, User, create_tables

NUM_TESTERS = 20
EMAIL_DOMAIN = "repvio.app"
OUTPUT_CSV = "beta_testers.csv"


def generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    # Ensure at least one uppercase, one digit
    while True:
        pw = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.isupper() for c in pw) and any(c.isdigit() for c in pw):
            return pw


def main():
    create_tables()
    db = SessionLocal()
    created = []

    for i in range(1, NUM_TESTERS + 1):
        email = f"beta{i}@{EMAIL_DOMAIN}"
        password = generate_password()
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"[SKIP] {email} existiert bereits")
            continue

        user = User(
            email=email,
            hashed_password=hashed,
            plan="beta",
            email_verified=1,
            analyses_this_month=0,
            analyses_reset_at=datetime.utcnow(),
        )
        db.add(user)
        created.append({"email": email, "password": password})
        print(f"[OK] {email} — {password}")

    db.commit()
    db.close()

    if not created:
        print("\nKeine neuen Accounts erstellt.")
        return

    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "password"])
        writer.writeheader()
        writer.writerows(created)

    print(f"\n✓ {len(created)} Accounts erstellt → {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
