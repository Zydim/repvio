# Repvio

KI-gestützte Fitness-App mit Video-Analyse für 17 Übungen. Lädt ein kurzes Video hoch, extrahiert automatisch Schlüssel-Frames und bewertet die Technik mit Claude Vision.

## Tech-Stack

| Layer     | Technologie                          |
|-----------|--------------------------------------|
| Frontend  | Next.js, TypeScript, Tailwind CSS v4 |
| Backend   | FastAPI, Python 3.x                  |
| Datenbank | PostgreSQL (Railway) / SQLite lokal  |
| KI        | Claude Sonnet (Vision)               |
| Auth      | NextAuth (Credentials)               |
| Hosting   | Railway (Backend + DB), Vercel (Frontend) |

## Unterstützte Übungen

Bankdrücken, Schrägbankdrücken, Dips, Klimmzüge, Chin-Ups, Muscle-Ups, Kniebeuge, Kreuzheben, Rumänisches Kreuzheben, Hip Thrust, Bulgarian Split Squat, Ausfallschritte, Step Up Kabelzug, Schulterpress Langhantel, Seitheben Kabelturm, Face Pulls, Rudern Kabelzug

## Lokales Setup

### Voraussetzungen

- Python 3.11+
- Node.js 18+
- ffmpeg (`brew install ffmpeg`)
- Anthropic API Key

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

`backend/.env` anlegen:

```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite:///./repvio.db   # oder PostgreSQL URL
SECRET_KEY=dein-secret
NEXTAUTH_SECRET=dein-secret
REGISTRATION_OPEN=false
```

```bash
uvicorn main:app --reload --port 8000
```

Prüfen: http://localhost:8000/ → `{"status":"ok","app":"Repvio API"}`

### 2. Frontend

```bash
cd frontend
npm install
```

`frontend/.env.local` anlegen:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dein-secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Öffne: http://localhost:3000

## Pläne & Limits

| Plan  | Analysen / Monat |
|-------|-----------------|
| Free  | 3               |
| Beta  | 10              |
| Pro   | 30              |
| Elite | 100             |

## Beta-Betrieb

Registrierung ist standardmäßig deaktiviert (`REGISTRATION_OPEN=false`). Beta-Tester-Accounts werden manuell mit `backend/create_beta_testers.py` erstellt.
