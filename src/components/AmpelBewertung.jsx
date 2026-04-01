import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Pen, Keyboard } from 'lucide-react';
import Zeichenflaeche from './Zeichenflaeche';

// =================== NOTIZ OVERLAY ===================
function NotizOverlay({ farbe, kategorieId, notizen, onSpeichern, onSchliessen }) {
  const [eingabeArt, setEingabeArt] = useState(notizen?.art || 'tastatur');
  const [tastaturText, setTastaturText] = useState(notizen?.tastaturText || '');
  const [stiftData, setStiftData] = useState(notizen?.stiftData || null);
  const [fehler, setFehler] = useState('');

  const istGefuellt = () => {
    if (eingabeArt === 'tastatur') return tastaturText.trim().length > 0;
    return stiftData !== null;
  };

  const handleSpeichern = () => {
    if (!istGefuellt()) {
      setFehler('Bitte eine Notiz eingeben bevor du fortfährst.');
      return;
    }
    onSpeichern({
      art: eingabeArt,
      tastaturText,
      stiftData,
    });
    onSchliessen();
  };

  const farbenConfig = {
    gelb: { bg: 'from-amber-500 to-yellow-500', label: 'Geringe Fehler', text: 'text-amber-700', light: 'bg-amber-50 border-amber-200' },
    rot: { bg: 'from-red-500 to-red-600', label: 'Erhebliche Mängel', text: 'text-red-700', light: 'bg-red-50 border-red-200' },
  };
  const cfg = farbenConfig[farbe];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ height: '85vh', maxHeight: '85vh' }}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${cfg.bg} px-5 py-4 text-white flex items-center justify-between flex-shrink-0 sm:rounded-t-2xl`}>
          <div>
            <h3 className="font-bold text-lg">Notiz erforderlich</h3>
            <p className="text-white/80 text-sm">{cfg.label} – Notiz muss ausgefüllt werden</p>
          </div>
          {/* Kein X-Button – Schließen nur über Speichern */}
        </div>

        {/* Eingabeart-Umschalter */}
        <div className="flex gap-2 p-4 border-b border-slate-100 flex-shrink-0">
          <button onClick={() => setEingabeArt('tastatur')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${eingabeArt === 'tastatur' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            <Keyboard size={16} /> Tastatur
          </button>
          <button onClick={() => setEingabeArt('stift')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${eingabeArt === 'stift' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            <Pen size={16} /> S Pen
          </button>
          <span className="ml-auto text-xs text-slate-400 self-center">Beide Notizen bleiben erhalten</span>
        </div>

        {/* Notizbereich */}
        <div className="flex-1 overflow-hidden p-4">
          {eingabeArt === 'tastatur' ? (
            <textarea
              value={tastaturText}
              onChange={e => { setTastaturText(e.target.value); setFehler(''); }}
              placeholder="Beobachtungen, Mängel und Hinweise eintragen..."
              className="w-full h-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
              autoFocus
            />
          ) : (
            <Zeichenflaeche
              seiteId={`ampel-${kategorieId}-${farbe}`}
              gespeicherteData={stiftData}
              onSpeichern={(data) => { setStiftData(data); setFehler(''); }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          {fehler && (
            <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{fehler}</p>
          )}
          <button onClick={handleSpeichern}
            className={`w-full py-3 rounded-xl font-bold text-white transition active:scale-95 ${istGefuellt() ? `bg-gradient-to-r ${cfg.bg}` : 'bg-slate-300 cursor-not-allowed'}`}>
            Notiz speichern & schließen
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== AMPEL KATEGORIE ===================
function AmpelKategorie({ kategorie, ampelWert, notizen, onAmpelChange, onNotizChange }) {
  const [aufgeklappt, setAufgeklappt] = useState(false);
  const [notizOverlay, setNotizOverlay] = useState(null); // 'gelb' | 'rot' | null

  const handleAmpelKlick = (farbe) => {
    if (ampelWert === farbe) {
      // Zurücksetzen
      onAmpelChange(null);
      return;
    }
    if (farbe === 'gruen') {
      onAmpelChange('gruen');
    } else {
      // Gelb oder Rot → Overlay öffnen
      onAmpelChange(farbe);
      setNotizOverlay(farbe);
    }
  };

  const handleNotizSpeichern = (notizDaten) => {
    onNotizChange(notizDaten);
    setNotizOverlay(null);
  };

  const hatNotiz = notizen && (notizen.tastaturText?.trim() || notizen.stiftData);

  const ampelConfig = {
    gruen: { bg: 'bg-emerald-500', border: 'border-emerald-600', ring: 'ring-emerald-300', label: 'Alles gut' },
    gelb: { bg: 'bg-amber-400', border: 'border-amber-500', ring: 'ring-amber-300', label: 'Geringe Fehler' },
    rot: { bg: 'bg-red-500', border: 'border-red-600', ring: 'ring-red-300', label: 'Erhebliche Mängel' },
  };

  return (
    <>
      <div className="card overflow-hidden">
        {/* Hauptzeile mit Kategorie + Ampel */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Dropdown-Toggle */}
          <button onClick={() => setAufgeklappt(!aufgeklappt)}
            className="flex items-center gap-2 flex-1 text-left min-w-0">
            <ChevronDown size={18} className={`text-slate-400 flex-shrink-0 transition-transform ${aufgeklappt ? 'rotate-180' : ''}`} />
            <span className="font-bold text-slate-800 text-sm">{kategorie.titel}</span>
            {hatNotiz && !aufgeklappt && (
              <span className="text-xs text-slate-400 truncate hidden sm:block">
                {notizen.tastaturText ? `"${notizen.tastaturText.slice(0, 30)}..."` : '✏️ Stiftnotiz vorhanden'}
              </span>
            )}
          </button>

          {/* Ampel */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {ampelWert && (
              <span className="text-xs text-slate-500 hidden sm:block">
                {ampelConfig[ampelWert]?.label}
              </span>
            )}
            <div className="flex flex-col gap-1 bg-slate-800 rounded-xl p-2">
              {['rot', 'gelb', 'gruen'].map(farbe => (
                <button
                  key={farbe}
                  onClick={() => handleAmpelKlick(farbe)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${ampelConfig[farbe].bg} ${ampelConfig[farbe].border} ${
                    ampelWert === farbe
                      ? `ring-4 ${ampelConfig[farbe].ring} scale-110`
                      : 'opacity-40 hover:opacity-80'
                  }`}
                  title={`${ampelConfig[farbe].label}${ampelWert === farbe ? ' (tippen zum Zurücksetzen)' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Notiz-Vorschau */}
        {ampelWert && ampelWert !== 'gruen' && hatNotiz && (
          <div className={`mx-4 mb-3 px-3 py-2 rounded-lg text-xs border ${ampelWert === 'gelb' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {notizen.tastaturText && <p>{notizen.tastaturText}</p>}
            {notizen.stiftData && <p className="italic">+ Stiftnotiz vorhanden</p>}
            <button onClick={() => setNotizOverlay(ampelWert)}
              className="text-xs underline mt-1 opacity-70 hover:opacity-100">
              Notiz bearbeiten
            </button>
          </div>
        )}

        {/* Aufgeklappte Unterpunkte */}
        {aufgeklappt && (
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-semibold">Kriterien (zur Orientierung)</p>
            <ul className="space-y-1">
              {kategorie.punkte.map(punkt => (
                <li key={punkt.id} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-slate-400 flex-shrink-0 mt-0.5">•</span>
                  <span>{punkt.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Notiz-Overlay */}
      {notizOverlay && (
        <NotizOverlay
          farbe={notizOverlay}
          kategorieId={kategorie.id}
          notizen={notizen}
          onSpeichern={handleNotizSpeichern}
          onSchliessen={() => {
            // Wenn keine Notiz vorhanden, Ampel zurücksetzen
            if (!hatNotiz) onAmpelChange(null);
            setNotizOverlay(null);
          }}
        />
      )}
    </>
  );
}

export default AmpelKategorie;
