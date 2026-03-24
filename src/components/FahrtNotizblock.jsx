import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MapPin, Eraser, Pen, ChevronLeft, ChevronRight, Download, Square, Map } from 'lucide-react';

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

function Zeichenflaeche({ seiteId, gespeicherteData, onSpeichern, aktiverPin }) {
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
          className="p-2 rounded-lg bg-white border border-slate-200 text-red-400 hover:bg-red-50 transition">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Canvas */}
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

// =================== KARTE ===================
function Karte({ pins, onPinLoeschen, onSeiteOeffnen }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [kartentyp, setKartentyp] = useState('satellit');
  const [mapBereit, setMapBereit] = useState(false);
  const layerRef = useRef(null);

  const LAYER = {
    strasse: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap',
    },
    satellit: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri World Imagery',
    },
  };

  const initMap = () => {
    if (mapInstanceRef.current || !mapRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current).setView([51.1657, 10.4515], 6);
    const l = LAYER['satellit'];
    layerRef.current = L.tileLayer(l.url, { attribution: l.attribution }).addTo(map);
    mapInstanceRef.current = map;
    setMapBereit(true);
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (window.L) {
      setTimeout(initMap, 150);
    } else {
      const existing = document.querySelector('script[src*="leaflet"]');
      if (existing) { existing.addEventListener('load', () => setTimeout(initMap, 150)); }
      else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setTimeout(initMap, 150);
        document.head.appendChild(script);
      }
    }
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; setMapBereit(false); }
    };
  }, []);

  // Layer wechseln
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    if (layerRef.current) layerRef.current.remove();
    const l = LAYER[kartentyp];
    layerRef.current = L.tileLayer(l.url, { attribution: l.attribution }).addTo(map);
  }, [kartentyp]);

  // Pins aktualisieren
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const icon = L.divIcon({
        html: `<div style="background:#ef4444;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${pin.nummer}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      });

      const gmapsUrl = `https://www.google.com/maps?q=${pin.lat},${pin.lng}&layer=c&cbll=${pin.lat},${pin.lng}`;
      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:200px">
            <b style="color:#ef4444">Pin #${pin.nummer}</b> &nbsp;·&nbsp; ${pin.zeit}<br>
            <span style="font-size:13px">${pin.notizVorschau || 'Keine Textnotiz'}</span><br>
            <a href="${gmapsUrl}" target="_blank" style="color:#6366f1;font-size:12px;margin-top:4px;display:inline-block">
              📍 In Google Maps / Street View öffnen →
            </a>
          </div>
        `);
      markersRef.current.push(marker);
    });

    if (pins.length > 0) {
      try {
        const gruppe = L.featureGroup(markersRef.current);
        map.fitBounds(gruppe.getBounds().pad(0.3));
        setTimeout(() => map.invalidateSize(), 200);
      } catch (e) {}
    }
  }, [pins, mapBereit]);

  return (
    <div className="space-y-3">
      {/* Layer-Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setKartentyp('satellit')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition ${kartentyp === 'satellit' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
          🛰️ Satellit
        </button>
        <button onClick={() => setKartentyp('strasse')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition ${kartentyp === 'strasse' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
          🗺️ Straßenkarte
        </button>
      </div>

      {/* Karte */}
      <div ref={mapRef} className="w-full rounded-xl border border-slate-200 overflow-hidden"
        style={{ height: '400px' }} />

      {/* Pins Liste */}
      {pins.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{pins.length} Position(en)</p>
          {pins.map((pin) => (
            <div key={pin.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group">
              <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {pin.nummer}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{pin.notizVorschau || 'Keine Textnotiz'}</p>
                <p className="text-xs text-slate-400">{pin.zeit} · {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</p>
              </div>
              <div className="flex gap-1">
                {onSeiteOeffnen && (
                  <button onClick={() => onSeiteOeffnen(pin.seiteIndex)}
                    title="Notizseite öffnen"
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                    <Pen size={14} />
                  </button>
                )}
                <button onClick={() => onPinLoeschen(pin.id)}
                  title="Pin löschen"
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-400 text-sm py-4">Noch keine Pins gesetzt – drücke den 📍 Button</p>
      )}
    </div>
  );
}

// =================== HAUPTKOMPONENTE ===================
function FahrtNotizblock({ lehrprobeId }) {
  const [ansicht, setAnsicht] = useState('notiz');
  const [aktiverPin, setAktiverPin] = useState(null); // { id, nummer, zeit, seiteIndex }
  const [gpsLaedt, setGpsLaedt] = useState(false);
  const [bestaetigung, setBestaetigung] = useState('');

  const [seiten, setSeiten] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`notizblock-seiten-${lehrprobeId}`)) || [{ id: Date.now(), data: null, pinId: null }]; }
    catch { return [{ id: Date.now(), data: null, pinId: null }]; }
  });
  const [aktuelleSeite, setAktuelleSeite] = useState(0);

  const [pins, setPins] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`notizblock-pins-${lehrprobeId}`)) || []; }
    catch { return []; }
  });

  const speichernSeiten = (s) => { setSeiten(s); localStorage.setItem(`notizblock-seiten-${lehrprobeId}`, JSON.stringify(s)); };
  const speichernPins = (p) => { setPins(p); localStorage.setItem(`notizblock-pins-${lehrprobeId}`, JSON.stringify(p)); };

  const handlePinStarten = () => {
    if (aktiverPin) { handlePinStoppen(); return; }
    setGpsLaedt(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const neuerPin = {
          id: Date.now(),
          nummer: pins.length + 1,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          genauigkeit: Math.round(pos.coords.accuracy),
          zeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          seiteIndex: seiten.length, // neue Seite wird angelegt
          notizVorschau: '',
        };

        // Neue Seite für diesen Pin anlegen
        const neueSeite = { id: Date.now() + 1, data: null, pinId: neuerPin.id };
        const neueSeiten = [...seiten, neueSeite];
        speichernSeiten(neueSeiten);
        speichernPins([...pins, neuerPin]);
        setAktiverPin({ ...neuerPin, seiteIndex: neueSeiten.length - 1 });
        setAktuelleSeite(neueSeiten.length - 1);
        setGpsLaedt(false);
        setBestaetigung(`📍 Pin #${neuerPin.nummer} gesetzt`);
        setTimeout(() => setBestaetigung(''), 2000);
        setAnsicht('notiz');
      },
      (err) => { setGpsLaedt(false); alert('GPS nicht verfügbar: ' + err.message); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handlePinStoppen = () => {
    setAktiverPin(null);
    setBestaetigung('✓ Notiz zugeordnet');
    setTimeout(() => setBestaetigung(''), 2000);
  };

  const seiteSpeichern = (data) => {
    const neueSeiten = seiten.map((s, i) => i === aktuelleSeite ? { ...s, data } : s);
    speichernSeiten(neueSeiten);
  };

  const seiteHinzufuegen = () => {
    const neueSeiten = [...seiten, { id: Date.now(), data: null, pinId: null }];
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

  const exportSeite = () => {
    const seite = seiten[aktuelleSeite];
    if (!seite?.data) return;
    const a = document.createElement('a');
    a.href = seite.data;
    a.download = `notiz-seite-${aktuelleSeite + 1}.png`;
    a.click();
  };

  const pinLoeschen = (id) => {
    speichernPins(pins.filter(p => p.id !== id));
    if (aktiverPin?.id === id) setAktiverPin(null);
  };

  // Pin-Seite zugehörig?
  const aktuellerPinFuerSeite = pins.find(p => p.seiteIndex === aktuelleSeite);

  const NotizInhalt = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setAktuelleSeite(Math.max(0, aktuelleSeite - 1))}
            disabled={aktuelleSeite === 0}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-700">
              Seite {aktuelleSeite + 1} / {seiten.length}
            </span>
            {aktuellerPinFuerSeite && (
              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                Pin #{aktuellerPinFuerSeite.nummer}
              </span>
            )}
          </div>
          <button onClick={() => setAktuelleSeite(Math.min(seiten.length - 1, aktuelleSeite + 1))}
            disabled={aktuelleSeite === seiten.length - 1}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex gap-1.5">
          <button onClick={exportSeite}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
            <Download size={15} />
          </button>
          <button onClick={seiteLoeschen}
            className="p-1.5 rounded-lg border border-slate-200 text-red-400 hover:bg-red-50 transition">
            <Trash2 size={15} />
          </button>
          <button onClick={seiteHinzufuegen}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition">
            <Plus size={14} /> Seite
          </button>
        </div>
      </div>
      <Zeichenflaeche
        key={seiten[aktuelleSeite]?.id}
        seiteId={seiten[aktuelleSeite]?.id}
        gespeicherteData={seiten[aktuelleSeite]?.data}
        onSpeichern={seiteSpeichern}
        aktiverPin={aktiverPin}
      />
    </>
  );

  return (
    <>
      {/* Eingebetteter Notizblock (normaler Modus) */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Notizblock & Kartenpins</h3>
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
          {ansicht === 'notiz' ? <NotizInhalt /> : (
            <Karte
              pins={pins}
              onPinLoeschen={pinLoeschen}
              onSeiteOeffnen={(seiteIndex) => { setAktuelleSeite(seiteIndex); setAnsicht('notiz'); }}
            />
          )}
        </div>
      </div>

      {/* Overlay – öffnet sich automatisch wenn Pin gesetzt wird */}
      {aktiverPin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col"
            style={{ height: '90vh', maxHeight: '90vh' }}>
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0 sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white text-red-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {aktiverPin.nummer}
                </div>
                <div>
                  <h3 className="font-bold">Pin #{aktiverPin.nummer} – Notiz schreiben</h3>
                  <p className="text-red-200 text-xs">{aktiverPin.zeit} · Mit S Pen schreiben</p>
                </div>
              </div>
              <button onClick={handlePinStoppen}
                className="flex items-center gap-2 bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-50 transition active:scale-95">
                <Square size={14} fill="currentColor" /> Fertig
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <NotizInhalt />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {bestaetigung && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg z-50">
          {bestaetigung}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handlePinStarten}
        disabled={gpsLaedt}
        className={`fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 ${
          aktiverPin ? 'bg-red-500 hover:bg-red-600 shadow-red-300' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-300'
        }`}
        title={aktiverPin ? 'Notiz beenden' : 'Position merken & Notiz schreiben'}
      >
        {gpsLaedt ? (
          <span className="text-white text-2xl animate-spin">⟳</span>
        ) : aktiverPin ? (
          <Square size={28} className="text-white" fill="white" />
        ) : (
          <MapPin size={28} className="text-white" />
        )}
      </button>
    </>
  );
}

export default FahrtNotizblock;
