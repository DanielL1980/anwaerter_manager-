import { useState, useRef, useEffect } from 'react';
import { MapPin, Square, Trash2, Pen, ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import Zeichenflaeche from './Zeichenflaeche';

const RASTER = 30;
function zeichneKariert(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= canvas.width; x += RASTER) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y <= canvas.height; y += RASTER) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
}

function Karte({ pins, onPinLoeschen, onSeiteOeffnen }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [kartentyp, setKartentyp] = useState('satellit');
  const [mapBereit, setMapBereit] = useState(false);
  const layerRef = useRef(null);

  const LAYER = {
    strasse: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
    satellit: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
  };

  const initMap = () => {
    if (mapInstanceRef.current || !mapRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current).setView([51.1657, 10.4515], 6);
    layerRef.current = L.tileLayer(LAYER.satellit.url, { attribution: LAYER.satellit.attribution }).addTo(map);
    mapInstanceRef.current = map;
    setMapBereit(true);
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link'); link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (window.L) { setTimeout(initMap, 150); }
    else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 150);
      document.head.appendChild(script);
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; setMapBereit(false); } };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    if (layerRef.current) layerRef.current.remove();
    const l = LAYER[kartentyp];
    layerRef.current = window.L.tileLayer(l.url, { attribution: l.attribution }).addTo(map);
  }, [kartentyp]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    pins.forEach(pin => {
      const icon = L.divIcon({
        html: `<div style="background:#0d9488;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${pin.nummer}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14], className: '',
      });
      const gmapsUrl = `https://www.google.com/maps?q=${pin.lat},${pin.lng}&layer=c&cbll=${pin.lat},${pin.lng}`;
      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map)
        .bindPopup(`<div style="min-width:200px"><b style="color:#0d9488">Pin #${pin.nummer}</b> · ${pin.zeit}<br><a href="${gmapsUrl}" target="_blank" style="color:#6366f1;font-size:12px">📍 Google Maps / Street View →</a></div>`);
      markersRef.current.push(marker);
    });
    if (pins.length > 0) {
      try {
        const gruppe = L.featureGroup(markersRef.current);
        map.fitBounds(gruppe.getBounds().pad(0.3));
        setTimeout(() => map.invalidateSize(), 200);
      } catch {}
    }
  }, [pins, mapBereit]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => setKartentyp('satellit')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition ${kartentyp === 'satellit' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}>
          🛰️ Satellit
        </button>
        <button onClick={() => setKartentyp('strasse')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition ${kartentyp === 'strasse' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}>
          🗺️ Straße
        </button>
      </div>
      <div ref={mapRef} className="w-full rounded-xl border border-slate-200 overflow-hidden" style={{ height: '350px' }} />
      {pins.length > 0 ? (
        <div className="space-y-2">
          {pins.map(pin => (
            <div key={pin.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{pin.nummer}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{pin.zeit} · {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</p>
              </div>
              <div className="flex gap-1">
                {onSeiteOeffnen && (
                  <button onClick={() => onSeiteOeffnen(pin.seiteIndex)} className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition">
                    <Pen size={14} />
                  </button>
                )}
                <button onClick={() => onPinLoeschen(pin.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-400 text-sm py-4">Noch keine Pins – 📍 Button drücken</p>
      )}
    </div>
  );
}

function BewerberKartenpins({ pruefungId }) {
  const [ansicht, setAnsicht] = useState('notiz');
  const [aktiverPin, setAktiverPin] = useState(null);
  const [gpsLaedt, setGpsLaedt] = useState(false);
  const [bestaetigung, setBestaetigung] = useState('');

  const [seiten, setSeiten] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`bw-seiten-${pruefungId}`)) || [{ id: Date.now(), data: null, pinId: null }]; }
    catch { return [{ id: Date.now(), data: null, pinId: null }]; }
  });
  const [aktuelleSeite, setAktuelleSeite] = useState(0);
  const [pins, setPins] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`bw-pins-${pruefungId}`)) || []; }
    catch { return []; }
  });

  const speichernSeiten = (s) => { setSeiten(s); localStorage.setItem(`bw-seiten-${pruefungId}`, JSON.stringify(s)); };
  const speichernPins = (p) => { setPins(p); localStorage.setItem(`bw-pins-${pruefungId}`, JSON.stringify(p)); };

  const handlePinStarten = () => {
    if (aktiverPin) { setAktiverPin(null); setBestaetigung('✓ Notiz zugeordnet'); setTimeout(() => setBestaetigung(''), 2000); return; }
    setGpsLaedt(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const neuerPin = {
          id: Date.now(), nummer: pins.length + 1,
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          genauigkeit: Math.round(pos.coords.accuracy),
          zeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          seiteIndex: seiten.length,
        };
        const neueSeite = { id: Date.now() + 1, data: null, pinId: neuerPin.id };
        const neueSeiten = [...seiten, neueSeite];
        speichernSeiten(neueSeiten);
        speichernPins([...pins, neuerPin]);
        setAktiverPin({ ...neuerPin, seiteIndex: neueSeiten.length - 1 });
        setAktuelleSeite(neueSeiten.length - 1);
        setGpsLaedt(false);
        setBestaetigung(`📍 Pin #${neuerPin.nummer} gesetzt`);
        setTimeout(() => setBestaetigung(''), 2000);
      },
      (err) => { setGpsLaedt(false); alert('GPS nicht verfügbar: ' + err.message); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const pinLoeschen = (pinId) => {
    speichernPins(pins.filter(p => p.id !== pinId));
  };

  const seiteSpeichern = (data) => {
    speichernSeiten(seiten.map((s, i) => i === aktuelleSeite ? { ...s, data } : s));
  };

  const aktuellerPin = pins.find(p => p.seiteIndex === aktuelleSeite);

  const NotizInhalt = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setAktuelleSeite(Math.max(0, aktuelleSeite - 1))} disabled={aktuelleSeite === 0}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-700">Seite {aktuelleSeite + 1} / {seiten.length}</span>
            {aktuellerPin && <span className="ml-2 text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full font-medium">Pin #{aktuellerPin.nummer}</span>}
          </div>
          <button onClick={() => setAktuelleSeite(Math.min(seiten.length - 1, aktuelleSeite + 1))} disabled={aktuelleSeite === seiten.length - 1}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">
            <ChevronRight size={16} />
          </button>
        </div>
        <button onClick={() => { speichernSeiten([...seiten, { id: Date.now(), data: null, pinId: null }]); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition">
          <Plus size={14} /> Seite
        </button>
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
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Notizblock & Kartenpins</h3>
            <div className="flex gap-1 bg-white/20 rounded-xl p-1">
              <button onClick={() => setAnsicht('notiz')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${ansicht === 'notiz' ? 'bg-white text-teal-700' : 'text-white hover:bg-white/20'}`}>
                ✏️ Notizen
              </button>
              <button onClick={() => setAnsicht('karte')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${ansicht === 'karte' ? 'bg-white text-teal-700' : 'text-white hover:bg-white/20'}`}>
                🗺️ Karte {pins.length > 0 && `(${pins.length})`}
              </button>
            </div>
          </div>
        </div>
        <div className="p-4">
          {ansicht === 'notiz' ? <NotizInhalt /> : (
            <Karte pins={pins} onPinLoeschen={pinLoeschen} onSeiteOeffnen={(si) => { setAktuelleSeite(si); setAnsicht('notiz'); }} />
          )}
        </div>
      </div>

      {/* Overlay bei aktivem Pin */}
      {aktiverPin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ height: '90vh', maxHeight: '90vh' }}>
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0 sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white text-teal-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">{aktiverPin.nummer}</div>
                <div>
                  <h3 className="font-bold">Pin #{aktiverPin.nummer} – Notiz schreiben</h3>
                  <p className="text-teal-200 text-xs">{aktiverPin.zeit} · Mit S Pen erfassen</p>
                </div>
              </div>
              <button onClick={() => { setAktiverPin(null); setBestaetigung('✓ Notiz zugeordnet'); setTimeout(() => setBestaetigung(''), 2000); }}
                className="flex items-center gap-2 bg-white text-teal-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-teal-50 transition active:scale-95">
                <Square size={14} fill="currentColor" /> Fertig
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <NotizInhalt />
            </div>
          </div>
        </div>
      )}

      {bestaetigung && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg z-50">
          {bestaetigung}
        </div>
      )}

      {/* Floating Pin Button */}
      <button onClick={handlePinStarten} disabled={gpsLaedt}
        className={`fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 ${
          aktiverPin ? 'bg-red-500 hover:bg-red-600 shadow-red-300' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-300'
        }`}>
        {gpsLaedt ? <span className="text-white text-2xl animate-spin">⟳</span>
          : aktiverPin ? <Square size={28} className="text-white" fill="white" />
          : <MapPin size={28} className="text-white" />}
      </button>
    </>
  );
}

export default BewerberKartenpins;
