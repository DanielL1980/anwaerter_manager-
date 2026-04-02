import { useState, useRef, useEffect } from 'react';
import { Keyboard, Pen } from 'lucide-react';
import Zeichenflaeche from './Zeichenflaeche';

function BewerberNotizblock({ blockId, label, gespeichert, onSpeichern }) {
  const [eingabeArt, setEingabeArt] = useState(gespeichert?.art || 'tastatur');
  const [tastaturText, setTastaturText] = useState(gespeichert?.tastaturText || '');
  const [stiftData, setStiftData] = useState(gespeichert?.stiftData || null);

  const handleTastaturChange = (text) => {
    setTastaturText(text);
    onSpeichern({ art: eingabeArt, tastaturText: text, stiftData });
  };

  const handleStiftSpeichern = (data) => {
    setStiftData(data);
    onSpeichern({ art: eingabeArt, tastaturText, stiftData: data });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-700 text-sm">{label}</h4>
        <div className="flex gap-1">
          <button onClick={() => setEingabeArt('tastatur')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${eingabeArt === 'tastatur' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            <Keyboard size={13} /> Tastatur
          </button>
          <button onClick={() => setEingabeArt('stift')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${eingabeArt === 'stift' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            <Pen size={13} /> S Pen
          </button>
        </div>
      </div>

      {eingabeArt === 'tastatur' ? (
        <textarea
          value={tastaturText}
          onChange={e => handleTastaturChange(e.target.value)}
          placeholder="Beobachtungen eintragen..."
          className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none bg-slate-50"
          rows="5"
        />
      ) : (
        <Zeichenflaeche
          seiteId={`bewerber-notiz-${blockId}`}
          gespeicherteData={stiftData}
          onSpeichern={handleStiftSpeichern}
        />
      )}

      {/* Vorschau der anderen Eingabe falls vorhanden */}
      {eingabeArt === 'stift' && tastaturText.trim() && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
          <p className="text-xs text-teal-600 font-medium mb-1">Tastaturnotiz:</p>
          <p className="text-xs text-teal-800">{tastaturText}</p>
        </div>
      )}
      {eingabeArt === 'tastatur' && stiftData && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
          <p className="text-xs text-violet-600 font-medium">✏️ Stiftnotiz vorhanden</p>
        </div>
      )}
    </div>
  );
}

export default BewerberNotizblock;
