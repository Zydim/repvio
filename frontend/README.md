# Repvio — KI-gestützte Fitness-Technik-Analyse

Repvio analysiert deine Trainingsvideos mit Claude AI und gibt dir präzises Technik-Feedback wie ein persönlicher Coach.

## Features

- **Video-Analyse** — Lade ein Video hoch und erhalte sofort KI-Feedback zu deiner Übungsausführung
- **Muskel-Fokus** — Wähle gezielt welchen Muskel du trainieren willst und erhalte angepasstes Feedback
- **Score & Korrekturen** — Bewertung von 0–100, konkrete Fehler mit Korrekturanweisungen
- **Trainingshistorie** — Alle deine Analysen auf einen Blick, Fortschritt verfolgen
- **Abo-Modelle** — Free (3/Monat), Pro (30/Monat), Elite (100/Monat)
- **Kamera-Guide** — Tipps für optimale Videoqualität direkt in der App

## Tech Stack

### Frontend
- **Next.js 14** (App Router) — React Framework
- **Tailwind CSS** — Styling
- **NextAuth.js** — Authentifizierung (Email + Google OAuth)
- **Stripe** — Zahlungsabwicklung
- **Vercel** — Hosting & Deployment

### Backend
- **FastAPI** (Python) — REST API
- **SQLAlchemy** + **PostgreSQL** — Datenbank
- **Anthropic Claude** — KI-Analyse (claude-sonnet-4-6 mit Prompt Caching)
- **FFmpeg** — Video-Frame-Extraktion
- **Stripe Webhooks** — Abo-Verwaltung
- **Resend** — Transaktions-E-Mails
- **Railway** — Backend Hosting

## Unterstützte Übungen

Bankdrücken, Schrägbankdrücken, Dips, Klimmzüge, Muscle-Ups, Chin-Ups, Seitheben, Schulterpress, Kniebeuge, Kreuzheben, Hip Thrust, Face Pulls

## Lokale Entwicklung

### Voraussetzungen
- Node.js 18+
- Python 3.13+
- FFmpeg installiert
- PostgreSQL (oder SQLite für lokale Entwicklung)

### Frontend starten

```bash
cd frontend
npm install
cp .env.example .env.local  # Umgebungsvariablen anpassen
npm run dev
```

### Backend starten

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Umgebungsvariablen anpassen
uvicorn main:app --reload
```

### Umgebungsvariablen Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Umgebungsvariablen Backend (`.env`)

```
ANTHROPIC_API_KEY=...
DATABASE_URL=sqlite:///./repvio.db
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=...
STRIPE_ELITE_PRICE_ID=...
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=...
```

## Deployment

- **Frontend** → Vercel (automatisches Deployment bei Git Push)
- **Backend** → Railway (automatisches Deployment bei Git Push, FFmpeg via nixpacks.toml)
- **Datenbank** → Railway PostgreSQL

## Abo-Modell

| Plan  | Analysen/Monat | Preis      |
|-------|---------------|------------|
| Free  | 3             | 0€         |
| Pro   | 30            | 9,99€/Monat|
| Elite | 100           | 19,99€/Monat|

## Sicherheit & Compliance

- Disposable-Email-Blocking bei Registrierung
- IP-basiertes Rate Limiting (10 Analysen/Monat für unangemeldete Nutzer)
- Account-Sperrung nach zu vielen fehlgeschlagenen Login-Versuchen
- EU AI Act konformes Disclaimer-Wording
- Keine medizinischen Diagnosen — nur biomechanisches Technik-Feedback
