import { useState } from 'react';
import { X } from 'lucide-react';
import { addBewerberpruefung } from '../lib/bewerberDb';

function NeueBewerberPruefungModal({ isOpen, onClose, onAdded }) {
  const [bewerber, setBewerber] = useState('');
  const [dienstgrad, setDienstgrad] = useState('');
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [klasse, setKlasse] = useState('B_BE');
  const [karteNr, setKarteNr] = useState('');
  const [fehler, setFehler] = useState('');
  const [laedt, setLaedt] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!bewerber.trim() || !datum) {
      setFehler('Bitte Name und Datum eintragen.');
      return;
    }
    setLaedt(true);
    try {
      await addBewerberpruefung({
        id: crypto.randomUUID(),
        bewerber: bewerber.trim(),
        dienstgrad: dienstgrad.trim(),
        datum,
        klasse,
        karteNr: klasse === 'C_CE' ? karteNr.trim() : '',
        ampel: {},
        ampelNotizen: {},
        notizFahrenB: null,
        notizFahrenBE: null,
        notizFahrenC: null,
        notizFahrenCE: null,
        zeitTatsaechlichVon: '',
        zeitTatsaechlichBis: '',
      });
      setBewerber(''); setDienstgrad(''); setKarteNr('');
      onAdded();
      onClose();
    } catch (e) {
      setFehler('Fehler: ' + e.message);
    }
    setLaedt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold">Neue Fahrpraktische Bewertung</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><X size={22} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Klasse */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Fahrerlaubnisklasse</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'B_BE', label: 'B / BE', desc: 'PKW + Anhänger' },
                { value: 'C_CE', label: 'C / CE', desc: 'LKW + Anhänger' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setKlasse(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition ${klasse === opt.value ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}>
                  <p className={`font-bold ${klasse === opt.value ? 'text-teal-700' : 'text-slate-700'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bewerber */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name des Bewerbers</label>
            <input type="text" value={bewerber} onChange={e => setBewerber(e.target.value)}
              className="input-field" placeholder="Vorname Nachname" autoFocus />
          </div>

          {/* Dienstgrad */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dienstgrad</label>
            <input type="text" value={dienstgrad} onChange={e => setDienstgrad(e.target.value)}
              className="input-field" placeholder="z.B. Feldwebel" />
          </div>

          {/* Datum */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Datum</label>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className="input-field" />
          </div>

          {/* Karte-Nr. nur bei C/CE */}
          {klasse === 'C_CE' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Karte-Nr. (Abfahrtkontrolle)</label>
              <input type="text" value={karteNr} onChange={e => setKarteNr(e.target.value)}
                className="input-field" placeholder="z.B. 3" />
            </div>
          )}

          {fehler && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{fehler}</p>}

          <button onClick={handleSubmit} disabled={laedt}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold hover:from-teal-700 hover:to-emerald-700 transition active:scale-95">
            {laedt ? 'Wird angelegt...' : 'Bewertung anlegen'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NeueBewerberPruefungModal;
