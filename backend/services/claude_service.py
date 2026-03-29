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


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _extract_frames(video_path: str, num_frames: int = NUM_FRAMES) -> list[str]:
    """Extract evenly-spaced frames from video, return list of base64-encoded JPEGs."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Get video duration
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

        # Extract frames at evenly spaced timestamps
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


async def analyze_exercise(video_path: str, exercise_type: str) -> dict:
    """
    Extract frames from video, analyze with Claude, return structured feedback.
    """
    client = get_client()
    frames = _extract_frames(video_path)

    # Build content: frames first, then the prompt
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

    content.append({
        "type": "text",
        "text": (
            f"ÜBUNG (vom Nutzer festgelegt): {exercise_type}\n\n"
            f"Die {len(frames)} Frames oben zeigen die vollständige Bewegungsausführung von {exercise_type}. "
            f"Analysiere die Technik anhand dieser Kriterien. "
            f"WICHTIG: Nenne NIEMALS Frame-Nummern oder -Bezeichnungen in deiner Antwort — der Nutzer sieht keine Frames, nur das Feedback.\n"
            "- Körperhaltung und Wirbelsäulenposition (neutral, Hohlkreuz, Rundrücken?)\n"
            "- Gelenkstellungen (Knie, Hüfte, Schulter, Ellbogen je nach Übung)\n"
            "- Bewegungsumfang (ROM) — wird die volle Range of Motion erreicht?\n"
            "- Symmetrie — gibt es Ausweichbewegungen oder einseitige Belastung?\n"
            "- Stabilität — Core-Spannung, Balance, Kontrolle\n"
            "- Bewegungsfluss — Tempo, kontrollierte Exzentrik und Konzentrik\n"
            "- Wiederholungsqualität — wird die Technik über alle Reps gehalten?\n"
            "- Verletzungsrisiken — kritische Fehler die zu Schäden führen könnten\n\n"
            "Antworte NUR als JSON (kein Markdown, kein Codeblock):\n"
            "{\n"
            '  "score": <0-100>,\n'
            '  "overall": "<3-4 Sätze Gesamtbewertung mit konkreten Beobachtungen>",\n'
            '  "positives": ["<konkreter Punkt mit Körperteil>", "<konkreter Punkt>", "<konkreter Punkt>"],\n'
            '  "corrections": [\n'
            '    {"fehler": "<was genau falsch ist>", "korrektur": "<wie es richtig gemacht wird>"},\n'
            '    {"fehler": "<was genau falsch ist>", "korrektur": "<wie es richtig gemacht wird>"}\n'
            '  ],\n'
            '  "verletzungsrisiko": "<niedrig|mittel|hoch> — kurze Begründung",\n'
            '  "cue": "<1 einprägsamer Coaching-Cue der den wichtigsten Fehler behebt>",\n'
            '  "naechste_schritte": ["<konkrete Übung oder Drill zur Verbesserung>", "<weiterer Schritt>"]\n'
            "}"
        ),
    })

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        temperature=0,
        system=(
            "Du bist ein erfahrener, zertifizierter Kraftsport- und Bewegungscoach mit Expertise in "
            "Biomechanik, funktionellem Training und Verletzungsprävention. "
            "Du analysierst Übungsvideos frame-by-frame mit dem Blick eines professionellen Trainers: "
            "präzise, konstruktiv und sicherheitsbewusst. "
            "Deine Korrekturen sind konkret und umsetzbar — du nennst immer den betroffenen Körperteil "
            "und die genaue Verbesserung. "
            "Antworte ausschließlich mit gültigem JSON, ohne Markdown-Formatierung."
        ),
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0].strip()

    return json.loads(raw)
