import base64
import json
import os
import subprocess
import tempfile
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv(override=True)

NUM_FRAMES = 3
MODEL = "claude-sonnet-4-6"

# Cached system prompt — stays constant across all analyses
SYSTEM_PROMPT = [
    {
        "type": "text",
        "text": (
            "Du bist ein erfahrener, zertifizierter Kraftsport- und Bewegungscoach mit Expertise in "
            "Biomechanik, funktionellem Training und Verletzungsprävention. "
            "Du analysierst Übungsvideos frame-by-frame mit dem Blick eines professionellen Trainers: "
            "präzise, konstruktiv und sicherheitsbewusst. "
            "Deine Korrekturen sind konkret und umsetzbar — du nennst immer den betroffenen Körperteil "
            "und die genaue Verbesserung. "
            "WICHTIG: Du gibst ausschließlich Technik-Feedback zur Bewegungsoptimierung. "
            "Deine Analyse ersetzt keine medizinische oder physiotherapeutische Beratung. "
            "Verwende keine medizinischen Diagnosen. Beschreibe Risiken als erhöhte Gelenkbelastung "
            "oder biomechanische Ineffizienz, nicht als medizinische Befunde. "
            "Antworte ausschließlich mit gültigem JSON, ohne Markdown-Formatierung."
        ),
        "cache_control": {"type": "ephemeral"},
    }
]


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _extract_frames(video_path: str, num_frames: int = NUM_FRAMES) -> list[str]:
    """Extract evenly-spaced frames from video, return list of base64-encoded JPEGs."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        duration = float(result.stdout.strip())

        frames_b64 = []
        for i in range(num_frames):
            timestamp = duration * (i + 0.5) / num_frames
            frame_path = os.path.join(tmp_dir, f"frame_{i:02d}.jpg")
            subprocess.run(
                [
                    "ffmpeg", "-ss", str(timestamp),
                    "-i", video_path,
                    "-vframes", "1",
                    "-q:v", "3",
                    "-vf", "scale=640:-1",
                    frame_path,
                    "-y",
                ],
                capture_output=True,
                timeout=60,
            )
            if os.path.exists(frame_path):
                with open(frame_path, "rb") as f:
                    frames_b64.append(base64.standard_b64encode(f.read()).decode("utf-8"))

    return frames_b64


async def analyze_exercise(video_path: str, exercise_type: str, muscle_focus: str | None = None) -> dict:
    """Extract frames from video, analyze with Claude using prompt caching."""
    client = get_client()
    frames = _extract_frames(video_path)

    content = []
    for i, frame_b64 in enumerate(frames):
        content.append({
            "type": "text",
            "text": f"Frame {i + 1} von {len(frames)}:",
        })
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": frame_b64,
            },
        })

    focus_line = (
        f"MUSKEL-FOKUS (vom Nutzer gewählt): {muscle_focus}\n"
        f"Der Nutzer möchte bewusst den {muscle_focus} trainieren. Passe deine Analyse entsprechend an: "
        f"Bewerte die Technik primär danach, ob sie optimal für den {muscle_focus} ist. "
        f"Weise explizit auf Form-Anpassungen hin, die den {muscle_focus} besser aktivieren.\n\n"
        if muscle_focus else ""
    )

    content.append({
        "type": "text",
        "text": (
            f"ÜBUNG (vom Nutzer festgelegt): {exercise_type}\n"
            f"{focus_line}"
            f"Die {len(frames)} Frames oben zeigen die vollständige Bewegungsausführung von {exercise_type}.\n\n"
            "### SCHRITT 0: VIDEO-QUALITÄTS-CHECK\n"
            "Bevor du mit der biomechanischen Analyse beginnst, prüfe die Bildqualität:\n"
            "1. PERSPEKTIVE: Ist die Kamera seitlich (90°), frontal oder schräg?\n"
            "2. VOLLSTÄNDIGKEIT: Sind Kopf, Hüfte und Füße in allen Phasen der Bewegung sichtbar?\n"
            "3. STABILITÄT: Ist das Bild scharf oder verwackelt?\n"
            "4. ORIENTIERUNG: Ist das Video korrekt ausgerichtet?\n"
            "Falls die Videoqualität die Analyse beeinträchtigt, beginne die 'overall'-Gesamtbewertung mit einem "
            "kurzen, freundlichen Hinweis zur Kameraführung (z.B. 'Hinweis: Deine Füße sind nicht vollständig im Bild, "
            "weshalb die Tiefe der Bewegung nur geschätzt werden konnte.').\n\n"
            "### SCHRITT 1: BIOMECHANISCHE ANALYSE\n"
            f"Analysiere die Technik anhand dieser Kriterien. "
            f"WICHTIG: Nenne NIEMALS Frame-Nummern oder -Bezeichnungen in deiner Antwort — der Nutzer sieht keine Frames, nur das Feedback.\n"
            "- Körperhaltung und Wirbelsäulenposition (neutral, Hohlkreuz, Rundrücken?)\n"
            "- Gelenkstellungen (Knie, Hüfte, Schulter, Ellbogen je nach Übung)\n"
            "- Bewegungsumfang (ROM) — wird die volle Range of Motion erreicht?\n"
            "- Symmetrie — gibt es Ausweichbewegungen oder einseitige Belastung?\n"
            "- Stabilität — Core-Spannung, Balance, Kontrolle\n"
            "- Bewegungsfluss — Tempo, kontrollierte Exzentrik und Konzentrik\n"
            "- Wiederholungsqualität — wird die Technik über alle Reps gehalten?\n"
            "- Biomechanische Belastung — erhöhte Gelenkbelastung oder Ineffizienzen erkennen\n\n"
            "Antworte NUR als JSON (kein Markdown, kein Codeblock):\n"
            "{\n"
            '  "score": <0-100>,\n'
            '  "overall": "<3-4 Sätze Gesamtbewertung mit konkreten Beobachtungen>",\n'
            '  "positives": ["<konkreter Punkt mit Körperteil>", "<konkreter Punkt>", "<konkreter Punkt>"],\n'
            '  "corrections": [\n'
            '    {"fehler": "<was genau falsch ist>", "korrektur": "<wie es richtig gemacht wird>"},\n'
            '    {"fehler": "<was genau falsch ist>", "korrektur": "<wie es richtig gemacht wird>"}\n'
            '  ],\n'
            '  "verletzungsrisiko": "<niedrig|mittel|erhöht> — kurze Beschreibung der biomechanischen Belastung",\n'
            '  "cue": "<1 einprägsamer Coaching-Cue der den wichtigsten Fehler behebt>",\n'
            '  "naechste_schritte": ["<konkrete Übung oder Drill zur Verbesserung>", "<weiterer Schritt>"]\n'
            "}"
        ),
    })

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        temperature=0,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0].strip()

    return json.loads(raw)
