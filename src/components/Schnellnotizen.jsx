import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, ArrowDownToLine } from 'lucide-react';

function Schnellnotizen({ lehrprobeId, onUebernehmen }) {
  const [notizen, setNotizen] = useState([]);
  const [neu, setNeu] = useState('');

  // Aus localStorage laden (schnell, kein IndexedDB nötig)
  useEffect(() => {
    const gespeichert = localStorage.getItem(`schnellnotizen-${lehrprobeId}`);
    if (gespeichert) setNotizen(JSON.parse(gespeichert));
  }, [lehrprobeId]);

  const speichern = (liste) => {
    setNotizen(liste);
    localStorage.setItem(`schnellnotizen-${lehrprobeId}`, JSON.stringify(liste));
  };

  const hinzufuegen = () => {
    if (!neu.trim()) return;
    const liste = [...notizen, { id: Date.now(), text: neu.trim(), zeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }];
    speichern(liste);
    setNeu('');
  };

  const loeschen = (id) => speichern(notizen.filter(n => n.id !== id));

  const alleLoeschen = () => {
    if (window.confirm('Alle Schnellnotizen löschen?')) speichern([]);
  };

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Zap size={18} />
          <h3 className="font-bold">Schnellnotizen</h3>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            Live während der Beobachtung
          </span>
        </div>
        {notizen.length > 0 && (
          <button onClick={alleLoeschen} className="text-white/70 hover:text-white text-xs transition">
            Alle löschen
          </button>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-500 mb-3">
          Tippe hier schnelle Beobachtungen während des Unterrichts – später in Notizen übernehmen.
        </p>

        {/* Eingabe */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={neu}
            onChange={e => setNeu(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && hinzufuegen()}
            placeholder="Beobachtung tippen und Enter drücken..."
            className="input-field text-sm"
          />
          <button onClick={hinzufuegen}
            className="btn bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-amber-200 px-3 flex-shrink-0">
            <Plus size={18} />
          </button>
        </div>

        {/* Liste */}
        {notizen.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">Noch keine Schnellnotizen</p>
        ) : (
          <div className="space-y-2">
            {notizen.map(notiz => (
              <div key={notiz.id}
                className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl group">
                <span className="text-xs text-amber-600 font-bold flex-shrink-0 mt-0.5">{notiz.zeit}</span>
                <p className="text-sm text-slate-700 flex-1">{notiz.text}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {onUebernehmen && (
                    <button onClick={() => onUebernehmen(notiz.text)}
                      title="In Gesprächsnotizen übernehmen"
                      className="text-amber-500 hover:text-amber-700 transition">
                      <ArrowDownToLine size={15} />
                    </button>
                  )}
                  <button onClick={() => loeschen(notiz.id)}
                    className="text-slate-400 hover:text-red-500 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Schnellnotizen;
