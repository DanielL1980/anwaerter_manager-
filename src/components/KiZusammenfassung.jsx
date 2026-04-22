import { useState } from 'react';
import { getEinstellung } from '../lib/db';
import { Wand2, Loader, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

function erstellePrompt(durchschnitte, notizen, lehrprobe) {
  let promptText = `Du bist ein erfahrener Ausbildungsfahrlehrer. Erstelle eine strukturierte Analyse einer Auswertung als JSON.

Antworte NUR mit validem JSON, kein Text davor oder danach, keine Markdown-Codeblöcke.

Format:
{
  "gesamteindruck": "Ein kurzer Satz zum Gesamteindruck (max. 15 Wörter)",
  "bereiche": [
    {
      "name": "Bereichsname",
      "ampel": "gruen" | "gelb" | "rot",
      "schlagwort": "2-3 Wörter Kernaussage",
      "beobachtung": "Ein konkreter Satz was beobachtet wurde (max. 20 Wörter)",
      "empfehlung": "Ein konkreter Handlungshinweis (max. 15 Wörter)"
    }
  ],
  "staerken": ["Stärke 1 (max. 8 Wörter)", "Stärke 2"],
  "entwicklung": ["Entwicklungsfeld 1 (max. 8 Wörter)", "Entwicklungsfeld 2"],
  "naechster_schritt": "Ein konkreter nächster Schritt für den Anwärter (max. 20 Wörter)"
}

Ampel-Regeln:
- gruen: Durchschnitt >= 3.5
- gelb: Durchschnitt >= 2.5 und < 3.5  
- rot: Durchschnitt < 2.5

Daten der Auswertung:
Anwärter: ${lehrprobe.prüfling}
Thema: ${lehrprobe.thema}

Durchschnittswerte (1-5):
- Einleitung der Fahrstunde: ${durchschnitte.einleitung?.toFixed(2) || 'N/A'}
- Didaktische Konzeption: ${durchschnitte.didaktik?.toFixed(2) || 'N/A'}
- Sicherheit & Verkehrsregeln: ${durchschnitte.sicherheit?.toFixed(2) || 'N/A'}
- Kommunikation & Ausbilderverhalten: ${durchschnitte.kommunikation?.toFixed(2) || 'N/A'}
- Abschlussbesprechung & Reflexion: ${durchschnitte.abschluss?.toFixed(2) || 'N/A'}

Notizen des Prüfers:
`;

  const relevanteNotizen = Object.entries(notizen)
    .filter(([, text]) => text && text.trim() !== '')
    .map(([key, text]) => `- ${key.replace(/_/g, ' ')}: ${text}`)
    .join('\n');

  promptText += relevanteNotizen || '- Keine spezifischen Notizen vorhanden.';
  return promptText;
}

const AMPEL_CONFIG = {
  gruen:  { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: 'Stark' },
  gelb:   { bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   label: 'Ausbaufähig' },
  rot:    { bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',       label: 'Handlungsbedarf' },
};

function BereichKarte({ bereich, index }) {
  const [offen, setOffen] = useState(false);
  const cfg = AMPEL_CONFIG[bereich.ampel] || AMPEL_CONFIG.gelb;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setOffen(!offen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-95 transition"
      >
        {/* Ampelpunkt */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />

        {/* Schlagwort + Name */}
        <div className="flex-1 min-w-0">
          <span className={`font-bold text-sm ${cfg.text}`}>{bereich.schlagwort}</span>
          <span className="text-slate-400 text-sm mx-1.5">·</span>
          <span className="text-slate-600 text-sm">{bereich.name}</span>
        </div>

        {/* Badge */}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>

        {/* Toggle */}
        <span className="text-slate-400 flex-shrink-0">
          {offen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {offen && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-opacity-50 border-current">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Beobachtung</p>
            <p className="text-sm text-slate-700">{bereich.beobachtung}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Empfehlung</p>
            <p className={`text-sm font-medium ${cfg.text}`}>{bereich.empfehlung}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function KiZusammenfassung({ auswertung, durchschnitte, lehrprobe }) {
  const [analyse, setAnalyse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setAnalyse(null);

    const apiKey = await getEinstellung('apiKey');
    if (!apiKey) {
      setError('Kein API-Schlüssel gefunden. Bitte in den Einstellungen hinterlegen.');
      setIsLoading(false);
      return;
    }

    try {
      const prompt = erstellePrompt(durchschnitte, auswertung.notizen || {}, lehrprobe);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1500, temperature: 0.3 }
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Keine Antwort erhalten.');

      // JSON parsen – Markdown-Fences entfernen falls vorhanden
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(clean);
      setAnalyse(parsed);

    } catch (e) {
      console.error(e);
      setError(`Fehler bei der KI-Anfrage: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">KI-gestützte Analyse</h3>
          <p className="text-slate-400 text-sm">Fahrstunden-Analyse – öffnet in neuem Tab</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition active:scale-95 disabled:opacity-60"
        >
          {isLoading ? <Loader size={16} className="animate-spin" /> : <Wand2 size={16} />}
          <span>{isLoading ? 'Analysiere...' : 'Analyse erstellen'}</span>
        </button>
      </div>

      {/* Fehler */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Ergebnis */}
      {analyse && (
        <div className="space-y-4">

          {/* Gesamteindruck */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Gesamteindruck</p>
            <p className="text-slate-800 font-semibold">{analyse.gesamteindruck}</p>
          </div>

          {/* Bereiche als Stichpunkt-Karten */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Kompetenzbereiche</p>
            <div className="space-y-2">
              {analyse.bereiche?.map((bereich, i) => (
                <BereichKarte key={i} bereich={bereich} index={i} />
              ))}
            </div>
          </div>

          {/* Stärken & Entwicklung nebeneinander */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">✅ Stärken</p>
              <ul className="space-y-1">
                {analyse.staerken?.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">⚡ Entwicklung</p>
              <ul className="space-y-1">
                {analyse.entwicklung?.map((e, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Nächster Schritt */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🎯</span>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Nächster Schritt</p>
              <p className="text-sm text-slate-700 font-medium">{analyse.naechster_schritt}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default KiZusammenfassung;
