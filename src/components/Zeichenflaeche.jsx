import { useState, useRef, useEffect } from 'react';
import { Pen, Eraser, Trash2, Square } from 'lucide-react';

const RASTER = 30;

function zeichneKariert(ctx, width, height) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= width; x += RASTER) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += RASTER) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}

function Zeichenflaeche({ seiteId, gespeicherteData, onSpeichern, aktiverPin }) {
  const canvasRef = useRef(null);
  const [werkzeug, setWerkzeug] = useState('stift'); // 'stift' | 'radierer' | 'auswahl'
  const [farbe, setFarbe] = useState('#1e293b');
  const [staerke, setStaerke] = useState(3);
  const [radiererGroesse, setRadiererGroesse] = useState(20);

  // Zeichnen-State
  const zeichnenRef = useRef(false);
  const letzterPunkt = useRef(null);

  // Auswahlrahmen-State
  const auswahlStart = useRef(null);
  const auswahlRef = useRef(null); // {x,y,w,h}
  const [auswahlRect, setAuswahlRect] = useState(null);

  // Snapshot für Auswahlrahmen-Rendering
  const snapshotRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    zeichneKariert(ctx, canvas.width, canvas.height);
    if (gespeicherteData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = gespeicherteData;
    }
    setAuswahlRect(null);
    auswahlRef.current = null;
  }, [seiteId]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure ?? 1,
    };
  };

  const sollIgnorieren = (e) => {
    // Ignoriere Handberührungen: kein Stift und sehr niedrige/keine Druckwerte
    if (e.pointerType === 'pen') return false;
    if (e.pointerType === 'touch') return true; // Finger/Hand immer ignorieren
    return false;
  };

  // =================== STIFT ===================
  const stiftStart = (e) => {
    if (sollIgnorieren(e)) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    zeichnenRef.current = true;
    letzterPunkt.current = getPos(e);
  };

  const stiftMove = (e) => {
    if (!zeichnenRef.current || sollIgnorieren(e)) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(letzterPunkt.current.x, letzterPunkt.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = farbe;
    // Druckempfindlichkeit: Stärke variiert mit Druck
    const dynamischeStaerke = staerke * (0.5 + (pos.pressure || 1) * 0.5);
    ctx.lineWidth = dynamischeStaerke;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    letzterPunkt.current = pos;
  };

  const stiftStop = (e) => {
    if (!zeichnenRef.current) return;
    zeichnenRef.current = false;
    letzterPunkt.current = null;
    onSpeichern(canvasRef.current.toDataURL());
  };

  // =================== RADIERER ===================
  const radiererMove = (e) => {
    if (!zeichnenRef.current || sollIgnorieren(e)) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    const r = radiererGroesse;

    // Bereich löschen
    ctx.clearRect(pos.x - r/2, pos.y - r/2, r, r);

    // Karierung in diesem Bereich neu zeichnen
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 0.5;
    const x1 = Math.floor((pos.x - r) / RASTER) * RASTER;
    const x2 = Math.ceil((pos.x + r) / RASTER) * RASTER;
    const y1 = Math.floor((pos.y - r) / RASTER) * RASTER;
    const y2 = Math.ceil((pos.y + r) / RASTER) * RASTER;
    for (let x = x1; x <= x2; x += RASTER) {
      ctx.beginPath(); ctx.moveTo(x, Math.max(0, y1)); ctx.lineTo(x, Math.min(canvas.height, y2)); ctx.stroke();
    }
    for (let y = y1; y <= y2; y += RASTER) {
      ctx.beginPath(); ctx.moveTo(Math.max(0, x1), y); ctx.lineTo(Math.min(canvas.width, x2), y); ctx.stroke();
    }
    letzterPunkt.current = pos;
  };

  // =================== AUSWAHLRAHMEN ===================
  const auswahlStart = (e) => {
    if (sollIgnorieren(e)) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const pos = getPos(e);
    auswahlStart.current = pos;
    setAuswahlRect(null);
    auswahlRef.current = null;
    // Snapshot speichern
    snapshotRef.current = canvasRef.current.toDataURL();
    zeichnenRef.current = true;
  };

  const auswahlMove = (e) => {
    if (!zeichnenRef.current || !auswahlStart.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const x = Math.min(auswahlStart.current.x, pos.x);
    const y = Math.min(auswahlStart.current.y, pos.y);
    const w = Math.abs(pos.x - auswahlStart.current.x);
    const h = Math.abs(pos.y - auswahlStart.current.y);

    // Snapshot wiederherstellen und Rahmen zeichnen
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.fillRect(x, y, w, h);
    };
    img.src = snapshotRef.current;

    auswahlRef.current = { x, y, w, h };
    setAuswahlRect({ x, y, w, h });
  };

  const auswahlStop = (e) => {
    zeichnenRef.current = false;
  };

  const auswahlLoeschen = () => {
    const rect = auswahlRef.current;
    if (!rect) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Snapshot wiederherstellen
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      // Ausgewählten Bereich löschen
      ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
      // Karierung neu zeichnen
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 0.5;
      const x1 = Math.floor(rect.x / RASTER) * RASTER;
      const x2 = Math.ceil((rect.x + rect.w) / RASTER) * RASTER;
      const y1 = Math.floor(rect.y / RASTER) * RASTER;
      const y2 = Math.ceil((rect.y + rect.h) / RASTER) * RASTER;
      for (let x = x1; x <= x2; x += RASTER) {
        ctx.beginPath(); ctx.moveTo(x, Math.max(0, y1)); ctx.lineTo(x, Math.min(canvas.height, y2)); ctx.stroke();
      }
      for (let y = y1; y <= y2; y += RASTER) {
        ctx.beginPath(); ctx.moveTo(Math.max(0, x1), y); ctx.lineTo(Math.min(canvas.width, x2), y); ctx.stroke();
      }
      setAuswahlRect(null);
      auswahlRef.current = null;
      snapshotRef.current = null;
      onSpeichern(canvas.toDataURL());
    };
    img.src = snapshotRef.current;
  };

  // =================== EVENT DISPATCH ===================
  const handlePointerDown = (e) => {
    if (werkzeug === 'stift') stiftStart(e);
    else if (werkzeug === 'radierer') {
      if (sollIgnorieren(e)) return;
      e.preventDefault();
      canvasRef.current.setPointerCapture(e.pointerId);
      zeichnenRef.current = true;
      letzterPunkt.current = getPos(e);
    }
    else if (werkzeug === 'auswahl') auswahlStart(e);
  };

  const handlePointerMove = (e) => {
    if (werkzeug === 'stift') stiftMove(e);
    else if (werkzeug === 'radierer') radiererMove(e);
    else if (werkzeug === 'auswahl') auswahlMove(e);
  };

  const handlePointerUp = (e) => {
    if (werkzeug === 'stift') stiftStop(e);
    else if (werkzeug === 'radierer') {
      zeichnenRef.current = false;
      onSpeichern(canvasRef.current.toDataURL());
    }
    else if (werkzeug === 'auswahl') auswahlStop(e);
  };

  const allesLeeren = () => {
    if (!window.confirm('Seite leeren?')) return;
    const canvas = canvasRef.current;
    zeichneKariert(canvas.getContext('2d'), canvas.width, canvas.height);
    setAuswahlRect(null);
    auswahlRef.current = null;
    onSpeichern(canvas.toDataURL());
  };

  const FARBEN = ['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-2">
      {/* Pin-Indikator */}
      {aktiverPin && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {aktiverPin.nummer}
          </div>
          <span className="text-sm text-red-700 font-medium">
            Notiz wird Pin #{aktiverPin.nummer} zugeordnet ({aktiverPin.zeit})
          </span>
        </div>
      )}

      {/* Werkzeugleiste */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
        {/* Werkzeuge */}
        <div className="flex gap-1">
          <button onClick={() => setWerkzeug('stift')}
            title="Stift"
            className={`p-2 rounded-lg transition ${werkzeug === 'stift' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <Pen size={16} />
          </button>
          <button onClick={() => setWerkzeug('radierer')}
            title="Radierer"
            className={`p-2 rounded-lg transition ${werkzeug === 'radierer' ? 'bg-slate-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <Eraser size={16} />
          </button>
          <button onClick={() => setWerkzeug('auswahl')}
            title="Bereich auswählen und löschen"
            className={`p-2 rounded-lg transition ${werkzeug === 'auswahl' ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <Square size={16} />
          </button>
        </div>

        {/* Farben – nur beim Stift */}
        {werkzeug === 'stift' && (
          <div className="flex gap-1.5">
            {FARBEN.map(f => (
              <button key={f} onClick={() => setFarbe(f)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${farbe === f ? 'border-slate-700 scale-125' : 'border-transparent'}`}
                style={{ backgroundColor: f }} />
            ))}
          </div>
        )}

        {/* Stärke beim Stift */}
        {werkzeug === 'stift' && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-slate-400">Stärke:</span>
            <input type="range" min="1" max="20" value={staerke}
              onChange={e => setStaerke(Number(e.target.value))} className="w-16" />
            <span className="text-xs font-bold text-slate-600 w-4">{staerke}</span>
          </div>
        )}

        {/* Radierer-Größe */}
        {werkzeug === 'radierer' && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-slate-400">Größe:</span>
            <input type="range" min="10" max="100" value={radiererGroesse}
              onChange={e => setRadiererGroesse(Number(e.target.value))} className="w-16" />
            <span className="text-xs font-bold text-slate-600 w-6">{radiererGroesse}</span>
          </div>
        )}

        {/* Auswahlbereich löschen */}
        {werkzeug === 'auswahl' && auswahlRect && (
          <button onClick={auswahlLoeschen}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition">
            <Trash2 size={13} /> Auswahl löschen
          </button>
        )}

        {werkzeug === 'auswahl' && !auswahlRect && (
          <span className="ml-auto text-xs text-slate-400">Rahmen ziehen zum Löschen</span>
        )}

        <button onClick={allesLeeren}
          className={`p-2 rounded-lg bg-white border border-slate-200 text-red-400 hover:bg-red-50 transition ${werkzeug !== 'auswahl' ? '' : 'ml-2'}`}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white"
        style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          className="w-full block"
          style={{
            cursor: werkzeug === 'radierer' ? 'cell' : werkzeug === 'auswahl' ? 'crosshair' : 'default',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}

export { zeichneKariert };
export default Zeichenflaeche;
