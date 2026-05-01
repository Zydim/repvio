import base64
import json
import os
import subprocess
import tempfile
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv(override=True)

NUM_FRAMES = 6
MAX_VIDEO_DURATION = 15.0  # Sekunden
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
            "- KEINE medizinischen Diagnosen. Beschreibe Risiken als biomechanische Belastung.\n"
            "- FALSCHE ÜBUNG: Wenn das Video eindeutig eine andere Übung zeigt als angegeben "
            "(z.B. Kreuzheben statt Kniebeuge), vergib maximal 20 Punkte gesamt. "
            "Erkläre klar was gezeigt wird und was der Nutzer stattdessen tun soll.\n\n"

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

            "AUS STATISCHEN FRAMES NICHT BEURTEILBAR — NIEMALS als Correction schreiben:\n"
            "- Bewegungstempo ('zu schnell', 'zu langsam', 'unkontrolliertes Absenken') — Tempo braucht Video\n"
            "- Atemtechnik — nicht sichtbar\n"
            "- Feingelenkpositionen unter weiter Kleidung (Handgelenk, Knöchel, Knie bei weiter Hose)\n"
            "- 'Stange/Kabel berührt X nicht' wenn aus dem Winkel nicht eindeutig sichtbar\n"
            "- Muskelaktivierung ('Glute nicht aktiviert', 'Bizeps nicht angespannt') — nicht sichtbar\n"
            "- Unschärfe in einem Frame = Kamera-Bewegung, NICHT unkontrollierte Ausführung\n"
            "- Konsistenz zwischen Wiederholungen wenn nur 1-2 Reps sichtbar\n"
            "REGEL: Wenn du dir nicht sicher bist ob etwas wirklich ein Fehler ist — schreib es NICHT als Correction. "
            "Lieber 1 echter Hinweis als 3 Vermutungen.\n\n"

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
        "Ellbogen-Winkel variiert je nach Griffbreite. "
        "Stange muss nicht die Brust berühren wenn der Athlet bewusst knapp darüber stoppt.\n"
        "NICHT BEURTEILBAR: Handgelenk-Kippen unter Bandagen/weiten Ärmeln. "
        "Stangen-Berührung wenn von der Seite gefilmt. Pressetempo."
    ),
    "Schrägbankdrücken": (
        "Fokus-Kriterien: Schulterblatt-Retraktion, Ellbogen-Winkel, "
        "Stangen-Pfad zur oberen Brust, stabile Fußposition.\n"
        "TOLERANZEN: Leichtes Hohlkreuz bei schweren Gewichten normal — "
        "nur extremes Gesäß-Abheben von der Bank ist ein Fehler. "
        "Stangen-Pfad variiert je nach Bankwinkel.\n"
        "NICHT BEURTEILBAR: Stangen-Berührung wenn von vorne gefilmt. Pressetempo. "
        "Schulterblatt-Retraktion unter dicker Kleidung."
    ),
    "Dips": (
        "Fokus-Kriterien: Schultern tief und stabil, voller Lockout oben.\n"
        "TOLERANZEN: 90° Ellbogen ist Richtwert, KEIN Muss — Tiefe variiert mit Schulter-Mobilität. "
        "Leichtes Vorschwingen bei schweren Dips normal. "
        "Oberkörper-Neigung stilabhängig — nur bei gesetztem Muskel-Fokus bewerten.\n"
        "NICHT BEURTEILBAR: Exakte Tiefe wenn nicht von der Seite gefilmt. "
        "Schulter-Hochziehen unter weitem Shirt. Senktempo."
    ),
    "Klimmzüge": (
        "Fokus-Kriterien: Scapula-Retraktion/Depression am Anfang, "
        "Schultern weg von den Ohren, volle Extension unten.\n"
        "TOLERANZEN: Kinn muss NICHT über die Stange — Brust-zur-Stange oder Kinn auf Stangenhöhe OK. "
        "Bei Zusatzgewicht: Schwung und eingeschränkte ROM NORMAL. Beine-Anwinkeln kein Fehler.\n"
        "NICHT BEURTEILBAR: Ob Kinn die Stange erreicht wenn von der Seite gefilmt. "
        "Scapula-Aktivierung unter weitem Shirt. Senktempo.\n"
        "EXTENSION-REGEL: SCHREIBE NIEMALS 'Ellbogen nicht vollständig gestreckt' oder "
        "'Arme nicht komplett durchgestreckt am unteren Umkehrpunkt' — "
        "bei weiter Kleidung und Kamera von unten/schräg ist das fast immer ein false positive. "
        "Nur bei einem KLAREN sichtbaren Winkel über 30° in den Ellbogen erwähnen."
    ),
    "Muscle-Ups": (
        "Fokus-Kriterien: Explosiver Pull über die Stange, Dip-Phase mit Kontrolle, volle Extension oben.\n"
        "TOLERANZEN: Schwung/Kipping ist TEIL der Technik — nur chaotischen Schwung abziehen. "
        "Bei Zusatzgewicht mehr Schwung normal. Transition muss nicht perfekt sein.\n"
        "NICHT BEURTEILBAR: Transition-Sauberkeit wenn von unten gefilmt. Einzelne Frames in Bewegung "
        "zeigen immer 'unsaubere' Positionen — nur Gesamtbewegung bewerten. Tempo."
    ),
    "Chin-Ups": (
        "Fokus-Kriterien: Supinierter Griff, volle Extension unten, Schulter-Stabilität.\n"
        "TOLERANZEN: Kinn muss NICHT zwingend über die Stange. "
        "Bei Zusatzgewicht leichter Schwung und eingeschränkte ROM NORMAL. Beine-Anwinkeln kein Fehler.\n"
        "NICHT BEURTEILBAR: Bizeps-Aktivierung — nicht sichtbar. "
        "Kinn-über-Stange wenn von der Seite gefilmt. Senktempo.\n"
        "EXTENSION-REGEL: SCHREIBE NIEMALS 'Ellbogen nicht vollständig gestreckt' oder "
        "'Arme nicht komplett durchgestreckt am unteren Umkehrpunkt' — "
        "bei weiter Kleidung und Kamera von unten/schräg ist das fast immer ein false positive. "
        "Nur bei einem KLAREN sichtbaren Winkel über 30° in den Ellbogen erwähnen."
    ),
    "Seitheben Kabelturm": (
        "Fokus-Kriterien: Arm leicht gebeugt, Bewegung aus der Schulter, "
        "Endposition auf Schulterhöhe oder leicht darüber.\n"
        "TOLERANZEN: Arm-Beugewinkel 15-30° alles akzeptabel. "
        "Leichtes Oberkörper-Schwingen bei letzten Wiederholungen normal. "
        "Über Schulterhöhe ist KEIN Fehler wenn kontrolliert.\n"
        "NICHT BEURTEILBAR: Trapez-Kompensation vs. Schulter-Aktivierung — nicht durch Frames beurteilbar. "
        "Handgelenk-Neutralität unter Handschuhen/weiten Ärmeln. Senktempo."
    ),
    "Schulterpress Kurzhantel": (
        "Fokus-Kriterien: Kurzhanteln starten auf Schulterhöhe (neutral oder pronierter Griff), "
        "beide Arme gleichzeitig drücken, volle Lockout-Extension oben, "
        "Ellbogen unter den Kurzhanteln beim Start, Oberkörper aufrecht und stabil.\n"
        "BESONDERHEIT KURZHANTEL: Jede Hand bewegt sich unabhängig — leichte Rotationsbewegung "
        "(von neutral zu proniert) während des Pressens ist NORMALE und korrekte Technik. "
        "Kurzhanteln können oben leicht nach innen zusammenkommen.\n"
        "TOLERANZEN: Leichter Lean-Back bei schweren Gewichten NORMAL — nur extremes Hohlkreuz ist Fehler. "
        "Leichte Asymmetrie zwischen links und rechts ist normal und kein schwerer Fehler. "
        "Leichte Kniebeugung für Stabilität im Stehen kein Fehler.\n"
        "NICHT BEURTEILBAR: Core-Spannung — nicht sichtbar. Pressetempo. "
        "Exakter Griffwinkel unter weiten Ärmeln."
    ),
    "Front Squat": (
        "Fokus-Kriterien: Stange liegt auf den vorderen Schultern (Clean-Rack-Position oder Cross-Grip), "
        "Ellbogen HOCH halten während der gesamten Bewegung, aufrechter Oberkörper "
        "(deutlich aufrechter als bei der normalen Kniebeuge), "
        "Knie folgen der Fußspitzenrichtung, Fersen am Boden, Tiefe idealerweise unter parallel.\n"
        "BESONDERHEIT: Aufrechter Oberkörper ist das wichtigste Merkmal des Front Squats. "
        "Wenn die Ellbogen sinken, fällt die Stange automatisch — hohe Ellbogen sind Pflicht.\n"
        "TOLERANZEN: Leichte Fersenerhöhung (Platten oder Keilschuhe) ist für Front Squats NORMAL und akzeptabel. "
        "Knie DÜRFEN über die Zehenspitzen gehen — beim Front Squat sogar erwünscht. "
        "Etwas mehr Oberkörper-Lean bei schlechter Mobilität akzeptabel — "
        "aber mehr als 15-20° Vorneigen deutet auf Mobilitätsprobleme hin.\n"
        "NICHT BEURTEILBAR: Exakte Ellbogen-Höhe wenn von vorne gefilmt. "
        "Tiefe wenn nicht von der Seite gefilmt. Knie-Einknicken unter weiter Hose. Tempo."
    ),
    "Zercher Squat": (
        "Fokus-Kriterien: Stange liegt im Ellbogen-Beugen (Armbeuge), "
        "Arme vor dem Körper, Ellbogen auf Hüft- bis Bauchnabelhöhe, "
        "aufrechter Oberkörper (ähnlich wie Front Squat), "
        "Knie folgen der Fußspitzenrichtung, Tiefe: parallel oder tiefer.\n"
        "BESONDERHEIT: Stangen-Position in der Armbeuge ist ungewohnt — "
        "Unbehagen oder leichte Anpassungsbewegungen der Arme sind NORMAL. "
        "Der Zercher Squat erfordert natürlicherweise dass die Ellbogen zwischen die Knie sinken "
        "in der unteren Position — das ist KORREKTE Technik und kein Fehler.\n"
        "TOLERANZEN: Leichte Fersenerhöhung ist akzeptabel. "
        "Knie DÜRFEN über die Zehenspitzen gehen. "
        "Leichtes Vorneigen des Oberkörpers (bis 20°) ist normal — "
        "extremes Vorlehnen (Stange hängt stark nach vorne) deutet auf Stabilitätsprobleme.\n"
        "NICHT BEURTEILBAR: Exaktes Unwohlsein/Schmerz bei der Stangen-Position — nicht sichtbar. "
        "Tiefe wenn nicht von der Seite gefilmt. Tempo."
    ),
    "Kniebeuge": (
        "Fokus-Kriterien: Knie folgen der Fußspitzenrichtung, stabile Wirbelsäule, "
        "Fersen am Boden, Stange stabil auf dem Trapez.\n"
        "TOLERANZEN: Leicht über parallel bei schweren Gewichten kein schwerer Fehler. "
        "Minimaler Butt-Wink anatomisch normal. Knie DÜRFEN über Zehenspitzen. "
        "Mehr Oberkörper-Lean bei langem Oberschenkel normal.\n"
        "NICHT BEURTEILBAR: Knie-Einknicken unter weiter Hose — nur bei klarem sichtbarem Valgus ansprechen. "
        "Tiefe wenn nicht von der Seite gefilmt. Tempo. Fersen-Druck — nicht sichtbar."
    ),
    "Kreuzheben": (
        "Fokus-Kriterien: Stange nah am Körper, Hüft-Hinge klar erkennbar, "
        "Lockout mit Hüftstreckung, Schultern über/leicht vor der Stange beim Start.\n"
        "TOLERANZEN: Thorakale Rundung (oberer Rücken) bei schwer akzeptabel — "
        "nur LUMBALER Rundrücken (unterer Rücken) ist gefährlich. "
        "Leichtes Verlangsamen an den Knien bei Maximalgewicht normal.\n"
        "NICHT BEURTEILBAR: Stangen-Abstand zum Körper wenn nicht von der Seite gefilmt. "
        "Lumbale Rundung unter weitem Shirt/Gürtel. Tempo. Atemtechnik."
    ),
    "Hip Thrust": (
        "Fokus-Kriterien: Schulterblätter auf der Bank, volle Hüftstreckung oben, "
        "Kinn leicht zur Brust, Füße hüftbreit und fest.\n"
        "TOLERANZEN: Kniewinkel 80-100° akzeptabel. Füße leicht nach außen OK. "
        "Leichtes Hohlkreuz am obersten Punkt bei schwer normal — nur extremes Überstrecken abziehen.\n"
        "NICHT BEURTEILBAR: Hüftstreckung vollständig wenn weite Kleidung die Hüftlinie verdeckt — "
        "im Zweifel als vollständig werten. Glute-Kontraktion — nicht sichtbar. Tempo."
    ),
    "Face Pulls Kabelturm": (
        "Fokus-Kriterien: Ellbogen hoch, externe Rotation am Ende, Schulterblätter zusammen.\n"
        "TOLERANZEN: Ellbogen müssen nicht zwingend ÜBER Schultern sein. "
        "Leichter Rumpf-Schwung bei letzten Wiederholungen normal. "
        "Kabelansatz-Höhe variiert je nach Gerät — kein Technikfehler.\n"
        "NICHT BEURTEILBAR: Externe Rotation vollständig wenn von vorne gefilmt. "
        "Schulterblatt-Zusammenzug unter weitem Shirt. Tempo."
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
    "Rudern Kabelzug": (
        "Fokus-Kriterien: Neutrale Wirbelsäule beim Ziehen, Schulterblätter aktiv zusammenziehen am Ende, "
        "Ellbogen nah am Körper, Kabelzug zur Bauch-/Hüftregion, stabile Hüfte.\n"
        "TOLERANZEN: Leichter Oberkörper-Schwung bei schweren Gewichten normal — nur starkes Hin- und Herschaukeln ist Fehler. "
        "Griffposition variiert je nach Aufsatz (eng/weit/neutral) — kein Fehler. "
        "Ellbogen müssen nicht zwingend hinter den Körper — Schulterblatt-Retraktion wichtiger.\n"
        "NICHT BEURTEILBAR: Schulterblatt-Retraktion vollständig unter weitem Shirt. "
        "Griffkraft. Tempo. Atemtechnik."
    ),
    "Rumänisches Kreuzheben": (
        "Fokus-Kriterien: Hüft-Hinge klar erkennbar (Hüfte geht nach hinten, nicht Knie nach vorne), "
        "Wirbelsäule neutral über die gesamte Bewegung, Stange/Hanteln bleiben nah am Körper, "
        "leichte Kniebeugung OK aber Bewegung kommt aus der Hüfte, Dehnung in der hinteren Oberschenkelrückseite.\n"
        "TOLERANZEN: Knie leicht gebeugt ist NORMAL und korrekt — kein Fehler. "
        "Tiefe variiert mit Hamstring-Mobilität — nicht jeder erreicht den Boden. "
        "Leichter thorakaler Rundrücken bei schwer akzeptabel — nur lumbaler Rundrücken ist gefährlich.\n"
        "NICHT BEURTEILBAR: Lumbale Rundung unter weitem Shirt/Gürtel. "
        "Hamstring-Dehnung — nicht sichtbar. Tempo."
    ),
    "Ausfallschritte": (
        "Fokus-Kriterien: Knie folgt der Fußspitze (vorderes Bein), stabiler Oberkörper, "
        "hinteres Knie sinkt kontrolliert Richtung Boden, Schrittlänge ausreichend.\n"
        "TOLERANZEN: Knie DARF über die Zehenspitzen gehen — biomechanisch korrekt. "
        "Leichtes Vorneigen des Oberkörpers bei Glute-Fokus ist korrekte Technik. "
        "Leichtes Wackeln bei schweren Gewichten normal — nur starkes seitliches Ausweichen ist Fehler. "
        "Schrittlänge variiert je nach Körpergröße und Zielmuskel.\n"
        "NICHT BEURTEILBAR: Knie-Einknicken unter weiter Hose — nur bei klarem sichtbarem Valgus ansprechen. "
        "Tempo. Bodenkontakt des hinteren Knies exakt."
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
            "✓ LOCKOUT-REGEL (sehr wichtig): Bei Step Up mit Glute-Fokus und vorgelehtem Oberkörper entstehen "
            "zwei optische Täuschungen:\n"
            "  1. Das KNIE wirkt leicht gebeugt obwohl es gestreckt ist (weite Kleidung + Vorbeuge).\n"
            "  2. Die HÜFTE wirkt leicht gebeugt weil der Oberkörper vorne ist — das ist NORMAL und KORREKT.\n"
            "SCHREIBE NIEMALS eine Correction über: 'Knie nicht vollständig gestreckt', "
            "'Hüfte nicht vollständig gestreckt', 'Lockout fehlt', 'Hüfte bleibt leicht gebeugt', "
            "'vollständige Hüftstreckung nicht erreicht' — all das sind false positives beim Glute-Fokus.\n"
            "Der Lockout ist erreicht wenn das Bein insgesamt gestreckt wirkt. "
            "Nur bei einem KLAREN sichtbaren Knick >30° im Knie oder Hüfte darf es erwähnt werden.\n"
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
    "Ausfallschritte": {
        "Gesäß / Glutes": (
            "FOKUS GESÄSS — angepasste Kriterien:\n"
            "✓ Oberkörper-Vorbeuge (ca. 15-30°) ist KORREKTE TECHNIK für Glute-Aktivierung — NICHT als Fehler werten.\n"
            "✓ Längerer Schritt nach vorne fördert mehr Hüft-Dominanz — korrekt.\n"
            "✓ Vorderes Knie bleibt hinter oder auf Höhe der Zehenspitze bei langem Schritt — normal.\n"
            "✓ Hinteres Knie sinkt tief Richtung Boden für maximale Hüft-Flexion.\n"
            "NICHT als Fehler: Vorneigen, langes Schritt, tiefes hinteres Knie.\n"
            "Kritisiere NUR bei eindeutigem Katzenbuckel oder starkem seitlichem Ausweichen."
        ),
        "Quadrizeps": (
            "FOKUS QUADRIZEPS — angepasste Kriterien:\n"
            "✓ Aufrechter Oberkörper erwünscht — fördert Knie-dominante Bewegung.\n"
            "✓ Kürzerer Schritt erlaubt mehr Knie-Dominanz.\n"
            "✓ Knie darf und soll aktiv nach vorne über die Zehenspitzen wandern.\n"
            "✓ Volle Kniestreckung beim Hochkommen."
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


def _get_duration(video_path: str) -> float:
    """Get video duration in seconds."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path,
        ],
        capture_output=True, text=True, timeout=30,
    )
    return float(result.stdout.strip())


def _frame_diff(path1: str, path2: str) -> float:
    """Calculate mean pixel difference between two frames (no numpy needed)."""
    from PIL import Image
    img1 = Image.open(path1).convert("L").resize((80, 60))
    img2 = Image.open(path2).convert("L").resize((80, 60))
    p1, p2 = list(img1.getdata()), list(img2.getdata())
    return sum(abs(a - b) for a, b in zip(p1, p2)) / len(p1)


def _extract_frames(video_path: str, num_frames: int = NUM_FRAMES) -> list[str]:
    """Extract frames at movement extremes (Umkehrpunkte) using motion analysis.

    Strategy:
    1. Extract NUM_CANDIDATES candidate frames evenly spaced (small size, fast)
    2. Calculate motion score per candidate = avg diff to neighbours
    3. Low motion score = little movement = Umkehrpunkt (top/bottom of rep)
    4. Always keep first + last frame, fill rest with lowest-motion candidates
    5. Re-extract selected frames at full resolution for Claude
    """
    NUM_CANDIDATES = max(num_frames * 3, 15)

    with tempfile.TemporaryDirectory() as tmp_dir:
        duration = _get_duration(video_path)

        # Step 1: Extract candidates at small size (fast, cheap)
        candidate_paths = []
        for i in range(NUM_CANDIDATES):
            timestamp = duration * i / (NUM_CANDIDATES - 1)
            path = os.path.join(tmp_dir, f"cand_{i:02d}.jpg")
            subprocess.run(
                ["ffmpeg", "-ss", str(timestamp), "-i", video_path,
                 "-vframes", "1", "-q:v", "5", "-vf", "scale=160:-1", path, "-y"],
                capture_output=True, timeout=30,
            )
            if os.path.exists(path):
                candidate_paths.append((i, timestamp, path))

        if len(candidate_paths) < num_frames:
            # Fallback: evenly spaced if candidates failed
            candidate_paths = []
            for i in range(num_frames):
                timestamp = duration * (i + 0.5) / num_frames
                candidate_paths.append((i, timestamp, None))

        # Step 2: Motion score per candidate (avg diff to neighbours)
        motion_scores: dict[int, float] = {}
        for idx, (i, ts, path) in enumerate(candidate_paths):
            if path is None:
                motion_scores[i] = 999.0
                continue
            diffs = []
            if idx > 0 and candidate_paths[idx - 1][2]:
                diffs.append(_frame_diff(candidate_paths[idx - 1][2], path))
            if idx < len(candidate_paths) - 1 and candidate_paths[idx + 1][2]:
                diffs.append(_frame_diff(path, candidate_paths[idx + 1][2]))
            motion_scores[i] = sum(diffs) / len(diffs) if diffs else 999.0

        # Step 3: Always keep first + last, select lowest-motion for the rest
        first = candidate_paths[0]
        last = candidate_paths[-1]
        middle = candidate_paths[1:-1]
        middle_sorted = sorted(middle, key=lambda x: motion_scores[x[0]])
        selected = [first] + middle_sorted[: num_frames - 2] + [last]
        selected = sorted(selected, key=lambda x: x[0])  # restore chronological order

        # Step 4: Re-extract selected frames at full resolution
        frames_b64 = []
        for rank, (i, timestamp, _) in enumerate(selected):
            frame_path = os.path.join(tmp_dir, f"frame_{rank:02d}.jpg")
            subprocess.run(
                ["ffmpeg", "-ss", str(timestamp), "-i", video_path,
                 "-vframes", "1", "-q:v", "2", "-vf", "scale=480:-1", frame_path, "-y"],
                capture_output=True, timeout=60,
            )
            if os.path.exists(frame_path):
                with open(frame_path, "rb") as f:
                    frames_b64.append(base64.standard_b64encode(f.read()).decode("utf-8"))

    return frames_b64


async def analyze_exercise(video_path: str, exercise_type: str, muscle_focus: str | None = None) -> dict:
    """Extract frames from video, analyze with Claude."""
    # Validate video duration
    duration = _get_duration(video_path)
    if duration > MAX_VIDEO_DURATION:
        raise ValueError(
            f"Video zu lang ({duration:.0f}s). Maximum: {MAX_VIDEO_DURATION:.0f} Sekunden. "
            "Bitte filme einen kurzen Clip mit 2-3 Wiederholungen."
        )

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

    import asyncio
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.messages.create(
            model=MODEL,
            max_tokens=1800,
            temperature=0.5,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content}],
        ),
    )

    raw = response.content[0].text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(
            "Die KI-Analyse konnte nicht verarbeitet werden. Bitte versuche es erneut."
        )

    # Validate & recalculate score from teilscores if present
    if "teilscores" in result:
        ts = result["teilscores"]
        result["score"] = sum(ts.get(k, 0) for k in ["haltung", "gelenke", "rom", "bewegungsfluss", "gesamteindruck"])

    return result
