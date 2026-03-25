# Repvio

KI-Fitness-App mit Video-Analyse für Kniebeuge, Bankdrücken & Kreuzheben.

## Voraussetzungen

- Python 3.x
- Node.js 18+
- ANTHROPIC_API_KEY
- Optional: ffmpeg (für Video-Frame-Extraktion)

## Setup & Start

### 1. ANTHROPIC_API_KEY eintragen

Öffne `backend/.env` und ersetze `dein_key_hier` mit deinem echten Key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Backend starten

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Prüfen: http://localhost:8000/ → `{"status":"ok","app":"Repvio API"}`

### 3. Frontend starten

```bash
cd frontend
npm run dev
```

Öffne: http://localhost:3000

## Tipps

- ffmpeg installieren für beste Video-Analyse: `brew install ffmpeg`
- SQLite-DB zurücksetzen: `rm backend/repvio.db`
- Port-Konflikt: `lsof -i :8000` und `kill -9 <PID>`

## Tech-Stack

| Layer     | Technologie                    |
|-----------|-------------------------------|
| Frontend  | Next.js 16, TypeScript, Tailwind v4 |
| Backend   | FastAPI, Python 3.x           |
| Datenbank | SQLite + SQLAlchemy           |
| KI        | Anthropic Claude Vision       |
