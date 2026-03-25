import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Pen, Eraser, ChevronLeft, ChevronRight, Download, BookOpen } from 'lucide-react';

function zeichneKariert(canvas) {
  const ctx = canvas.getContext('2d');
  const raster = 30;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= canvas.width; x += raster) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += raster) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function Zeichenflaeche({ seiteId, gespeicherteData, onSpeichern }) {
  const canvasRef = useRef(null);
  const [zeichnen, setZeichnen] = useState(false);
  const [werkzeug, setWerkzeug] = useState('stift');
  const [farbe, setFarbe] = useState('#1e293b');
  const [staerke, setStaerke] = useState(3);
  const letzterPunkt = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    zeichneKariert(canvas);
    if (gespeicherteData) {
      const img = new Image();
      img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0);
      img.src = gespeicherteData;
    }
  }, [seiteId]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const karierungWiederherstellen = (ctx, pos, groesse) => {
    const raster = 30;
    const x1 = Math.floor((pos.x - groesse) / raster) * raster;
    const x2 = Math.ceil((pos.x + groesse) / raster) * raster;
    const y1 = Math.floor((pos.y - groesse) / raster) * raster;
    const y2 = Math.ceil((pos.y + groesse) / raster) * raster;
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 0.5;
    for (let x = x1; x <= x2; x += raster) { ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke(); }
    for (let y = y1; y <= y2; y += raster) { ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }
  };

  const startZeichnen = (e) => {
    e.preventDefault();
    if (e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId);
    const pos = getPos(e, canvas);
    setZeichnen(true);
    letzterPunkt.current = pos;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (werkzeug === 'radierer' ? staerke * 4 : staerke) / 2, 0, Math.PI * 2);
    ctx.fillStyle = werkzeug === 'radierer' ? '#ffffff' : farbe;
    ctx.fill();
    if (werkzeug === 'radierer') karierungWiederherstellen(ctx, pos, staerke * 4);
  };

  const weiterZeichnen = (e) => {
    if (!zeichnen) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(letzterPunkt.current.x, letzterPunkt.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = werkzeug === 'radierer' ? '#ffffff' : farbe;
    ctx.lineWidth = werkzeug === 'radierer' ? staerke * 4 : staerke;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    if (werkzeug === 'radierer') karierungWiederherstellen(ctx, pos, staerke * 4);
    letzterPunkt.current = pos;
  };

  const stopZeichnen = () => {
    if (!zeichnen) return;
    setZeichnen(false);
    letzterPunkt.current = null;
    onSpeichern(canvasRef.current.toDataURL());
  };

  const leeren = () => {
    if (!window.confirm('Seite leeren?')) return;
    zeichneKariert(canvasRef.current);
    onSpeichern(canvasRef.current.toDataURL());
  };

  const FARBEN = ['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0">
        <div className="flex gap-1">
          <button onClick={() => setWerkzeug('stift')}
            className={`p-2 rounded-lg transition ${werkzeug === 'stift' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            <Pen size={16} />
          </button>
          <button onClick={() => setWerkzeug('radierer')}
            className={`p-2 rounded-lg transition ${werkzeug === 'radierer' ? 'bg-slate-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            <Eraser size={16} />
          </button>
        </div>
        <div className="flex gap-1.5">
          {FARBEN.map(f => (
            <button key={f} onClick={() => { setFarbe(f); setWerkzeug('stift'); }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${farbe === f && werkzeug === 'stift' ? 'border-slate-700 scale-125' : 'border-transparent'}`}
              style={{ backgroundColor: f }} />
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <input type="range" min="1" max="20" value={staerke}
            onChange={e => setStaerke(Number(e.target.value))} className="w-16" />
          <span className="text-xs font-bold text-slate-600 w-4">{staerke}</span>
        </div>
        <button onClick={leeren} className="p-2 rounded-lg bg-white border border-slate-200 text-red-400 hover:bg-red-50 transition">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden" style={{ touchAction: 'none', minHeight: '400px' }}>
        <canvas
          ref={canvasRef} width={1200} height={900}
          className="w-full h-full"
          style={{ cursor: werkzeug === 'radierer' ? 'cell' : 'crosshair', touchAction: 'none', display: 'block' }}
          onPointerDown={startZeichnen}
          onPointerMove={weiterZeichnen}
          onPointerUp={stopZeichnen}
          onPointerCancel={stopZeichnen}
        />
      </div>
    </div>
  );
}

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
