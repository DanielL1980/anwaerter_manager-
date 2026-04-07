import { useState } from 'react';
import { Keyboard, Pen, FileText, X } from 'lucide-react';
import Zeichenflaeche from './Zeichenflaeche';

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

function NotizAnzeigen({ notiz, farbe, onSchliessen }) {
  const cfg = farbe === 'gelb'
    ? { bg: 'from-amber-500 to-yellow-500', label: 'Mängel vorhanden' }
    : { bg: 'from-red-500 to-red-600', label: 'Nicht erfüllt' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSchliessen} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className={`bg-gradient-to-r ${cfg.bg} px-5 py-4 text-white flex items-center justify-between`}>
          <div>
            <h3 className="font-bold">Gespeicherte Notiz</h3>
            <p className="text-white/80 text-sm">{cfg.label}</p>
          </div>
          <button onClick={onSchliessen} className="text-white/70 hover:text-white transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {notiz?.tastaturText?.trim() && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium mb-1">Tastaturnotiz:</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{notiz.tastaturText}</p>
            </div>
          )}
          {notiz?.stiftData && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium">✏️ Handschriftliche Notiz vorhanden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BewerberAmpelItem({ aufgabe, ampelWert, notiz, onAmpelChange, onNotizChange }) {
  const [notizOverlay, setNotizOverlay] = useState(null);
  const [notizAnzeigen, setNotizAnzeigen] = useState(false);

  const handleKlick = (farbe) => {
    if (ampelWert === farbe) { onAmpelChange(null); return; }
    if (farbe === 'gruen') {
      onAmpelChange('gruen');
    } else {
      setNotizOverlay(farbe);
    }
  };

  const handleNotizGespeichert = (notizDaten) => {
    onNotizChange(aufgabe.id, notizDaten);
    onAmpelChange(notizOverlay);
    setNotizOverlay(null);
  };

  const handleOverlayAbbrechen = () => {
    setNotizOverlay(null);
  };

  const hatNotiz = notiz && (notiz.tastaturText?.trim() || notiz.stiftData);

  const OPTIONEN = [
    { farbe: 'gruen', label: 'OK', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', ring: 'ring-emerald-300' },
    { farbe: 'gelb', label: 'Mängel', bg: 'bg-amber-400', hover: 'hover:bg-amber-500', ring: 'ring-amber-300' },
    { farbe: 'rot', label: 'Nicht erfüllt', bg: 'bg-red-500', hover: 'hover:bg-red-600', ring: 'ring-red-300' },
  ];

  return (
    <>
      <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-sm text-slate-700">{aufgabe.text}</p>
          {ampelWert && ampelWert !== 'gruen' && hatNotiz && (
            <button
              onClick={() => setNotizAnzeigen(true)}
              className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                ampelWert === 'gelb'
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
              }`}>
              <FileText size={12} /> Notiz anzeigen
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {OPTIONEN.map(({ farbe, label, bg, hover, ring }) => (
            <button key={farbe} onClick={() => handleKlick(farbe)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-white ${
                ampelWert === farbe
                  ? `${bg} ring-2 ${ring} scale-105 shadow-sm`
                  : `${bg} opacity-30 ${hover} hover:opacity-60`
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {notizAnzeigen && (
        <NotizAnzeigen
          notiz={notiz}
          farbe={ampelWert}
          onSchliessen={() => setNotizAnzeigen(false)}
        />
      )}

      {notizOverlay && (
        <NotizOverlay
          aufgabeId={aufgabe.id}
          farbe={notizOverlay}
          notiz={notiz}
          onSpeichern={handleNotizGespeichert}
          onSchliessen={handleOverlayAbbrechen}
        />
      )}
    </>
  );
}

export default BewerberAmpelItem;
