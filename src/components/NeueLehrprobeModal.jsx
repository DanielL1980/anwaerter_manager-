import { useState } from 'react';
import { addLehrprobe } from '../lib/db';
import { X, User, BookOpen, Calendar, Car, GraduationCap, Clock } from 'lucide-react';
import { format } from 'date-fns';

function NeueLehrprobeModal({ isOpen, onClose, onLehrprobeAdded }) {
  const [typ, setTyp] = useState('theorie');
  const [prüfling, setPrüfling] = useState('');
  const [thema, setThema] = useState('');
  const [datum, setDatum] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [zeitVon, setZeitVon] = useState('');
  const [zeitBis, setZeitBis] = useState('');
  const [ausbildungswoche, setAusbildungswoche] = useState('');
  const [ausbildungsstunde, setAusbildungsstunde] = useState('');
  const [unterrichtstyp, setUnterrichtstyp] = useState('erstunterricht');
  const [stufe, setStufe] = useState('grundstufe');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const berechneDauer = () => {
    if (!zeitVon || !zeitBis) return null;
    const [h1, m1] = zeitVon.split(':').map(Number);
    const [h2, m2] = zeitBis.split(':').map(Number);
    const minuten = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (minuten <= 0) return null;
    const diff = 45 - minuten;
    return { minuten, diff };
  };

  const dauer = berechneDauer();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prüfling.trim() || !thema.trim() || !datum) {
      setError('Bitte Name, Thema und Datum ausfüllen.');
      return;
    }
    const neueLehrprobe = {
      id: crypto.randomUUID(),
      typ,
      prüfling,
      thema,
      datum,
      zeitVon,
      zeitBis,
      ausbildungswoche,
      ausbildungsstunde,
      unterrichtstyp,
      stufe,
      erstelltAm: new Date().toISOString(),
    };
    await addLehrprobe(neueLehrprobe);
    onLehrprobeAdded();
    handleClose();
  };

  const handleClose = () => {
    setTyp('theorie'); setPrüfling(''); setThema('');
    setDatum(format(new Date(), 'yyyy-MM-dd'));
    setZeitVon(''); setZeitBis('');
    setAusbildungswoche(''); setAusbildungsstunde('');
    setUnterrichtstyp('erstunterricht'); setStufe('grundstufe');
    setError(''); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden my-4">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
          <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition">
            <X size={22} />
          </button>
          <h2 className="text-xl font-bold">Neue Auswertung anlegen</h2>
          <p className="text-indigo-200 text-sm mt-0.5">Typ und Angaben eintragen</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Typ */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Art der Auswertung</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTyp('theorie')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${typ === 'theorie' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                <GraduationCap size={24} />
                <span className="text-xs font-semibold text-center leading-tight">Theoretischer Unterricht</span>
              </button>
              <button type="button" onClick={() => setTyp('fahrstunde')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${typ === 'fahrstunde' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                <Car size={24} />
                <span className="text-xs font-semibold text-center leading-tight">Fahrstunde</span>
              </button>
            </div>
          </div>

          {/* Name + Thema */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-2"><User size={15} /> Name des Anwärters</span>
            </label>
            <input type="text" value={prüfling} onChange={e => setPrüfling(e.target.value)}
              className="input-field" placeholder="z.B. Schmidt Jennifer" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-2"><BookOpen size={15} />
                {typ === 'theorie' ? 'Thema des Unterrichts' : 'Thema / Fahraufgabe'}
              </span>
            </label>
            <input type="text" value={thema} onChange={e => setThema(e.target.value)}
              className="input-field"
              placeholder={typ === 'theorie' ? 'z.B. Andere Verkehrsteilnehmer' : 'z.B. Einparken, Kurvenfahren'} />
          </div>

          {/* Datum + Uhrzeit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1"><Calendar size={13} /> Datum</span>
              </label>
              <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1"><Clock size={13} /> Von</span>
              </label>
              <input type="time" value={zeitVon} onChange={e => setZeitVon(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1"><Clock size={13} /> Bis</span>
              </label>
              <input type="time" value={zeitBis} onChange={e => setZeitBis(e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Dauer-Anzeige */}
          {dauer && (
            <div className={`text-sm px-4 py-2 rounded-xl font-medium ${dauer.diff === 0 ? 'bg-emerald-50 text-emerald-700' : dauer.diff > 0 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
              Dauer: {dauer.minuten} Min. {dauer.diff > 0 ? `(${dauer.diff} Min. unter 45 Min.)` : dauer.diff < 0 ? `(${Math.abs(dauer.diff)} Min. über 45 Min.)` : '(genau 45 Min. ✓)'}
            </div>
          )}

          {/* Ausbildungsstand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ausbildungswoche</label>
              <input type="number" min="1" value={ausbildungswoche} onChange={e => setAusbildungswoche(e.target.value)}
                className="input-field" placeholder="z.B. 8" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ausbildungsstunde</label>
              <input type="number" min="1" value={ausbildungsstunde} onChange={e => setAusbildungsstunde(e.target.value)}
                className="input-field" placeholder="z.B. 12" />
            </div>
          </div>

          {/* Unterrichtstyp / Stufe */}
          {typ === 'theorie' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Art des Unterrichts</label>
              <div className="flex gap-2">
                {['erstunterricht', 'wiederholung', 'zusatz'].map(t => (
                  <button key={t} type="button" onClick={() => setUnterrichtstyp(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${unterrichtstyp === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {t === 'erstunterricht' ? 'Erstunterricht' : t === 'wiederholung' ? 'Wdh.-Unterricht' : 'Zusatzunterricht'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ausbildungsstufe</label>
              <div className="grid grid-cols-2 gap-2">
                {['grundstufe', 'aufbaustufe_a', 'aufbaustufe_b', 'leistungsstufe_a', 'leistungsstufe_b', 'reifestufe'].map(s => (
                  <button key={s} type="button" onClick={() => setStufe(s)}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${stufe === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {s === 'grundstufe' ? 'Grundstufe' : s === 'aufbaustufe_a' ? 'Aufbaustufe A' : s === 'aufbaustufe_b' ? 'Aufbaustufe B' : s === 'leistungsstufe_a' ? 'Leistungsstufe A' : s === 'leistungsstufe_b' ? 'Leistungsstufe B' : 'Reifestufe'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn btn-secondary">Abbrechen</button>
            <button type="submit" className="btn btn-primary">Auswertung anlegen</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NeueLehrprobeModal;
