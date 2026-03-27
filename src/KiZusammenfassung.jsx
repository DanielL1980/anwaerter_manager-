import { useState } from 'react';
import { getEinstellung } from '../lib/db';
import { Wand, Loader, AlertTriangle } from 'lucide-react';

function erstellePromptTheorie(durchschnitte, notizen, lehrprobe, notizblockTexte) {
  let promptText = `Du bist ein erfahrener, empathischer Ausbildungsfahrlehrer und Mentor. Du begleitest einen Fahrlehreranwärter auf seinem Weg zur Fahrlehrerlizenz. Deine Rückmeldungen sind menschlich, wertschätzend und konstruktiv – du siehst dich als Unterstützer, nicht als Richter.

Anwärter: ${lehrprobe.prüfling}
Thema des Unterrichts: ${lehrprobe.thema}
${lehrprobe.ausbildungswoche ? `Ausbildungswoche: ${lehrprobe.ausbildungswoche}` : ''}
${lehrprobe.unterrichtstyp ? `Art: ${lehrprobe.unterrichtstyp}` : ''}

Erstelle eine strukturierte Analyse als Grundlage für ein Auswertungsgespräch. Schreibe in Stichpunkten, aber formuliere sie menschlich und empathisch – nicht kalt oder bürokratisch.

## 1. Erster Eindruck & Stärken
- Was hat ${lehrprobe.prüfling} besonders gut gemacht? (Durchschnitt > 3.5)
- Was zeigt, dass er/sie auf dem richtigen Weg ist?
- Formuliere anerkennend und konkret – nenne spezifische Beobachtungen

## 2. Entwicklungsfelder (konstruktiv formuliert)
- Was kann noch wachsen? (Durchschnitt < 3.0)
- Formuliere nicht als Kritik, sondern als Einladung zur Weiterentwicklung
- Bezug zu: § 1 FschAusbO, § 4 FschAusbO, relevante StVO-Paragraphen

## 3. Rechtliche Einordnung (kurz & praxisnah)
- Welche konkreten Paragraphen sind für diesen Unterricht relevant?
- Kurze Erklärung warum – nicht nur aufzählen

## 4. Gesprächsleitfaden
- 4-6 offene Fragen die zur Selbstreflexion einladen (z.B. "Wie hast du das erlebt?", "Was würdest du beim nächsten Mal anders machen?")
- Fragen sollen Vertrauen aufbauen, nicht einschüchtern

## 5. Nächste Schritte
- 2-3 konkrete, erreichbare Entwicklungsziele für die nächste Unterrichtseinheit
- Formuliere motivierend: was der Anwärter als nächstes ausprobieren kann

Wichtige Anweisungen:
- Stichpunkte, aber menschlich und empathisch formuliert
- Nenne ${lehrprobe.prüfling} beim Namen wo es passt
- Die Note wird NICHT erwähnt
- Ton: wie ein erfahrener Mentor der seinen Schützling aufbauen will
- Konkrete Paragraphen nennen wo relevant`;

  promptText += `\n\nBewertungsdaten:\n- Didaktik & Methodik: ${durchschnitte.didaktik?.toFixed(2) || 'N/A'}\n- Aktivierung & Atmosphäre: ${durchschnitte.aktivierung?.toFixed(2) || 'N/A'}\n- Ausbilderverhalten: ${durchschnitte.ausbilderverhalten?.toFixed(2) || 'N/A'}`;

  const relevanteNotizen = Object.entries(notizen || {})
    .filter(([, text]) => text && text.trim() !== '')
    .map(([key, text]) => `- ${key.replace(/_/g, ' ')}: ${text}`)
    .join('\n');
  if (relevanteNotizen) promptText += `\n\nHandschriftliche Notizen des Ausbilders:\n${relevanteNotizen}`;

  if (notizblockTexte && notizblockTexte.length > 0) {
    promptText += `\n\nWeitere Beobachtungsnotizen (aus dem Notizblock):\n${notizblockTexte.join('\n')}`;
  }

  return promptText;
}

function erstellePromptFahrstunde(durchschnitte, notizen, lehrprobe) {
  let promptText = `Du bist ein erfahrener, empathischer Ausbildungsfahrlehrer und Mentor. Du begleitest einen Fahrlehreranwärter auf seinem Weg zur Fahrlehrerlizenz. Deine Rückmeldungen sind menschlich, wertschätzend und konstruktiv – du siehst dich als Unterstützer, nicht als Richter. Du kennst die Nervosität und den Druck den ein Anwärter bei einer Beobachtungsfahrt erlebt, und nimmst das in deiner Analyse Rücksicht darauf.

Anwärter: ${lehrprobe.prüfling}
Thema der Fahrstunde: ${lehrprobe.thema}
${lehrprobe.stufe ? `Ausbildungsstufe: ${lehrprobe.stufe}` : ''}
${lehrprobe.ausbildungswoche ? `Ausbildungswoche: ${lehrprobe.ausbildungswoche}` : ''}

Erstelle eine strukturierte Analyse als Grundlage für ein Auswertungsgespräch. Schreibe in Stichpunkten, aber formuliere sie menschlich und empathisch – nicht kalt oder bürokratisch.

## 1. Erster Eindruck & Stärken
- Was hat ${lehrprobe.prüfling} in dieser Fahrstunde besonders gut gemacht? (Durchschnitt > 3.5)
- Wo zeigt sich Sicherheit, Routine oder pädagogisches Gespür?
- Formuliere anerkennend und konkret – nenne spezifische Beobachtungen aus der Fahrt

## 2. Entwicklungsfelder (konstruktiv formuliert)
- Was kann noch wachsen? (Durchschnitt < 3.0)
- Bereiche: Einleitung, AGVA-Didaktik, Sicherheit & Verkehrsregeln, Kommunikation, Abschlussbesprechung
- Formuliere nicht als Fehler, sondern als nächsten Entwicklungsschritt
- Bezug zu: § 1 FschAusbO, § 3 FschAusbO, relevante StVO-Paragraphen – kurz erklärt warum

## 3. Sicherheit & Rechtliches (praxisnah)
- Wurden sicherheitsrelevante Aspekte ausreichend thematisiert?
- Konkrete Paragraphen mit kurzer Begründung – nicht nur aufzählen
- Formuliere so dass ${lehrprobe.prüfling} versteht warum das wichtig ist

## 4. Gesprächsleitfaden
- 4-6 offene Fragen die zur Selbstreflexion einladen
- Beispiele: "Wie hast du die Reaktion des Fahrschülers wahrgenommen?", "Was würdest du beim nächsten Mal in der Einleitung anders machen?"
- Fragen sollen Vertrauen aufbauen und eigenes Nachdenken fördern

## 5. Nächste Schritte
- 2-3 konkrete, erreichbare Entwicklungsziele für die nächste Fahrstunde
- Formuliere motivierend: was ${lehrprobe.prüfling} als nächstes ausprobieren oder vertiefen kann

Wichtige Anweisungen:
- Stichpunkte, aber menschlich und empathisch formuliert
- Nenne ${lehrprobe.prüfling} beim Namen wo es passt und sich natürlich anfühlt
- Die Note wird NICHT erwähnt
- Ton: wie ein erfahrener Mentor der seinen Schützling aufbauen und stärken will
- Konkrete Paragraphen nennen wo relevant, aber immer mit Bezug zur Praxis`;

  promptText += `\n\nBewertungsdaten:\n- Einleitung: ${durchschnitte.einleitung_fahrt?.toFixed(2) || 'N/A'}\n- Didaktik/AGVA: ${durchschnitte.didaktik_fahrt?.toFixed(2) || 'N/A'}\n- Sicherheit: ${durchschnitte.sicherheit?.toFixed(2) || 'N/A'}\n- Kommunikation: ${durchschnitte.kommunikation_fahrt?.toFixed(2) || 'N/A'}\n- Abschluss: ${durchschnitte.abschluss_fahrt?.toFixed(2) || 'N/A'}`;

  const relevanteNotizen = Object.entries(notizen || {})
    .filter(([, text]) => text && text.trim() !== '')
    .map(([key, text]) => `- ${key.replace(/_/g, ' ')}: ${text}`)
    .join('\n');
  if (relevanteNotizen) promptText += `\n\nHandschriftliche Notizen:\n${relevanteNotizen}`;

  return promptText;
}

function KiZusammenfassung({ auswertung, durchschnitte, lehrprobe, notizblockTexte }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [kiText, setKiText] = useState('');
  const [kopiert, setKopiert] = useState(false);

  const istFahrstunde = lehrprobe?.typ === 'fahrstunde';

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
      const prompt = istFahrstunde
        ? erstellePromptFahrstunde(durchschnitte, auswertung.notizen, lehrprobe)
        : erstellePromptTheorie(durchschnitte, auswertung.notizen, lehrprobe, notizblockTexte);

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
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Keine Antwort von der KI erhalten.');
      setKiText(text);
      oeffneInTab(text, lehrprobe);

    } catch (e) {
      console.error(e);
      setError(`Fehler bei der KI-Anfrage: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKopieren = async () => {
    if (!kiText) return;
    const istFahrstunde = lehrprobe?.typ === 'fahrstunde';
    const html = `<html><body>
      <h1 style="font-size:16pt;border-bottom:2px solid #000;padding-bottom:6px">
        ${istFahrstunde ? 'KI-Fahrstunden-Analyse' : 'KI-Unterrichtsanalyse'}: ${lehrprobe.thema}
      </h1>
      <p style="color:#666;font-size:9pt;margin-bottom:12px">Anwärter: ${lehrprobe.prüfling} · ${lehrprobe.datum}</p>
      <div style="font-size:10pt;line-height:1.6;white-space:pre-wrap">${kiText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </body></html>`;
    try {
      const blob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = kiText;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 3000);
  };

  return (
    <div className="card p-5 print-container">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">KI-gestützte Analyse</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {istFahrstunde ? 'Fahrstunden-Analyse' : 'Empathische Unterrichtsanalyse'} – öffnet in neuem Tab
          </p>
        </div>
        <div className="flex gap-2">
          {kiText && (
            <button onClick={handleKopieren}
              className={`btn ${kopiert ? 'bg-emerald-600 text-white' : 'btn-secondary'}`}
              title="KI-Analyse in Zwischenablage kopieren">
              {kopiert ? '✓ Kopiert!' : '📋 Kopieren'}
            </button>
          )}
          <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
            {isLoading ? <Loader size={20} className="animate-spin" /> : <Wand size={20} />}
            <span>{isLoading ? 'Analysiere...' : 'Analyse erstellen'}</span>
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 border border-red-200 rounded-md flex gap-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {kiText && !isLoading && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          ✓ Analyse erstellt – Tab geöffnet oder 📋 Kopieren für Google Docs
        </p>
      )}
    </div>
  );
}

function oeffneInTab(text, lehrprobe) {
  const istFahrstunde = lehrprobe?.typ === 'fahrstunde';
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
    .drucken { position: fixed; top: 20px; right: 20px; background: ${istFahrstunde ? '#2563eb' : '#7c3aed'}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
    @media print { .drucken { display: none; } body { margin: 20px; } }
  </style>
</head>
<body>
  <button class="drucken" onclick="window.print()">🖨️ Drucken / PDF</button>
  <h1>${istFahrstunde ? 'Fahrstunden-Analyse' : 'Unterrichtsanalyse'}: ${lehrprobe.thema}</h1>
  <p class="meta">Anwärter: <strong>${lehrprobe.prüfling}</strong></p>
  <div class="inhalt">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}

export default KiZusammenfassung;
