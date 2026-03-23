import { useState } from 'react';
import { getEinstellung } from '../lib/db';
import { Wand, Loader, AlertTriangle } from 'lucide-react';

function erstellePrompt(durchschnitte, notizen, lehrprobe) {
  let promptText = `Du bist ein erfahrener Ausbildungsfahrlehrer. Deine Aufgabe ist es, eine faire, konstruktive und gut strukturierte schriftliche Zusammenfassung einer Lehrprobe zu erstellen. Diese Zusammenfassung dient als Grundlage für das Feedbackgespräch mit dem Fahrlehreranwärter.

  **Struktur:**
  1.  **Einleitung:** Beginne mit einer kurzen, freundlichen Einleitung. Nenne den Namen des Anwärters (${lehrprobe.prüfling}) und das Thema der Lehrprobe ("${lehrprobe.thema}").
  2.  **Stärken:** Hebe 1-2 Kompetenzbereiche hervor, die besonders gut waren. Ein Bereich gilt als gut, wenn der Durchschnittswert über 3.5 liegt.
  3.  **Entwicklungspotenzial:** Sprich 1-2 Kompetenzbereiche an, in denen noch Verbesserungspotenzial besteht. Ein Bereich gilt als verbesserungswürdig, wenn der Durchschnittswert unter 3.0 liegt. Formuliere dies konstruktiv und nicht anklagend.
  4.  **Konkrete Beobachtungen:** Integriere die manuellen Notizen des Prüfers, um deine Punkte zu untermauern. Gib sie nicht einfach nur wieder, sondern baue sie sinnvoll in den Fließtext ein.
  5.  **Zusammenfassung & Ausblick:** Fasse den Gesamteindruck kurz zusammen und gib eine abschließende, motivierende Empfehlung für die weitere Ausbildung.

  **Wichtige Anweisungen:**
  - Schreibe in einem professionellen, aber zugänglichen Ton.
  - Verwende eine klare Sprache und formatiere den Text mit Absätzen zur besseren Lesbarkeit.
  - Die finale Note oder ein reines "bestanden/nicht bestanden" soll NICHT erwähnt werden.
  - Konzentriere dich auf das beobachtete Verhalten und dessen Wirkung.

  **Hier sind die Daten der Lehrprobe:**

  **1. Quantitative Übersicht (Durchschnittswerte von 1-5):**
  - Sachkompetenz: ${durchschnitte.sachkompetenz?.toFixed(2) || 'N/A'}
  - Methodenkompetenz: ${durchschnitte.methodenkompetenz?.toFixed(2) || 'N/A'}
  - Sozialkompetenz: ${durchschnitte.sozialkompetenz?.toFixed(2) || 'N/A'}
  - Personalkompetenz: ${durchschnitte.personalkompetenz?.toFixed(2) || 'N/A'}

  **2. Manuelle Notizen des Prüfers:**
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
  <title>Zusammenfassung – ${lehrprobe.prüfling}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 60px auto; padding: 0 30px; color: #1e293b; line-height: 1.8; }
    h1 { font-size: 1.6rem; color: #0f172a; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 0.95rem; margin-bottom: 40px; }
    .inhalt { white-space: pre-wrap; font-size: 1rem; }
    .drucken { position: fixed; top: 20px; right: 20px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
    .drucken:hover { background: #1d4ed8; }
    @media print { .drucken { display: none; } }
  </style>
</head>
<body>
  <button class="drucken" onclick="window.print()">🖨️ Drucken / PDF</button>
  <h1>KI-Zusammenfassung: ${lehrprobe.thema}</h1>
  <p class="meta">Lehrprobe von ${lehrprobe.prüfling}</p>
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
          <h3 className="text-xl font-bold text-slate-800">KI-gestützte Zusammenfassung</h3>
          <p className="text-sm text-slate-500 mt-1">Die Zusammenfassung wird in einem neuen Tab geöffnet.</p>
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
          {isLoading ? <Loader size={20} className="animate-spin" /> : <Wand size={20} />}
          <span>{isLoading ? 'Generiere...' : 'Zusammenfassung erstellen'}</span>
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
