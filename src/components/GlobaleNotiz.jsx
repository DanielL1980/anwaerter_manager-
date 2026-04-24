import { useState, useEffect, useRef } from 'react';
import { PenLine, X, Trash2, Keyboard, Pen, Save } from 'lucide-react';
import { getGespraechsnotiz, saveGespraechsnotiz } from '../lib/db';
import Zeichenflaeche from './Zeichenflaeche';

function GlobaleNotiz({ lehrprobeId }) {
  const [offen, setOffen] = useState(false);
  const [tastaturText, setTastaturText] = useState('');
  const [stiftData, setStiftData] = useState(null);
  const [aktuellerTab, setAktuellerTab] = useState('tastatur');
  const [gespeichert, setGespeichert] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lehrprobeId) return;
    getGespraechsnotiz(lehrprobeId).then(notiz => {
      if (notiz) {
        setTastaturText(notiz.tastaturText || '');
        setStiftData(notiz.stiftData || null);
      }
    });
  }, [lehrprobeId]);

  const handleSpeichern = async () => {
    await saveGespraechsnotiz(lehrprobeId, { tastaturText, stiftData });
    setGespeichert(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setGespeichert(false), 2000);
  };

  const handleSchliessen = async () => {
    await saveGespraechsnotiz(lehrprobeId, { tastaturText, stiftData });
    setOffen(false);
  };

  const handleLoeschen = async () => {
    if (!window.confirm('Notiz wirklich löschen?')) return;
    setTastaturText('');
    setStiftData(null);
    await saveGespraechsnotiz(lehrprobeId, { tastaturText: '', stiftData: null });
  };

  const hatInhalt = tastaturText.trim() || stiftData;

  return (
    <>
      <button
        onClick={() => setOffen(true)}
        className={`fixed bottom-28 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
          hatInhalt ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-600 hover:bg-slate-700'
        }`}
        title="Schnellnotiz"
      >
        <PenLine size={22} className="text-white" />
        {hatInhalt && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />
        )}
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSchliessen} />
          <div className="relative bg-white dark:bg-slate-800 w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ height: '85vh', maxHeight: '85vh' }}>
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0 sm:rounded-t-2xl">
              <div>
                <h3 className="font-bold">Schnellnotiz</h3>
                <p className="text-violet-200 text-sm">Wird beim Schließen automatisch gespeichert</p>
              </div>
              <div className="flex items-center gap-2">
                {hatInhalt && (
                  <button onClick={handleLoeschen} className="text-violet-200 hover:text-red-300 transition p-1">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={handleSchliessen} className="text-violet-200 hover:text-white transition p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <button onClick={() => setAktuellerTab('tastatur')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${aktuellerTab === 'tastatur' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500'}`}>
                <Keyboard size={16} /> Tastatur
              </button>
              <button onClick={() => setAktuellerTab('stift')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${aktuellerTab === 'stift' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500'}`}>
                <Pen size={16} /> S Pen
              </button>
              {stiftData && aktuellerTab === 'tastatur' && (
                <span className="ml-auto flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg border border-violet-200">
                  <Pen size={12} /> Stiftnotiz vorhanden
                </span>
              )}
              {tastaturText.trim() && aktuellerTab === 'stift' && (
                <span className="ml-auto flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg border border-violet-200">
                  <Keyboard size={12} /> Textnotiz vorhanden
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden p-4">
              {aktuellerTab === 'tastatur' ? (
                <textarea value={tastaturText} onChange={e => setTastaturText(e.target.value)}
                  placeholder="Schnelle Beobachtungen, Stichworte für das Gespräch..."
                  className="w-full h-full p-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition resize-none"
                  autoFocus />
              ) : (
                <Zeichenflaeche
                  seiteId={`global-notiz-${lehrprobeId}`}
                  gespeicherteData={stiftData}
                  onSpeichern={data => setStiftData(data)}
                />
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-3 flex-shrink-0">
              <button onClick={handleSpeichern}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition active:scale-95 ${gespeichert ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                <Save size={16} />
                {gespeichert ? 'Gespeichert!' : 'Speichern'}
              </button>
              <button onClick={handleSchliessen}
                className="flex-1 py-2.5 rounded-xl font-bold text-white transition active:scale-95 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                Schließen & Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobaleNotiz;
