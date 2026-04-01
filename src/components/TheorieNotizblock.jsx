import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, ChevronLeft, ChevronRight, Download, BookOpen } from 'lucide-react';

import Zeichenflaeche from './Zeichenflaeche';

function TheorieNotizblock({ lehrprobeId }) {
  const [offen, setOffen] = useState(false);
  const [aktuelleSeite, setAktuelleSeite] = useState(0);
  const [seiten, setSeiten] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`theorie-notiz-${lehrprobeId}`)) || [{ id: Date.now(), data: null }]; }
    catch { return [{ id: Date.now(), data: null }]; }
  });

  const speichern = (s) => { setSeiten(s); localStorage.setItem(`theorie-notiz-${lehrprobeId}`, JSON.stringify(s)); };

  const seiteHinzufuegen = () => {
    const neu = [...seiten, { id: Date.now(), data: null }];
    speichern(neu);
    setAktuelleSeite(neu.length - 1);
  };

  const seiteLoeschen = () => {
    if (seiten.length <= 1) { alert('Mindestens eine Seite muss vorhanden sein.'); return; }
    if (!window.confirm('Diese Seite löschen?')) return;
    const neu = seiten.filter((_, i) => i !== aktuelleSeite);
    speichern(neu);
    setAktuelleSeite(Math.min(aktuelleSeite, neu.length - 1));
  };

  const exportSeite = () => {
    const s = seiten[aktuelleSeite];
    if (!s?.data) return;
    const a = document.createElement('a');
    a.href = s.data; a.download = `theorie-notiz-${aktuelleSeite + 1}.png`; a.click();
  };

  const hatNotizen = seiten.some(s => s.data !== null);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOffen(true)}
        className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl transition-all active:scale-95 ${
          hatNotizen
            ? 'bg-indigo-600 text-white shadow-indigo-300'
            : 'bg-white text-indigo-600 border-2 border-indigo-200 shadow-slate-200'
        }`}
        title="Notizblock öffnen"
      >
        <BookOpen size={20} />
        <span className="text-sm font-bold">Notizblock</span>
        {hatNotizen && <span className="bg-white/30 text-xs px-1.5 py-0.5 rounded-full">{seiten.length}</span>}
      </button>

      {/* Overlay */}
      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOffen(false)} />

          {/* Panel */}
          <div className="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col"
            style={{ height: '90vh', maxHeight: '90vh' }}>

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white flex items-center justify-between flex-shrink-0 sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <BookOpen size={20} />
                <h3 className="font-bold">Notizblock – Theoretischer Unterricht</h3>
              </div>
              <button onClick={() => setOffen(false)} className="text-white/70 hover:text-white transition">
                <X size={22} />
              </button>
            </div>

            {/* Seiten-Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setAktuelleSeite(Math.max(0, aktuelleSeite - 1))}
                  disabled={aktuelleSeite === 0}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-slate-700 px-2">
                  Seite {aktuelleSeite + 1} / {seiten.length}
                </span>
                <button onClick={() => setAktuelleSeite(Math.min(seiten.length - 1, aktuelleSeite + 1))}
                  disabled={aktuelleSeite === seiten.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex gap-1.5">
                <button onClick={exportSeite} title="Als PNG speichern"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
                  <Download size={15} />
                </button>
                <button onClick={seiteLoeschen}
                  className="p-1.5 rounded-lg border border-slate-200 text-red-400 hover:bg-red-50 transition">
                  <Trash2 size={15} />
                </button>
                <button onClick={seiteHinzufuegen}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition">
                  <Plus size={14} /> Seite
                </button>
              </div>
            </div>

            {/* Zeichenfläche */}
            <div className="flex-1 overflow-hidden p-3">
              <Zeichenflaeche
                key={seiten[aktuelleSeite]?.id}
                seiteId={seiten[aktuelleSeite]?.id}
                gespeicherteData={seiten[aktuelleSeite]?.data}
                onSpeichern={(data) => {
                  const neu = seiten.map((s, i) => i === aktuelleSeite ? { ...s, data } : s);
                  speichern(neu);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TheorieNotizblock;
