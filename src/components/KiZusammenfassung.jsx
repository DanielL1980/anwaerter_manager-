import { useState } from 'react';
import { getEinstellung } from '../lib/db';
import { Wand, Loader, AlertTriangle } from 'lucide-react';

function erstellePrompt(durchschnitte, notizen, lehrprobe) {
  let promptText = `Du bist ein erfahrener Ausbildungsfahrlehrer und Fahrlehrerausbilder mit tiefem Fachwissen in der Fahrerlaubnis-Verordnung (FeV), der Fahrschüler-Ausbildungsordnung (FahrschAusbO) und dem Straßenverkehrsrecht (StVO, StVG, StVZO). Deine Aufgabe ist es, eine strukturierte, stichpunktartige Analyse einer Lehrprobe zu erstellen, die als Grundlage für ein mindestens 20-minütiges Auswertungsgespräch mit dem Fahrlehreranwärter dient.

Anwärter: ${lehrprobe.prüfling}
Thema der Lehrprobe: ${lehrprobe.thema}

Erstelle die Analyse nach folgender Struktur – ausschließlich in Stichpunkten:

## 1. Gesamtüberblick
- Anwärter, Thema, Kurzeinschätzung des Gesamteindrucks

## 2. Analyse je Kompetenzbereich
Für jeden der vier Bereiche (Sachkompetenz, Methodenkompetenz, Sozialkompetenz, Personalkompetenz):
- Beobachtungen: Was wurde konkret festgestellt?
- Stärken: Was lief gut? (Durchschnitt > 3.5 = Stärke)
- Schwächen/Entwicklungsfelder: Was war unzureichend? (Durchschnitt < 3.0 = Handlungsbedarf)
- Bezug zu Rechtsgrundlagen: Welche konkreten Paragraphen aus FeV, FahrschAusbO, StVO oder StVG sind relevant? (z.B. § 6 FahrschAusbO, § 2 FeV, § 1 StVO)
- Handlungsempfehlungen: Konkrete, umsetzbare Verbesserungsvorschläge

## 3. Rechtliche Einordnung
- Welche Anforderungen aus FeV und FahrschAusbO wurden erfüllt / nicht erfüllt?
- Relevante Paragraphen mit kurzer Begründung

## 4. Pro / Kontra Gesamtbewertung
- Pro: Was spricht für eine positive Entwicklung
- Kontra: Was fehlt noch oder ist problematisch

## 5. Gesprächsleitfaden für das Auswertungsgespräch
- 5-8 konkrete Fragen die den Anwärter zur Selbstreflexion anregen
- Hinweise worauf der Ausbilder im Gespräch besonders achten sollte

## 6. Empfehlungen für die weitere Ausbildung
- Konkrete nächste Schritte
- Themen die in zukünftigen Lehrproben beobachtet werden sollten

Wichtige Anweisungen:
- Ausschließlich Stichpunkte, kein Fließtext
- Immer konkrete Paragraphen nennen, nie nur allgemein auf Gesetze verweisen
- Professioneller, sachlicher Ton – wertschätzend aber klar
- Die finale Note oder "bestanden/nicht bestanden" wird NICHT erwähnt
- Jeder Stichpunkt soll als Gesprächsgrundlage für mind. 1-2 Minuten taugen

Quantitative Bewertung (Durchschnittswerte von 1-5):
- Sachkompetenz: ${durchschnitte.sachkompetenz?.toFixed(2) || 'N/A'}
- Methodenkompetenz: ${durchschnitte.methodenkompetenz?.toFixed(2) || 'N/A'}
- Sozialkompetenz: ${durchschnitte.sozialkompetenz?.toFixed(2) || 'N/A'}
- Personalkompetenz: ${durchschnitte.personalkompetenz?.toFixed(2) || 'N/A'}

Manuelle Notizen des Prüfers:
`;

  const relevanteNotizen = Object.entries(notizen)
    .filter(([, text]) => text && text.trim() !== '')
    .map(([key, text]) => `- Notiz zu "${key.replace(/_/g, ' ')}": ${text}`)
    .join('\n');

  promptText += relevanteNotizen || '- Keine spezifischen Notizen vorhanden.';
  return promptText;
}

function oeffneZusammenfassungInTab(text, lehrprobe) {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analyse – ${lehrprobe.prüfling}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 60px auto; padding: 0 30px; color: #1e293b; line-height: 1.7; }
    h1 { font-size: 1.6rem; color: #0f172a; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 0.95rem; margin-bottom: 40px; }
    .inhalt { white-space: pre-wrap; font-size: 0.95rem; }
    .inhalt h2, .inhalt ## { font-weight: bold; margin-top: 24px; }
    .drucken { position: fixed; top: 20px; right: 20px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
    .drucken:hover { background: #1d4ed8; }
    @media print { .drucken { display: none; } body { margin: 20px; } }
  </style>
</head>
<body>
  <button class="drucken" onclick="window.print()">🖨️ Drucken / PDF</button>
  <h1>Lehrproben-Analyse: ${lehrprobe.thema}</h1>
  <p class="meta">Anwärter: <strong>${lehrprobe.prüfling}</strong></p>
  <div class="inhalt">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function KiZusammenfassung({ auswertung, durchschnitte, lehrprobe }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');

    const apiKey = await getEinstellung('apiKey');
    if (!apiKey) {
      setError('Fehler: Kein API-Schlüssel gefunden. Bitte füge deinen Google AI API-Schlüssel in den Einstellungen hinzu.');
      setIsLoading(false);
      return;
    }

    try {
      const prompt = erstellePrompt(durchschnitte, auswertung.notizen, lehrprobe);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 8000 }
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error('Keine Antwort von der KI erhalten.');
      oeffneZusammenfassungInTab(text, lehrprobe);

    } catch (e) {
      console.error(e);
      setError(`Fehler bei der KI-Anfrage: ${e.message}. Bitte prüfe deinen Google AI API-Schlüssel in den Einstellungen.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 print-container">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">KI-gestützte Analyse</h3>
          <p className="text-sm text-slate-500 mt-1">Öffnet eine detaillierte Auswertung in einem neuen Tab.</p>
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
          {isLoading ? <Loader size={20} className="animate-spin" /> : <Wand size={20} />}
          <span>{isLoading ? 'Analysiere...' : 'Analyse erstellen'}</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 border border-red-200 rounded-md flex gap-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

export default KiZusammenfassung;
