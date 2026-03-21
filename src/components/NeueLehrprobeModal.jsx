import { useState } from 'react';
import { addLehrprobe } from '../lib/db';
import { X } from 'lucide-react';
import { format } from 'date-fns';

function NeueLehrprobeModal({ isOpen, onClose, onLehrprobeAdded }) {
  const [prüfling, setPrüfling] = useState('');
  const [thema, setThema] = useState('');
  const [datum, setDatum] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

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
    onLehrprobeAdded(); // Signalisiert der Hauptseite, die Liste neu zu laden
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4">Neue Lehrprobe anlegen</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="pruefling" className="block text-sm font-medium text-gray-700 mb-1">
                Name des Prüflings
              </label>
              <input
                type="text"
                id="pruefling"
                value={prüfling}
                onChange={(e) => setPrüfling(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="thema" className="block text-sm font-medium text-gray-700 mb-1">
                Thema der Lehrprobe
              </label>
              <input
                type="text"
                id="thema"
                value={thema}
                onChange={(e) => setThema(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="datum" className="block text-sm font-medium text-gray-700 mb-1">
                Datum
              </label>
              <input
                type="date"
                id="datum"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NeueLehrprobeModal;
