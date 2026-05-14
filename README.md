# Repvio

KI-gestützte Fitness-App mit Video-Analyse für 20 Übungen. Lädt ein kurzes Video hoch, extrahiert automatisch Schlüssel-Frames und bewertet die Technik mit Claude Vision.

## Tech-Stack

| Layer     | Technologie                                    |
|-----------|------------------------------------------------|
| Frontend  | Next.js 16, TypeScript, Tailwind CSS v4        |
| Backend   | FastAPI, Python 3.13                           |
| Datenbank | PostgreSQL (Railway) / SQLite lokal            |
| KI        | claude-sonnet-4-6 (Vision + Prompt Caching)    |
| Auth      | NextAuth (Credentials + JWT)                   |
| Hosting   | Railway (Backend + DB), Vercel (Frontend)      |

## Branch-Struktur

| Branch     | Inhalt                                      |
|------------|---------------------------------------------|
| `main`     | Stabiler Stand (Frontend + Backend)         |
| `frontend` | Frontend-only Änderungen (Next.js / React)  |
| `backend`  | Backend-only Änderungen (FastAPI / Python)  |

## Unterstützte Übungen (20)

Bankdrücken, Schrägbankdrücken, Dips, Klimmzüge, Chin-Ups, Muscle-Ups,
Kniebeuge, Front Squat, Zercher Squat, Kreuzheben, Rumänisches Kreuzheben,
Hip Thrust, Bulgarian Split Squat, Ausfallschritte, Step Up Kabelzug,
Schulterpress Kurzhantel, Seitheben Kabelturm, Face Pulls Kabelturm,
Rudern Kabelzug, Hammer Curls

## Projektstruktur

```
z-coach/
├── backend/
│   ├── main.py                  # FastAPI App
│   ├── routers/                 # analyze, history, auth, payment
│   ├── services/
│   │   └── claude_service.py    # KI-Bewertungslogik (Hauptdatei)
│   ├── models.py                # SQLAlchemy Modelle
│   ├── database.py
│   └── create_beta_testers.py
└── frontend/
    ├── app/                     # Next.js App Router
    │   ├── analyze/page.tsx     # Video-Upload & Analyse
    │   ├── history/page.tsx     # Trainingshistorie
    │   └── dashboard/page.tsx   # Fortschritts-Dashboard
    ├── components/
    │   ├── FeedbackCard.tsx     # Analyse-Ergebnis-Karte
    │   ├── VideoUploader.tsx    # Upload + mobile Kamera
    │   ├── HistoryTable.tsx     # Trainingshistorie
    │   ├── ProgressChart.tsx    # Fortschritts-Diagramm
    │   └── OnboardingModal.tsx  # Erstnutzer-Einführung
    └── lib/api.ts               # API-Client (axios)
```

## Lokales Setup

### Voraussetzungen

- Python 3.13
- Node.js 18+
- ffmpeg
- Anthropic API Key

#### ffmpeg installieren

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. https://ffmpeg.org/download.html → Windows Builds (z.B. gyan.dev)
2. ZIP entpacken, z.B. nach `C:\ffmpeg`
3. `C:\ffmpeg\bin` zur System-PATH-Variable hinzufügen
4. Testen: `ffmpeg -version` in einer neuen CMD

**Linux (Ubuntu/Debian):**
```bash
sudo apt install ffmpeg
```

---

### 1. Backend

```bash
cd backend
python -m venv venv
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

```bash
pip install -r requirements.txt
```

`backend/.env` anlegen:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite:///./repvio.db   # oder PostgreSQL URL
SECRET_KEY=dein-geheimer-schluessel
NEXTAUTH_SECRET=dein-nextauth-secret
REGISTRATION_OPEN=false
```

```bash
uvicorn main:app --reload --port 8000
```

Prüfen: http://localhost:8000/ → `{"status":"ok","app":"Repvio API"}`

---

### 2. Frontend

```bash
cd frontend
npm install
```

`frontend/.env.local` anlegen:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dein-nextauth-secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Öffne: http://localhost:3000

---

## Pläne & Limits

| Plan  | Analysen / Monat |
|-------|-----------------|
| Free  | 3               |
| Beta  | 10              |
| Pro   | 30              |
| Elite | 100             |

## Beta-Betrieb

Registrierung ist standardmäßig deaktiviert (`REGISTRATION_OPEN=false`).  
Beta-Tester-Accounts werden manuell angelegt:

```bash
cd backend
python create_beta_testers.py
```
