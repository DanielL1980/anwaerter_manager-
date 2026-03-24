import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MapPin, Eraser, Pen, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// =================== KARIERTES CANVAS ===================
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
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  };

  const startZeichnen = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setZeichnen(true);
    letzterPunkt.current = pos;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (werkzeug === 'radierer' ? staerke * 4 : staerke) / 2, 0, Math.PI * 2);
    ctx.fillStyle = werkzeug === 'radierer' ? '#ffffff' : farbe;
    ctx.fill();
    // Karierung nach Radierer wiederherstellen
    if (werkzeug === 'radierer') karierungWiederherstellen(ctx, pos, staerke * 4);
  };

  const karierungWiederherstellen = (ctx, pos, groesse) => {
    const raster = 30;
    const x1 = Math.floor((pos.x - groesse) / raster) * raster;
    const x2 = Math.ceil((pos.x + groesse) / raster) * raster;
    const y1 = Math.floor((pos.y - groesse) / raster) * raster;
    const y2 = Math.ceil((pos.y + groesse) / raster) * raster;
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 0.5;
    for (let x = x1; x <= x2; x += raster) {
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    }
    for (let y = y1; y <= y2; y += raster) {
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    }
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
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
    const canvas = canvasRef.current;
    zeichneKariert(canvas);
    onSpeichern(canvas.toDataURL());
  };

  const FARBEN = ['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-2">
      {/* Werkzeugleiste */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex gap-1">
          <button onClick={() => setWerkzeug('stift')}
            className={`p-2 rounded-lg transition ${werkzeug === 'stift' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <Pen size={16} />
          </button>
          <button onClick={() => setWerkzeug('radierer')}
            className={`p-2 rounded-lg transition ${werkzeug === 'radierer' ? 'bg-slate-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
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
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500">Stärke:</span>
          <input type="range" min="1" max="20" value={staerke}
            onChange={e => setStaerke(Number(e.target.value))} className="w-16" />
          <span className="text-xs font-bold text-slate-600 w-4">{staerke}</span>
        </div>
        <button onClick={leeren}
          className="p-2 rounded-lg bg-white border border-slate-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Kariertes Canvas */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          className="w-full"
          style={{ cursor: werkzeug === 'radierer' ? 'cell' : 'crosshair', touchAction: 'none', display: 'block' }}
          onMouseDown={startZeichnen}
          onMouseMove={weiterZeichnen}
          onMouseUp={stopZeichnen}
          onMouseLeave={stopZeichnen}
          onTouchStart={startZeichnen}
          onTouchMove={weiterZeichnen}
          onTouchEnd={stopZeichnen}
        />
      </div>
    </div>
  );
}

// =================== KARTE MIT GPS-PINS ===================
function KarteMitPins({ pins, onPinHinzufuegen, onPinLoeschen }) {
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');
  const [notizText, setNotizText] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (mapInstanceRef.current || !mapRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([51.1657, 10.4515], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(map);
      mapInstanceRef.current = map;
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    pins.forEach((pin) => {
      const marker = L.marker([pin.lat, pin.lng])
        .addTo(map)
        .bindPopup(`<b>${pin.zeit}</b><br>${pin.notiz || '–'}<br><small>±${pin.genauigkeit}m</small>`);
      markersRef.current.push(marker);
    });
    if (pins.length > 0) {
      try {
        const gruppe = L.featureGroup(markersRef.current);
        map.fitBounds(gruppe.getBounds().pad(0.3));
      } catch (e) {}
    }
  }, [pins]);

  const handleGPS = () => {
    if (!navigator.geolocation) { setFehler('GPS nicht unterstützt.'); return; }
    setLaedt(true); setFehler('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapInstanceRef.current;
        if (map) map.setView([pos.coords.latitude, pos.coords.longitude], 16);
        onPinHinzufuegen({
          id: Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          notiz: notizText,
          zeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          genauigkeit: Math.round(pos.coords.accuracy),
        });
        setNotizText('');
        setLaedt(false);
      },
      (err) => { setFehler('GPS: ' + err.message); setLaedt(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input type="text" value={notizText} onChange={e => setNotizText(e.target.value)}
          placeholder="Notiz zur aktuellen Position..."
          className="input-field text-sm"
          onKeyDown={e => e.key === 'Enter' && handleGPS()} />
        <button onClick={handleGPS} disabled={laedt}
          className="btn flex-shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200 shadow-md">
          {laedt
            ? <span className="animate-spin text-lg leading-none">⟳</span>
            : <MapPin size={18} />}
          <span className="hidden sm:inline">{laedt ? 'Suche GPS...' : 'Position merken'}</span>
        </button>
      </div>

      {fehler && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{fehler}</p>}

      {/* Karte */}
      <div ref={mapRef} className="w-full rounded-xl border border-slate-200 overflow-hidden"
        style={{ height: '350px' }} />

      {/* Pins Liste */}
      {pins.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">{pins.length} Position(en) gespeichert:</p>
          {pins.map((pin, i) => (
            <div key={pin.id} className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl group">
              <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{pin.notiz || 'Kein Text'}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {pin.zeit} · {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)} · ±{pin.genauigkeit}m
                </p>
              </div>
              <button onClick={() => onPinLoeschen(pin.id)}
                className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =================== HAUPTKOMPONENTE ===================
function FahrtNotizblock({ lehrprobeId }) {
  const [aktuelleSeite, setAktuelleSeite] = useState(0);
  const [ansicht, setAnsicht] = useState('notiz'); // 'notiz' | 'karte'
  const [seiten, setSeiten] = useState(() => {
    const gespeichert = localStorage.getItem(`notizblock-seiten-${lehrprobeId}`);
    return gespeichert ? JSON.parse(gespeichert) : [{ id: Date.now(), data: null }];
  });
  const [pins, setPins] = useState(() => {
    const gespeichert = localStorage.getItem(`notizblock-pins-${lehrprobeId}`);
    return gespeichert ? JSON.parse(gespeichert) : [];
  });

  const speichernSeiten = (neueSeiten) => {
    setSeiten(neueSeiten);
    localStorage.setItem(`notizblock-seiten-${lehrprobeId}`, JSON.stringify(neueSeiten));
  };

  const speichernPins = (neuePins) => {
    setPins(neuePins);
    localStorage.setItem(`notizblock-pins-${lehrprobeId}`, JSON.stringify(neuePins));
  };

  const seiteHinzufuegen = () => {
    const neueSeiten = [...seiten, { id: Date.now(), data: null }];
    speichernSeiten(neueSeiten);
    setAktuelleSeite(neueSeiten.length - 1);
  };

  const seiteLoeschen = () => {
    if (seiten.length <= 1) { alert('Mindestens eine Seite muss vorhanden sein.'); return; }
    if (!window.confirm('Diese Seite löschen?')) return;
    const neueSeiten = seiten.filter((_, i) => i !== aktuelleSeite);
    speichernSeiten(neueSeiten);
    setAktuelleSeite(Math.min(aktuelleSeite, neueSeiten.length - 1));
  };

  const seiteSpeichern = (data) => {
    const neueSeiten = seiten.map((s, i) => i === aktuelleSeite ? { ...s, data } : s);
    speichernSeiten(neueSeiten);
  };

  const exportSeite = () => {
    const seite = seiten[aktuelleSeite];
    if (!seite.data) return;
    const a = document.createElement('a');
    a.href = seite.data;
    a.download = `notiz-seite-${aktuelleSeite + 1}.png`;
    a.click();
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Notizblock & Karte</h3>
          <div className="flex gap-1 bg-white/20 rounded-xl p-1">
            <button onClick={() => setAnsicht('notiz')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${ansicht === 'notiz' ? 'bg-white text-violet-700' : 'text-white hover:bg-white/20'}`}>
              ✏️ Notizen
            </button>
            <button onClick={() => setAnsicht('karte')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${ansicht === 'karte' ? 'bg-white text-violet-700' : 'text-white hover:bg-white/20'}`}>
              🗺️ Karte {pins.length > 0 && `(${pins.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {ansicht === 'notiz' ? (
          <>
            {/* Seiten-Navigation */}
            <div className="flex items-center justify-between mb-3">
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
              <div className="flex gap-2">
                <button onClick={exportSeite} title="Als PNG speichern"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
                  <Download size={16} />
                </button>
                <button onClick={seiteLoeschen} title="Seite löschen"
                  className="p-1.5 rounded-lg border border-slate-200 text-red-400 hover:bg-red-50 transition">
                  <Trash2 size={16} />
                </button>
                <button onClick={seiteHinzufuegen}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition">
                  <Plus size={15} /> Neue Seite
                </button>
              </div>
            </div>

            <Zeichenflaeche
              key={seiten[aktuelleSeite].id}
              seiteId={seiten[aktuelleSeite].id}
              gespeicherteData={seiten[aktuelleSeite].data}
              onSpeichern={seiteSpeichern}
            />
          </>
        ) : (
          <KarteMitPins
            pins={pins}
            onPinHinzufuegen={(pin) => speichernPins([...pins, pin])}
            onPinLoeschen={(id) => speichernPins(pins.filter(p => p.id !== id))}
          />
        )}
      </div>
    </div>
  );
}

export default FahrtNotizblock;
