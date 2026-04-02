import { useState } from 'react';
import { X, Keyboard, Pen } from 'lucide-react';
import Zeichenflaeche from './Zeichenflaeche';

// Notiz-Overlay bei Gelb/Rot
function NotizOverlay({ aufgabeId, farbe, notiz, onSpeichern, onSchliessen }) {
  const [eingabeArt, setEingabeArt] = useState(notiz?.art || 'tastatur');
  const [tastaturText, setTastaturText] = useState(notiz?.tastaturText || '');
  const [stiftData, setStiftData] = useState(notiz?.stiftData || null);
  const [fehler, setFehler] = useState('');

  const istGefuellt = eingabeArt === 'tastatur'
    ? tastaturText.trim().length > 0
    : stiftData !== null;

  const handleSpeichern = () => {
    if (!istGefuellt) { setFehler('Bitte eine Notiz eingeben.'); return; }
    onSpeichern({ art: eingabeArt, tastaturText, stiftData });
    onSchliessen();
  };

  const cfg = farbe === 'gelb'
    ? { bg: 'from-amber-500 to-yellow-500', label: 'Mängel vorhanden' }
    : { bg: 'from-red-500 to-red-600', label: 'Nicht erfüllt' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ height: '85vh', maxHeight: '85vh' }}>
        <div className={`bg-gradient-to-r ${cfg.bg} px-5 py-4 text-white flex items-center justify-between flex-shrink-0 sm:rounded-t-2xl`}>
          <div>
            <h3 className="font-bold">Notiz erforderlich</h3>
            <p className="text-white/80 text-sm">{cfg.label} – Notiz muss ausgefüllt werden</p>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-b border-slate-100 flex-shrink-0">
          <button onClick={() => setEingabeArt('tastatur')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${eingabeArt === 'tastatur' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}>
            <Keyboard size={16} /> Tastatur
          </button>
          <button onClick={() => setEingabeArt('stift')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${eingabeArt === 'stift' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500'}`}>
            <Pen size={16} /> S Pen
          </button>
          <span className="ml-auto text-xs text-slate-400 self-center">Beide Notizen bleiben erhalten</span>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {eingabeArt === 'tastatur' ? (
            <textarea value={tastaturText}
              onChange={e => { setTastaturText(e.target.value); setFehler(''); }}
              placeholder="Beobachtungen eintragen..."
              className="w-full h-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
              autoFocus />
          ) : (
            <Zeichenflaeche
              seiteId={`bewerber-${aufgabeId}-${farbe}`}
              gespeicherteData={stiftData}
              onSpeichern={d => { setStiftData(d); setFehler(''); }}
            />
          )}
        </div>
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          {fehler && <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{fehler}</p>}
          <button onClick={handleSpeichern}
            className={`w-full py-3 rounded-xl font-bold text-white transition active:scale-95 bg-gradient-to-r ${cfg.bg}`}>
            Notiz speichern & schließen
          </button>
        </div>
      </div>
    </div>
  );
}

// Einzelne Aufgabe mit Ampel
function BewerberAmpelItem({ aufgabe, ampelWert, notiz, onAmpelChange, onNotizChange }) {
  const [notizOverlay, setNotizOverlay] = useState(null);

  const handleAmpelKlick = (farbe) => {
    if (ampelWert === farbe) { onAmpelChange(null); return; }
    if (farbe === 'gruen') {
      onAmpelChange('gruen');
    } else {
      onAmpelChange(farbe);
      setNotizOverlay(farbe);
    }
  };

  const hatNotiz = notiz && (notiz.tastaturText?.trim() || notiz.stiftData);

  return (
    <>
      <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700">{aufgabe.text}</p>
          {ampelWert && ampelWert !== 'gruen' && hatNotiz && (
            <div className={`mt-1.5 px-2 py-1 rounded-lg text-xs border ${ampelWert === 'gelb' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {notiz.tastaturText && <p className="truncate">{notiz.tastaturText}</p>}
              {notiz.stiftData && <p className="italic">+ Stiftnotiz</p>}
              <button onClick={() => setNotizOverlay(ampelWert)} className="underline opacity-70 mt-0.5">Bearbeiten</button>
            </div>
          )}
        </div>
        {/* Ampel */}
        <div className="flex flex-col gap-1 bg-slate-800 rounded-xl p-1.5 flex-shrink-0">
          {[
            { farbe: 'rot', bg: 'bg-red-500', border: 'border-red-600', ring: 'ring-red-300' },
            { farbe: 'gelb', bg: 'bg-amber-400', border: 'border-amber-500', ring: 'ring-amber-300' },
            { farbe: 'gruen', bg: 'bg-emerald-500', border: 'border-emerald-600', ring: 'ring-emerald-300' },
          ].map(({ farbe, bg, border, ring }) => (
            <button key={farbe} onClick={() => handleAmpelKlick(farbe)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${bg} ${border} ${ampelWert === farbe ? `ring-4 ${ring} scale-110` : 'opacity-40 hover:opacity-80'}`}
              title={farbe === 'gruen' ? 'Ohne Beanstandung' : farbe === 'gelb' ? 'Mängel vorhanden' : 'Nicht erfüllt'}
            />
          ))}
        </div>
      </div>

      {notizOverlay && (
        <NotizOverlay
          aufgabeId={aufgabe.id}
          farbe={notizOverlay}
          notiz={notiz}
          onSpeichern={onNotizChange}
          onSchliessen={() => {
            if (!hatNotiz) onAmpelChange(null);
            setNotizOverlay(null);
          }}
        />
      )}
    </>
  );
}

export default BewerberAmpelItem;
