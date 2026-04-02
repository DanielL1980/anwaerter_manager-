import { useState } from 'react';
import { Share2, X, Copy, Check, Clock } from 'lucide-react';
import { erstelleEinladungslink } from '../lib/db';

function AnwaerterTeilen({ lehrprobeId, anwaerterName }) {
  const [offen, setOffen] = useState(false);
  const [link, setLink] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [fehler, setFehler] = useState('');

  const handleLinkErstellen = async () => {
    setLaedt(true);
    setFehler('');
    try {
      const url = await erstelleEinladungslink(lehrprobeId);
      setLink(url);
    } catch (e) {
      setFehler('Fehler beim Erstellen des Links: ' + e.message);
    }
    setLaedt(false);
  };

  const handleKopieren = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    }
  };

  return (
    <>
      <button onClick={() => setOffen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm font-medium">
        <Share2 size={16} />
        <span className="hidden sm:inline">Teilen</span>
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOffen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold">Anwärter teilen</h3>
                <p className="text-indigo-200 text-sm">{anwaerterName}</p>
              </div>
              <button onClick={() => setOffen(false)} className="text-white/70 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                <p className="font-semibold mb-1">Was wird geteilt?</p>
                <p>Dein Kollege bekommt <b>Schreibzugriff</b> auf diesen Anwärter und alle seine Auswertungen. Er sieht und bearbeitet nur diesen Anwärter – nicht deine anderen Daten.</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <Clock size={14} className="text-amber-500 flex-shrink-0" />
                <span>Der Einladungslink ist <b>7 Tage</b> gültig. Danach muss ein neuer erstellt werden.</span>
              </div>

              {!link ? (
                <button onClick={handleLinkErstellen} disabled={laedt}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-2">
                  {laedt ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Share2 size={18} />
                  )}
                  {laedt ? 'Link wird erstellt...' : 'Einladungslink erstellen'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Einladungslink:</p>
                    <p className="text-xs text-slate-700 break-all font-mono">{link}</p>
                  </div>
                  <button onClick={handleKopieren}
                    className={`w-full py-3 rounded-xl font-bold transition active:scale-95 flex items-center justify-center gap-2 ${
                      kopiert ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}>
                    {kopiert ? <Check size={18} /> : <Copy size={18} />}
                    {kopiert ? 'Link kopiert!' : 'Link kopieren'}
                  </button>
                  <p className="text-xs text-slate-400 text-center">
                    Link per WhatsApp, E-Mail oder SMS teilen
                  </p>
                  <button onClick={() => setLink('')}
                    className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
                    Neuen Link erstellen
                  </button>
                </div>
              )}

              {fehler && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{fehler}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AnwaerterTeilen;
