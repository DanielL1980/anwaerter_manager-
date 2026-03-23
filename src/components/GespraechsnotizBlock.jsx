import { useState, useEffect, useCallback } from 'react';
import { getGespraechsnotizForLehrprobe, saveGespraechsnotiz } from '../lib/db';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { debounce } from '../lib/utils';

function GespraechsnotizBlock({ lehrprobeId }) {
  const [text, setText] = useState('');
  const [gespeichert, setGespeichert] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const laden = async () => {
      const notiz = await getGespraechsnotizForLehrprobe(lehrprobeId);
      if (notiz) setText(notiz.text);
      setLoading(false);
    };
    laden();
  }, [lehrprobeId]);

  const debouncedSave = useCallback(
    debounce(async (value) => {
      await saveGespraechsnotiz(lehrprobeId, value);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2000);
    }, 600),
    [lehrprobeId]
  );

  const handleChange = (e) => {
    setText(e.target.value);
    debouncedSave(e.target.value);
  };

  if (loading) return null;

  return (
    <div className="card overflow-hidden print-container">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <MessageSquare size={18} />
          <h3 className="font-bold">Gespraechsnotizen</h3>
        </div>
        {gespeichert && (
          <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-medium">
            <CheckCircle size={14} />
            <span>Gespeichert</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-500 mb-3">
          Notizen zum Auswertungsgespräch – werden automatisch gespeichert.
        </p>
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Gesprächsverlauf, Reaktionen des Anwärters, vereinbarte Maßnahmen..."
          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-slate-50 placeholder-slate-400 min-h-32"
          rows="6"
        />
      </div>
    </div>
  );
}

export default GesprächsnotizBlock;
