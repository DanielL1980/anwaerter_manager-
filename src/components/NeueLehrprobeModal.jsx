import { useState } from 'react';
import { addLehrprobe } from '../lib/db';
import { X, User, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';

function NeueLehrprobeModal({ isOpen, onClose, onLehrprobeAdded }) {
  const [prüfling, setPrüfling] = useState('');
  const [thema, setThema] = useState('');
  const [datum, setDatum] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prüfling.trim() || !thema.trim() || !datum) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }
    const neueLehrprobe = {
      id: crypto.randomUUID(),
      prüfling,
      thema,
      datum,
      erstelltAm: new Date().toISOString(),
    };
    await addLehrprobe(neueLehrprobe);
    onLehrprobeAdded();
    handleClose();
  };

  const handleClose = () => {
    setPrüfling('');
    setThema('');
    setDatum(format(new Date(), 'yyyy-MM-dd'));
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Modal-Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
          <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition">
            <X size={22} />
          </button>
          <h2 className="text-xl font-bold">Neue Lehrprobe</h2>
          <p className="text-indigo-200 text-sm mt-0.5">Angaben zur Lehrprobe eintragen</p>
        </div>

        {/* Modal-Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-2"><User size={15} /> Name des Prüflings</span>
            </label>
            <input
              type="text"
              value={prüfling}
              onChange={(e) => setPrüfling(e.target.value)}
              className="input-field"
              placeholder="z.B. Schmidt Jennifer"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-2"><BookOpen size={15} /> Thema der Lehrprobe</span>
            </label>
            <input
              type="text"
              value={thema}
              onChange={(e) => setThema(e.target.value)}
              className="input-field"
              placeholder="z.B. Andere Verkehrsteilnehmer"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-2"><Calendar size={15} /> Datum</span>
            </label>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="input-field"
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Lehrprobe anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NeueLehrprobeModal;
