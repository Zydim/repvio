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

            "STUDIO-UMGEBUNG:\n"
            "- Ignoriere Spiegel und Spiegelbilder — analysiere nur die direkte Person, nicht das Spiegelbild.\n"
            "- Ignoriere andere Personen im Hintergrund — fokussiere auf den Athleten im Vordergrund.\n"
            "- Bei einseitigen Übungen (Step Up, Bulgarian Split Squat, Ausfallschritte): "
            "erkenne welche Seite trainiert wird (links/rechts) und erwähne es kurz.\n\n"

            "KLEIDUNG & SICHTBARKEIT:\n"
            "- Weite Kleidung (Hoodies, weite Hosen) kann die Wirbelsäulenposition verdecken.\n"
            "- Diagnostiziere Rundrücken NUR wenn eindeutig sichtbar: Schultern kollabieren nach vorne, "
            "oberer Rücken bildet einen klaren Katzenbuckel, oder der Kopf hängt deutlich.\n"
            "- Ein stark vorgebeugter Oberkörper allein ist KEIN Rundrücken — das kann kontrolliertes "
            "Vorlehnen mit neutraler Wirbelsäule sein.\n"
            "- Im Zweifel: kein Fehler diagnostizieren. Lieber erwähnen dass die Kleidung "
            "die Beurteilung der Wirbelsäulenposition einschränkt.\n"
            "- Knie-Streckung bei weiter Kleidung: KEIN 'leicht gebeugt' oder 'nicht vollständig gestreckt' "
            "schreiben wenn kein klarer sichtbarer Knick erkennbar ist — im Zweifel als gestreckt werten.\n\n"

            "STRENGE-KALIBRIERUNG:\n"
            "- Sei ein erfahrener Coach, kein überkritischer Prüfer.\n"
            "- Kleine Imperfektionen sind normal — nicht jede Abweichung ist ein Fehler.\n"
            "- Unterscheide klar zwischen: echtem Technikfehler (Verletzungsrisiko oder deutlich weniger Effektivität) "
            "vs. stilistischer Abweichung (andere, aber akzeptable Ausführung).\n"
            "- Nur echte Technikfehler sollen den Score senken.\n"
            "- Wenn die Grundbewegung korrekt ist und keine Verletzungsgefahr besteht, "
            "sollte der Score mindestens im Bereich 70-80 liegen.\n\n"

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
        "Stange berührt untere Brust, volle Lockout-Extension, Füße fest am Boden.\n"
        "TOLERANZEN: Ein sichtbarer Bogen (Arch) ist KORREKTE Powerlifting-Technik — kein Hohlkreuz. "
        "Ellbogen-Winkel variiert je nach Griffbreite: breiter Griff = flachere Ellbogen, beides akzeptabel. "
        "Stange muss nicht die Brust berühren wenn der Athlet bewusst knapp darüber stoppt (Schulter-schonend)."
    ),
    "Schrägbankdrücken": (
        "Fokus-Kriterien: Schulterblatt-Retraktion trotz Schrägbank, Ellbogen-Winkel, "
        "Stangen-Pfad zur oberen Brust, Handgelenk-Alignment, stabile Fußposition.\n"
        "TOLERANZEN: Leichtes Hohlkreuz ist bei schweren Gewichten normal und stabilisierend — "
        "nur extremes Abheben des Gesäßes von der Bank ist ein Fehler. "
        "Stangen-Pfad variiert je nach Bankwinkel."
    ),
    "Dips": (
        "Fokus-Kriterien: Schultern tief und stabil (nicht nach vorn gezogen), "
        "kontrollierter Absenkwinkel, voller Lockout oben.\n"
        "TOLERANZEN: Die Tiefe variiert je nach Schulter-Mobilität — 90° Ellbogen ist ein Richtwert, "
        "KEIN Muss. Leichtes Vorschwingen des Körpers ist bei schweren Dips normal. "
        "Oberkörper-Neigung ist stilabhängig: leicht vor = mehr Brust, aufrecht = mehr Trizeps — beides korrekt, "
        "nur bewerten wenn ein Muskel-Fokus gewählt wurde."
    ),
    "Klimmzüge": (
        "Fokus-Kriterien: Scapula-Retraktion/Depression am Anfang, kontrollierte Exzentrik, "
        "Schultern weg von den Ohren, volle Extension unten.\n"
        "TOLERANZEN: Kinn muss NICHT zwingend über die Stange — Brust-zur-Stange oder Kinn auf Stangenhöhe "
        "ist genauso akzeptabel. Bei Zusatzgewicht: Schwung, leichtes Kipping und eingeschränkte ROM "
        "sind NORMAL — maximal 1-2 Punkte Abzug. Leichtes Beine-Anwinkeln ist kein Fehler."
    ),
    "Muscle-Ups": (
        "Fokus-Kriterien: Explosiver Pull über die Stange, sauberer Transition-Punkt, "
        "Dip-Phase mit Kontrolle, volle Extension oben.\n"
        "TOLERANZEN: Schwung/Kipping ist bei Muscle-Ups TEIL der Technik — NUR unkontrollierten, "
        "chaotischen Schwung abziehen. Bei gewichteten Muscle-Ups ist mehr Schwung zu erwarten. "
        "Die Transition muss nicht perfekt smooth sein — es ist eine explosiv-athletische Bewegung."
    ),
    "Chin-Ups": (
        "Fokus-Kriterien: Supinierter Griff, Bizeps-Aktivierung, "
        "kontrollierte Exzentrik, volle Extension unten, Schulter-Stabilität.\n"
        "TOLERANZEN: Kinn muss NICHT zwingend über die Stange. "
        "Bei Zusatzgewicht: leichter Schwung und eingeschränkte ROM sind NORMAL. "
        "Leichtes Beine-Anwinkeln ist kein Fehler."
    ),
    "Seitheben Kabelturm": (
        "Fokus-Kriterien: Arm leicht gebeugt, Bewegung aus der Schulter (nicht Trapez), "
        "Endposition auf Schulterhöhe oder leicht darüber, kontrollierte Exzentrik.\n"
        "TOLERANZEN: Arm-Beugewinkel variiert (15-30° ist alles akzeptabel). "
        "Leichtes Oberkörper-Schwingen bei den letzten Wiederholungen ist normal. "
        "Über Schulterhöhe heben ist KEIN Fehler solange kontrolliert. "
        "Handgelenk muss nicht perfekt neutral sein."
    ),
    "Schulterpress Langhantel": (
        "Fokus-Kriterien: Stange startet an der vorderen Schulter, volle Lockout-Extension, "
        "Core angespannt, Ellbogen unter der Stange.\n"
        "TOLERANZEN: Leichter Lean-Back bei schweren Gewichten ist NORMAL und akzeptabel — "
        "nur extremes Hohlkreuz ist ein Fehler. Kopf weicht natürlich nach hinten aus für den Stangen-Pfad. "
        "Leichte Kniebeugung für Stabilität ist kein Fehler. "
        "Push-Press (mit Bein-Drive) ist eine andere Übung, aber kein Fehler wenn der Athlet es bewusst einsetzt."
    ),
    "Kniebeuge": (
        "Fokus-Kriterien: Knie folgen der Fußspitzenrichtung, stabile Wirbelsäule, "
        "Fersen am Boden, Stange stabil auf dem Trapez.\n"
        "TOLERANZEN: Tiefe ist individuell — parallel ist ideal, aber leicht über parallel bei schweren Gewichten "
        "ist KEIN schwerer Fehler (max 1-2 Punkte Abzug). Minimaler Butt-Wink am tiefsten Punkt "
        "ist anatomisch normal und kein Fehler. Knie DÜRFEN über die Zehenspitzen gehen — "
        "das ist biomechanisch korrekt und bei tiefen Squats unvermeidbar. "
        "Oberkörper-Neigung variiert je nach Hebelverhältnissen: langer Oberschenkel = mehr Lean."
    ),
    "Kreuzheben": (
        "Fokus-Kriterien: Stange nah am Körper, Hüft-Hinge-Pattern klar erkennbar, "
        "Lockout mit Hüftstreckung (nicht Überstreckung), Schultern über/leicht vor der Stange beim Start.\n"
        "TOLERANZEN: Leichter oberer Rücken-Rundung (Thorakal) ist bei schwerem Kreuzheben akzeptabel "
        "und bei vielen Strongman/Powerliftern normal — nur LUMBALER Rundrücken (unterer Rücken) ist gefährlich. "
        "Leichtes Hitchen oder kurzes Verlangsamen an den Knien ist bei Maximalgewichten normal. "
        "Rücken muss nicht perfekt flach sein — neutral mit natürlicher Krümmung reicht."
    ),
    "Hip Thrust": (
        "Fokus-Kriterien: Schulterblätter auf der Bank, volle Hüftstreckung oben (Squeeze), "
        "Kinn leicht zur Brust, Füße hüftbreit und fest.\n"
        "TOLERANZEN: Kniewinkel muss nicht exakt 90° sein — 80-100° ist akzeptabel. "
        "Füße dürfen leicht nach außen rotiert sein. Leichtes Hohlkreuz am obersten Punkt "
        "ist bei schwerem Gewicht normal und kein Fehler — nur EXTREMES Überstrecken abziehen. "
        "Schulterblatt-Position variiert je nach Bankhöhe."
    ),
    "Face Pulls Kabelturm": (
        "Fokus-Kriterien: Seilansatz auf Gesichtshöhe, Ellbogen hoch, "
        "externe Rotation am Ende der Bewegung, Schulterblätter zusammen.\n"
        "TOLERANZEN: Die Höhe der Ellbogen variiert — sie müssen nicht zwingend ÜBER Schulterhöhe sein. "
        "Leichter Schwung aus dem Rumpf bei den letzten Wiederholungen ist normal. "
        "Kabelansatz-Höhe variiert je nach Gerät — das ist kein Technikfehler des Athleten."
    ),
    "Step Up Kabelzug": (
        "Fokus-Kriterien: Arbeitendes Bein trägt das Gewicht (nicht vom Standbein abstoßen), "
        "Knie folgt der Fußspitze, volle Hüftstreckung oben, "
        "kontrolliertes Absenken, Kabel-Zugrichtung beachten.\n"
        "TOLERANZEN: Oberkörperposition variiert je nach Zielmuskel — aufrecht und vorgeneigt sind beides "
        "akzeptabel ohne Muskel-Fokus. Sich am Turm festhalten für Balance ist KEIN Fehler."
    ),
    "Bulgarian Split Squat": (
        "Fokus-Kriterien: Hinterer Fuß erhöht auf Bank, Knie folgt der Fußspitze, "
        "Tiefe: hinteres Knie fast am Boden, kein seitliches Ausweichen, Balance und Stabilität.\n"
        "TOLERANZEN: Knie DARF über die Zehenspitzen gehen — biomechanisch korrekt bei dieser Übung. "
        "Oberkörperposition variiert je nach Zielmuskel. Leichtes Wackeln bei schweren Gewichten ist normal "
        "— nur starkes seitliches Ausweichen ist ein Fehler. Hinterer Fuß: Spann oder Zehen auf Bank, beides OK."
    ),
}

# Muskel-fokus-spezifische Kriterien — überschreiben EXERCISE_CRITERIA wenn Muskel-Fokus gesetzt ist
EXERCISE_CRITERIA_BY_FOCUS: dict[str, dict[str, str]] = {
    "Step Up Kabelzug": {
        "Gesäß / Glutes": (
            "FOKUS GESÄSS — angepasste Kriterien:\n"
            "✓ Oberkörper-Vorbeuge (ca. 30-45°) ist KORREKTE TECHNIK für Glute-Aktivierung — NICHT als Fehler werten.\n"
            "  Bewerte es positiv, wenn der Oberkörper kontrolliert nach vorne geneigt wird (starrer Rücken = Hüfte geht nach hinten).\n"
            "  Kritisiere NUR bei eindeutig sichtbarem Katzenbuckel (Schultern kollabieren, oberer Rücken rundet klar). "
            "Ein starker Vorwärtslean beim Absenken ist bei Glute-Fokus NORMAL und kein Rundrücken. "
            "Bei weiter Kleidung: im Zweifel KEINEN Rundrücken diagnostizieren.\n"
            "✓ Schienbein möglichst vertikal halten.\n"
            "✓ LOCKOUT-REGEL (sehr wichtig): Bei Step Up mit Glute-Fokus und vorgelehtem Oberkörper entsteht "
            "eine optische Täuschung — das Knie wirkt leicht gebeugt obwohl es gestreckt ist. "
            "SCHREIBE NIEMALS eine Correction über fehlenden Lockout oder 'Knie nicht vollständig gestreckt' "
            "beim Step Up mit Gesäß-Fokus — das ist fast immer ein false positive durch die Vorbeuge + weite Kleidung. "
            "Nur wenn das Knie einen KLAREN sichtbaren Winkel über 30° hat, darf es erwähnt werden.\n"
            "✓ Standbein-Regel: Abstoßen vom Standbein NUR als Correction nennen wenn EINDEUTIG sichtbar: "
            "Zeh drückt sich aktiv vom Boden ab UND Körpergewicht verlagert sich sichtbar zum Standbein. "
            "Das natürliche Abheben des Standbeins beim Hochsteigen ist KEIN Abstoßen. "
            "Bei weiter Kleidung und normaler Kameraposition: im Zweifel NICHT erwähnen.\n"
            "✓ Absenk-Tempo: Das Tempo der exzentrischen Phase kann aus statischen Frames NICHT beurteilt werden — "
            "schreibe NIEMALS eine Correction über 'zu schnelles Absenken' oder 'unkontrolliertes Kippen beim Absenken'. "
            "Das Vorlehnen beim Absenken ist bei Glute-Fokus IMMER korrekte Technik — kein Kippen.\n"
            "✓ Knie folgt der Fußspitze.\n"
            "UNTERSCHIED: Vorlehnen (Technik) = bewusstes Neigen mit geradem Rücken. Vorkippen (Fehler) = unkontrolliert, runder Rücken."
        ),
        "Quadrizeps": (
            "FOKUS QUADRIZEPS — angepasste Kriterien:\n"
            "✓ Aufrechter Oberkörper erwünscht — fördert Knie-dominante Bewegung.\n"
            "✓ Knie darf und soll aktiv nach vorne über die Zehenspitzen wandern.\n"
            "✓ Volle Kniestreckung oben (Lockout).\n"
            "✓ Arbeitendes Bein trägt das Gewicht (kein Abstoßen vom Standbein).\n"
            "✓ Kontrolliertes Absenken, Knie folgt der Fußspitze."
        ),
    },
    "Bulgarian Split Squat": {
        "Gesäß / Glutes": (
            "FOKUS GESÄSS — angepasste Kriterien:\n"
            "✓ Oberkörper-Vorbeuge (ca. 20-40°) ist KORREKTE TECHNIK — NICHT als Fehler werten.\n"
            "  Bewerte es positiv wenn der Oberkörper kontrolliert vorgelehnt wird (mehr Hüft-Flexion = mehr Glute-Dehnung).\n"
            "  Kritisiere NUR bei eindeutig sichtbarem Katzenbuckel (Schultern kollabieren, oberer Rücken rundet klar). "
            "Bei weiter Kleidung: im Zweifel KEINEN Rundrücken diagnostizieren.\n"
            "✓ Vorderer Fuß weiter vorne positioniert (mehr Hüft-Abstand zur Bank).\n"
            "✓ Lockout-Definition bei Glute-Fokus: Das KNIE des Arbeitsbeins ist gestreckt = Lockout erreicht. "
            "Der Oberkörper muss dabei NICHT aufrecht sein — Vorbeuge oben ist bei Glute-Fokus normal.\n"
            "✓ Tiefe: hinteres Knie fast am Boden.\n"
            "✓ Kein seitliches Ausweichen, Balance und Stabilität."
        ),
        "Quadrizeps": (
            "FOKUS QUADRIZEPS — angepasste Kriterien:\n"
            "✓ Aufrechter Oberkörper erwünscht.\n"
            "✓ Vorderer Fuß eher näher unter dem Körper (mehr Knie-dominante Bewegung).\n"
            "✓ Knie darf aktiv nach vorne über die Zehenspitzen wandern.\n"
            "✓ Volle Kniestreckung oben.\n"
            "✓ Tiefe: hinteres Knie fast am Boden, kein seitliches Ausweichen."
        ),
    },
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
    """Extract frames from video, analyze with Claude Opus using extended thinking."""
    client = get_client()
    frames = _extract_frames(video_path)

    content = []
    for i, frame_b64 in enumerate(frames):
        content.append({
            "type": "text",
            "text": f"Frame {i + 1} von {len(frames)} — {['Start (0%)', '25% der Bewegung', '50% — Mitte', '75% der Bewegung', 'Ende (100%)'][i] if len(frames) == 5 else ('Start' if i == 0 else 'Ende' if i == len(frames) - 1 else f'{round(100 * i / (len(frames)-1))}% der Bewegung')}:",
        })
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": frame_b64,
            },
        })

    # Exercise-specific criteria — muskel-fokus-spezifisch wenn vorhanden
    focus_criteria = EXERCISE_CRITERIA_BY_FOCUS.get(exercise_type, {}).get(muscle_focus or "", "")
    exercise_criteria = focus_criteria or EXERCISE_CRITERIA.get(exercise_type, "")
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
            "Vergib für jede der 5 Kategorien einen Teilscore (0-20) basierend auf deiner Analyse.\n\n"
            "KALIBRIERUNG (Gesamtscore-Referenz):\n"
            "  90-100 = Elite-Technik | 78-89 = Sehr gut | 65-77 = Solide Grundtechnik | 50-64 = Mehrere Fehler | <50 = Grundlegende Probleme\n\n"
            "SCORING-REGEL: Starte pro Kategorie bei 15 (= korrekte Grundausführung ohne schwere Fehler). "
            "Erhöhe für beobachtete Stärken, reduziere für konkrete Fehler. "
            "Jeder Teilscore muss durch eine spezifische Beobachtung begründet sein — kein Standardwert.\n\n"
            "1. HALTUNG & WIRBELSÄULE (0-20)\n"
            "   Neutrale Wirbelsäule, Kopfposition, Core-Spannung, Beckenstellung\n"
            "   → 17-20: nahezu perfekt | 13-16: korrekte Grundhaltung, kleine Abweichungen | 8-12: sichtbare Fehler | <8: schwere Fehler\n\n"
            "2. GELENKSTELLUNGEN (0-20)\n"
            "   Korrekte Winkel in allen beteiligten Gelenken über den gesamten Bewegungsablauf\n"
            "   → 17-20: nahezu perfekt | 13-16: korrekte Grundwinkel, kleine Abweichungen | 8-12: sichtbare Fehler | <8: schwere Fehler\n\n"
            "3. BEWEGUNGSUMFANG (0-20)\n"
            "   Volle Range of Motion erreicht, kontrollierte Umkehrpunkte\n"
            "   → 17-20: volle ROM | 13-16: leicht eingeschränkt | 8-12: deutlich eingeschränkt | <8: stark eingeschränkt\n\n"
            "4. BEWEGUNGSFLUSS (0-20)\n"
            "   Tempo, Kontrolle, Exzentrik vs. Konzentrik, ungewollter Schwung\n"
            "   → 17-20: flüssig und kontrolliert | 13-16: überwiegend kontrolliert, leichter Schwung | 8-12: unkontrollierte Phasen | <8: unkontrolliert\n\n"
            "5. GESAMTEINDRUCK (0-20)\n"
            "   Symmetrie, Wiederholungsqualität, Stabilität, Athletik\n"
            "   → 17-20: sehr stabil und symmetrisch | 13-16: solide mit kleinen Asymmetrien | 8-12: deutliche Schwächen | <8: instabil\n\n"

            "Der Gesamtscore = Summe aller 5 Teilscores.\n\n"

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
            '  "overall": "<2 Sätze: 1. Anerkennung + stärkste Beobachtung. 2. Wichtigster Verbesserungspunkt. Bei einseitigen Übungen: welche Seite (links/rechts)>",\n'
            '  "positives": ["<1-3 konkrete Stärken — NUR was tatsächlich gut ist>"],\n'
            '  "corrections": [\n'
            '    // NUR echte Technikfehler! 0-2 Einträge max. KEINE erfundenen Korrekturen.\n'
            '    {"fehler": "<konkret was + in welcher Phase>", "korrektur": "<1 Satz Anweisung>"}\n'
            '  ],\n'
            '  "verletzungsrisiko": "<niedrig|mittel|erhöht> — max 1 Satz",\n'
            '  "cue": "<1 kurzer prägnanter Cue, max 10 Wörter>",\n'
            '  "naechste_schritte": ["<1 konkreter nächster Schritt>"]\n'
            "}"
        ),
    })

    response = client.messages.create(
        model=MODEL,
        max_tokens=1800,
        temperature=0.5,
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
        result["score"] = sum(ts.get(k, 0) for k in ["haltung", "gelenke", "rom", "bewegungsfluss", "gesamteindruck"])

    return result
