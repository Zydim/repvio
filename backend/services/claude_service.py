import base64
import json
import os
import subprocess
import tempfile
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv(override=True)

NUM_FRAMES = 5
MODEL = "claude-sonnet-4-6"

# Cached system prompt — stays constant across all analyses
SYSTEM_PROMPT = [
    {
        "type": "text",
        "text": (
            "Du bist ein erfahrener Kraftsport-Coach mit Spezialisierung in Biomechanik und Bewegungsanalyse. "
            "Du analysierst Übungsvideos wie ein professioneller Trainer an der Seite des Athleten: "
            "ehrlich, motivierend und praxisnah.\n\n"

            "DEINE PERSÖNLICHKEIT:\n"
            "- Du erkennst Leistung an, bevor du Fehler nennst.\n"
            "- Du formulierst Korrekturen als Verbesserungschancen, nicht als Kritik.\n"
            "- Du sprichst den Athleten direkt an ('du').\n"
            "- Du bist konkret: welcher Körperteil, welche Phase der Bewegung, was genau anders machen.\n\n"

            "BEWERTUNGSREGELN:\n"
            "- Bewerte NUR die Bewegungsqualität — nicht Kamerawinkel, Kleidung oder Umgebung.\n"
            "- Kamerahinweise gehören in 'overall' als Nebensatz, fließen aber NICHT in den Score ein.\n"
            "- Schweres Gewicht / Zusatzgewicht: Leichter Schwung, minimales Kipping oder leicht "
            "eingeschränkte ROM sind bei hoher Last NORMAL — maximal 1-2 Punkte Abzug pro Kategorie.\n"
            "- Bewerte das Gesamtbild der Bewegung über alle Frames, nicht einzelne Frames isoliert.\n"
            "- KEINE medizinischen Diagnosen. Beschreibe Risiken als biomechanische Belastung.\n\n"

            "Antworte ausschließlich mit gültigem JSON, ohne Markdown-Formatierung."
        ),
        "cache_control": {"type": "ephemeral"},
    }
]

# Exercise-specific criteria for more targeted analysis
EXERCISE_CRITERIA: dict[str, str] = {
    "Bankdrücken": (
        "Fokus-Kriterien: Schulterblatt-Retraktion, Bogen in der Brustwirbelsäule, "
        "Ellbogen-Winkel (45-75° zum Körper), Handgelenk über Ellbogen, "
        "Stange berührt untere Brust, volle Lockout-Extension, Füße fest am Boden."
    ),
    "Schrägbankdrücken": (
        "Fokus-Kriterien: Schulterblatt-Retraktion trotz Schrägbank, Ellbogen-Winkel, "
        "Stangen-Pfad zur oberen Brust, Handgelenk-Alignment, stabile Fußposition, "
        "kein übermäßiges Hohlkreuz."
    ),
    "Dips": (
        "Fokus-Kriterien: Schultern tief und stabil (nicht nach vorn gezogen), "
        "Ellbogen-Winkel min. 90° in der Tiefe, kontrollierter Absenkwinkel, "
        "Oberkörper-Neigung (leicht vor für Brust, aufrecht für Trizeps), voller Lockout."
    ),
    "Klimmzüge": (
        "Fokus-Kriterien: Scapula-Retraktion am Anfang, Kinn über Stange oder Brust zur Stange, "
        "kontrollierte Exzentrik (kein freies Fallen), minimaler Schwung (bei Zusatzgewicht toleriert), "
        "Schultern weg von den Ohren, volle Extension unten."
    ),
    "Muscle-Ups": (
        "Fokus-Kriterien: Explosiver Pull über die Stange, sauberer Transition-Punkt, "
        "Dip-Phase mit Kontrolle, volle Extension oben, "
        "Schwung ist bei Muscle-Ups TEIL der Technik — nur unkontrollierter Schwung abziehen."
    ),
    "Chin-Ups": (
        "Fokus-Kriterien: Supinierter Griff, Kinn über Stange, Bizeps-Aktivierung sichtbar, "
        "kontrollierte Exzentrik, volle Extension unten, Schulter-Stabilität."
    ),
    "Seitheben Kabelturm": (
        "Fokus-Kriterien: Arm leicht gebeugt (15-20°), Bewegung aus der Schulter (nicht Trapez), "
        "Endposition auf Schulterhöhe oder leicht darüber, kontrollierte Exzentrik, "
        "kein übermäßiges Schwingen des Oberkörpers, Handgelenk neutral."
    ),
    "Schulterpress Langhantel": (
        "Fokus-Kriterien: Stange startet an der vorderen Schulter, volle Lockout-Extension, "
        "Kopf weicht leicht nach hinten aus (nicht übertrieben), kein Hohlkreuz, "
        "Core angespannt, Knie nicht durchgedrückt, Ellbogen unter der Stange."
    ),
    "Kniebeuge": (
        "Fokus-Kriterien: Knie folgen der Fußspitzenrichtung, Tiefe mindestens parallel (Hüfte auf Kniehöhe), "
        "neutrale Wirbelsäule (kein Butt-Wink), Fersen am Boden, Brustkorb aufrecht, "
        "Stange stabil auf dem Trapez, gleichmäßige Gewichtsverteilung."
    ),
    "Kreuzheben": (
        "Fokus-Kriterien: Stange nah am Körper (Schienbein/Oberschenkel), "
        "Rücken durchgehend neutral (KEIN Rundrücken), Hüft-Hinge-Pattern klar erkennbar, "
        "Lockout mit Hüftstreckung (nicht Überstreckung), Schultern über/leicht vor der Stange beim Start."
    ),
    "Hip Thrust": (
        "Fokus-Kriterien: Schulterblätter auf der Bank, Knie 90° in der Endposition, "
        "volle Hüftstreckung oben (Squeeze), Kinn leicht zur Brust (kein Nacken-Überstrecken), "
        "kein übermäßiges Hohlkreuz, Füße hüftbreit und fest."
    ),
    "Face Pulls Kabelturm": (
        "Fokus-Kriterien: Seilansatz auf Gesichtshöhe, Ellbogen hoch (über Schultern), "
        "externe Rotation am Ende der Bewegung, Schulterblätter zusammen, "
        "kontrollierte Exzentrik, kein Schwung aus dem Rumpf."
    ),
    "Step Up Kabelzug": (
        "Fokus-Kriterien: Arbeitendes Bein trägt das Gewicht (nicht vom Standbein abstoßen), "
        "Knie folgt der Fußspitze, aufrechter Oberkörper, volle Hüftstreckung oben, "
        "kontrolliertes Absenken, Kabel-Zugrichtung beachten."
    ),
    "Bulgarian Split Squat": (
        "Fokus-Kriterien: Hinterer Fuß erhöht auf Bank, vorderes Knie über dem Fuß (nicht darüber hinaus), "
        "aufrechter Oberkörper, Tiefe: hinteres Knie fast am Boden, "
        "kein seitliches Ausweichen, Balance und Stabilität."
    ),
}


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
                    "-q:v", "2",
                    "-vf", "scale=1024:-1",
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
    """Extract frames from video, analyze with Claude Opus using extended thinking."""
    client = get_client()
    frames = _extract_frames(video_path)

    content = []
    for i, frame_b64 in enumerate(frames):
        content.append({
            "type": "text",
            "text": f"Frame {i + 1} von {len(frames)} — {'Start' if i == 0 else 'Ende' if i == len(frames) - 1 else f'Mitte (Phase {i})'}:",
        })
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": frame_b64,
            },
        })

    # Exercise-specific criteria
    exercise_criteria = EXERCISE_CRITERIA.get(exercise_type, "")
    criteria_block = f"\nÜBUNGSSPEZIFISCHE KRITERIEN für {exercise_type}:\n{exercise_criteria}\n\n" if exercise_criteria else ""

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
            f"{criteria_block}"
            f"Die {len(frames)} Frames oben zeigen die vollständige Bewegungsausführung von {exercise_type}.\n\n"

            "### SCHRITT 0: VIDEO-QUALITÄTS-CHECK\n"
            "Prüfe kurz: Perspektive, Vollständigkeit (alle Körperteile sichtbar?), Schärfe.\n"
            "Falls die Qualität die Analyse einschränkt, erwähne es kurz im 'overall'-Text — "
            "aber ziehe dafür KEINE Punkte ab.\n\n"

            "### SCHRITT 1: BIOMECHANISCHE ANALYSE\n"
            f"Analysiere die Technik von {exercise_type}. "
            "WICHTIG: Nenne NIEMALS Frame-Nummern in deiner Antwort — der Nutzer sieht keine Frames.\n"
            "Untersuche systematisch:\n"
            "- Körperhaltung und Wirbelsäulenposition\n"
            "- Gelenkstellungen in jeder Bewegungsphase\n"
            "- Bewegungsumfang (ROM)\n"
            "- Symmetrie und Ausweichbewegungen\n"
            "- Core-Spannung und Stabilität\n"
            "- Bewegungsfluss und Tempo\n"
            "- Konsistenz über alle sichtbaren Wiederholungen\n\n"

            "### SCHRITT 2: SCORING (Rubrik-basiert)\n"
            "Vergib für jede der 5 Kategorien einen Teilscore (0-20) basierend auf deiner Analyse:\n\n"
            "1. HALTUNG & WIRBELSÄULE (0-20)\n"
            "   Neutrale Wirbelsäule, Kopfposition, Core-Spannung, Beckenstellung\n"
            "   → 18-20: nahezu perfekt | 14-17: kleine Abweichungen | 10-13: deutliche Fehler | <10: schwere Fehler\n\n"
            "2. GELENKSTELLUNGEN (0-20)\n"
            "   Korrekte Winkel in allen beteiligten Gelenken über den gesamten Bewegungsablauf\n"
            "   → 18-20: nahezu perfekt | 14-17: kleine Abweichungen | 10-13: deutliche Fehler | <10: schwere Fehler\n\n"
            "3. BEWEGUNGSUMFANG (0-20)\n"
            "   Volle Range of Motion erreicht, kontrollierte Umkehrpunkte\n"
            "   → 18-20: volle ROM | 14-17: leicht eingeschränkt | 10-13: deutlich eingeschränkt | <10: stark eingeschränkt\n\n"
            "4. BEWEGUNGSFLUSS (0-20)\n"
            "   Tempo, Kontrolle, Exzentrik vs. Konzentrik, ungewollter Schwung\n"
            "   → 18-20: flüssig und kontrolliert | 14-17: leichter Schwung | 10-13: unkontrollierte Phasen | <10: unkontrolliert\n\n"
            "5. GESAMTEINDRUCK (0-20)\n"
            "   Symmetrie, Wiederholungsqualität, Stabilität, Athletik\n"
            "   → 18-20: sehr stabil und symmetrisch | 14-17: kleine Asymmetrien | 10-13: deutliche Schwächen | <10: instabil\n\n"

            "Der Gesamtscore = Summe aller 5 Teilscores.\n"
            "WICHTIG: Jeder Teilscore muss unabhängig und ehrlich vergeben werden.\n\n"

            "Antworte NUR als JSON (kein Markdown, kein Codeblock):\n"
            "{\n"
            '  "score": <Summe der 5 Teilscores>,\n'
            '  "teilscores": {\n'
            '    "haltung": <0-20>,\n'
            '    "gelenke": <0-20>,\n'
            '    "rom": <0-20>,\n'
            '    "bewegungsfluss": <0-20>,\n'
            '    "gesamteindruck": <0-20>\n'
            '  },\n'
            '  "overall": "<3-4 Sätze: beginne mit Anerkennung, dann die wichtigsten Beobachtungen>",\n'
            '  "positives": ["<konkreter Punkt mit Körperteil>", "<konkreter Punkt>", "<konkreter Punkt>"],\n'
            '  "corrections": [\n'
            '    {"fehler": "<was genau falsch ist + in welcher Phase>", "korrektur": "<konkrete Anweisung wie es besser geht>"},\n'
            '    {"fehler": "<was genau falsch ist>", "korrektur": "<konkrete Anweisung>"}\n'
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
        temperature=0.3,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0].strip()

    result = json.loads(raw)

    # Validate & recalculate score from teilscores if present
    if "teilscores" in result:
        ts = result["teilscores"]
        calculated = sum(ts.get(k, 0) for k in ["haltung", "gelenke", "rom", "bewegungsfluss", "gesamteindruck"])
        result["score"] = round(calculated / 5) * 5

    return result
