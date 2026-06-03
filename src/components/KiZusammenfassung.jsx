import { useState } from 'react';
import { getEinstellung } from '../lib/db';
import { Wand2, Loader, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

function kuerzeNotizen(notizen) {
  const eintraege = Object.entries(notizen)
    .filter(([, text]) => text && text.trim() !== '')
    .map(([key, text]) => `- ${key.replace(/_/g, ' ')}: ${text.trim().slice(0, 120)}`);
  if (eintraege.length === 0) return '- Keine spezifischen Notizen vorhanden.';
  return eintraege.join('\n');
}

function erstellePrompt(durchschnitte, notizen, lehrprobe) {
  const pruefling = lehrprobe?.prüfling || lehrprobe?.pruefling || lehrprobe?.name || 'Unbekannt';
  const thema = lehrprobe?.thema || 'Unbekannt';

  return `Du bist ein erfahrener Ausbildungsfahrlehrer der Bundeswehr.

Erstelle eine Fahrstunden-Analyse. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, ohne jeglichen Text davor oder danach, ohne Markdown, ohne Codeblöcke.

Das JSON muss exakt diesem Schema folgen:
{"gesamteindruck":"string","bereiche":[{"name":"string","ampel":"gruen|gelb|rot","schlagwort":"string","beobachtung":"string","empfehlung":"string"}],"staerken":["string"],"entwicklung":["string"],"naechster_schritt":"string"}

Regeln:
- ampel: gruen wenn Wert >= 3.5, gelb wenn >= 2.5, sonst rot
- Alle Texte kurz und prägnant (max. 15 Wörter pro Feld)
- Genau 5 Bereiche (einen pro Bewertungsbereich)

Daten:
Anwärter: ${pruefling}
Thema: ${thema}
Einleitung: ${durchschnitte.einleitung?.toFixed(2) ?? 'N/A'}
Didaktik: ${durchschnitte.didaktik?.toFixed(2) ?? 'N/A'}
Sicherheit: ${durchschnitte.sicherheit?.toFixed(2) ?? 'N/A'}
Kommunikation: ${durchschnitte.kommunikation?.toFixed(2) ?? 'N/A'}
Abschluss: ${durchschnitte.abschluss?.toFixed(2) ?? 'N/A'}

Notizen:
${kuerzeNotizen(notizen)}`;
}

const AMPEL_CONFIG = {
  gruen: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: 'Stark' },
  gelb:  { bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   label: 'Ausbaufähig' },
  rot:   { bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',       label: 'Handlungsbedarf' },
};

function BereichKarte({ bereich }) {
  const [offen, setOffen] = useState(false);
  const cfg = AMPEL_CONFIG[bereich.ampel] || AMPEL_CONFIG.gelb;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setOffen(!offen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-95 transition"
      >
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <span className={`font-bold text-sm ${cfg.text}`}>{bereich.schlagwort}</span>
          <span className="text-slate-400 text-sm mx-1.5">·</span>
          <span className="text-slate-600 text-sm">{bereich.name}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>
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
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
            // Thinking deaktivieren – verhindert dass Gemini 2.5 Denktext vor JSON einfügt
            thinkingConfig: {
              thinkingBudget: 0,
            },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Rohantwort loggen für Debugging
      console.log('[KI-Analyse] Rohantwort:', JSON.stringify(data, null, 2));

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Keine Antwort vom Modell erhalten.');

      // Aggressives Bereinigen: alles vor { und nach } entfernen
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error('[KI-Analyse] Rohtext:', text);
        throw new Error('Antwort enthält kein gültiges JSON.');
      }

      const clean = text.slice(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(clean);

      if (!parsed.gesamteindruck || !Array.isArray(parsed.bereiche)) {
        throw new Error('Unerwartetes Antwortformat. Bitte erneut versuchen.');
      }

      setAnalyse(parsed);

    } catch (e) {
      console.error('[KI-Analyse Fehler]', e);
      setError(`Fehler bei der KI-Anfrage: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">KI-gestützte Analyse</h3>
          <p className="text-slate-400 text-sm">Fahrstunden-Analyse</p>
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {analyse && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Gesamteindruck</p>
            <p className="text-slate-800 font-semibold">{analyse.gesamteindruck}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Kompetenzbereiche</p>
            <div className="space-y-2">
              {analyse.bereiche?.map((bereich, i) => (
                <BereichKarte key={i} bereich={bereich} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">✅ Stärken</p>
              <ul className="space-y-1">
                {analyse.staerken?.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">⚡ Entwicklung</p>
              <ul className="space-y-1">
                {analyse.entwicklung?.map((e, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>{e}
                  </li>
                ))}
              </ul>
            </div>
          </div>

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
