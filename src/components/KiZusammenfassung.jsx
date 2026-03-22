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

  if (relevanteNotizen) {
    promptText += relevanteNotizen;
  } else {
    promptText += '- Keine spezifischen Notizen vorhanden.';
  }

  return promptText;
}


function KiZusammenfassung({ auswertung, durchschnitte, lehrprobe }) {
  const [zusammenfassung, setZusammenfassung] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setZusammenfassung('');

    const apiKey = await getEinstellung('apiKey');
    if (!apiKey) {
      setError('Fehler: Kein API-Schlüssel in den Einstellungen gefunden. Bitte füge deinen Anthropic API-Schlüssel in den Einstellungen hinzu.');
      setIsLoading(false);
      return;
    }

    try {
      const prompt = erstellePrompt(durchschnitte, auswertung.notizen, lehrprobe);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP-Fehler ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      setZusammenfassung(text);
    } catch (e) {
      console.error(e);
      setError(
        `Ein Fehler ist bei der Kommunikation mit der KI aufgetreten: ${e.message}. ` +
        'Prüfe die Browser-Konsole (F12) für Details. Mögliche Ursachen: API-Schlüssel falsch/abgelaufen oder keine Internetverbindung.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 print-container">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">KI-gestützte Zusammenfassung</h3>
        <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
          {isLoading ? (
            <Loader size={20} className="animate-spin" />
          ) : (
            <Wand size={20} />
          )}
          <span>{isLoading ? 'Generiere...' : 'Zusammenfassung erstellen'}</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 border border-red-200 rounded-md flex gap-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {zusammenfassung && (
        <div className="mt-4 p-4 bg-slate-50 border rounded-md">
          <pre className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed font-sans">{zusammenfassung}</pre>
        </div>
      )}
    </div>
  );
}

export default KiZusammenfassung;
