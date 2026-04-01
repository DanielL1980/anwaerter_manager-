import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Square, X, Clock } from 'lucide-react';
import { getLehrprobe, updateLehrprobe } from '../lib/db';

function zeitDifferenzMinuten(von, bis) {
  if (!von || !bis) return null;
  const [h1, m1] = von.split(':').map(Number);
  const [h2, m2] = bis.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function formatZeit(date) {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function DifferenzAnzeige({ geplantVon, geplantBis, tatsaechlichVon, tatsaechlichBis }) {
  if (!tatsaechlichVon || !tatsaechlichBis) return null;
  const geplant = zeitDifferenzMinuten(geplantVon, geplantBis);
  const tatsaechlich = zeitDifferenzMinuten(tatsaechlichVon, tatsaechlichBis);
  if (tatsaechlich === null) return null;
  const diff = geplant !== null ? tatsaechlich - geplant : null;

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {geplantVon && geplantBis && (
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Geplant</p>
            <p className="font-bold text-slate-700">{geplantVon} – {geplantBis}</p>
            <p className="text-xs text-slate-400">{geplant} Min.</p>
          </div>
        )}
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Tatsächlich</p>
          <p className="font-bold text-slate-700">{tatsaechlichVon} – {tatsaechlichBis}</p>
          <p className="text-xs text-slate-400">{tatsaechlich} Min.</p>
        </div>
      </div>
      {diff !== null && (
        <div className={`rounded-xl p-3 text-center font-bold text-sm ${
          Math.abs(diff) <= 2 ? 'bg-emerald-50 text-emerald-700' :
          Math.abs(diff) <= 5 ? 'bg-amber-50 text-amber-700' :
          'bg-red-50 text-red-700'
        }`}>
          {diff === 0 ? '✓ Genau im Zeitplan!' :
           diff > 0 ? `⏱ ${diff} Min. überzogen` :
           `⚡ ${Math.abs(diff)} Min. früher fertig`}
        </div>
      )}
    </div>
  );
}

function Stoppuhr({ lehrprobeId, probe }) {
  const [offen, setOffen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [startzeit, setStartzeit] = useState(null);
  const [endzeit, setEndzeit] = useState(null);
  const [vergangen, setVergangen] = useState(0); // Sekunden
  const [gespeichert, setGespeichert] = useState(false);
  const intervalRef = useRef(null);

  // Gespeicherte Stoppuhr-Daten laden
  const [tatsaechlichVon, setTatsaechlichVon] = useState(probe?.zeitTatsaechlichVon || '');
  const [tatsaechlichBis, setTatsaechlichBis] = useState(probe?.zeitTatsaechlichBis || '');

  useEffect(() => {
    if (laeuft) {
      intervalRef.current = setInterval(() => {
        setVergangen(s => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [laeuft]);

  const handleStart = () => {
    const jetzt = new Date();
    setStartzeit(jetzt);
    setEndzeit(null);
    setVergangen(0);
    setLaeuft(true);
    setGespeichert(false);
    const zeitStr = formatZeit(jetzt);
    setTatsaechlichVon(zeitStr);
    setTatsaechlichBis('');
  };

  const handleStop = async () => {
    const jetzt = new Date();
    setEndzeit(jetzt);
    setLaeuft(false);
    const zeitStr = formatZeit(jetzt);
    setTatsaechlichBis(zeitStr);

    // In Datenbank speichern
    try {
      const aktuelleProbe = await getLehrprobe(lehrprobeId);
      await updateLehrprobe({
        ...aktuelleProbe,
        zeitTatsaechlichVon: tatsaechlichVon,
        zeitTatsaechlichBis: zeitStr,
      });
      setGespeichert(true);
    } catch (e) {
      console.error(e);
    }
  };

  const formatVergangen = (sek) => {
    const m = Math.floor(sek / 60);
    const s = sek % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const hatGeplant = probe?.zeitVon && probe?.zeitBis;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOffen(true)}
        className={`fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl transition-all active:scale-95 ${
          laeuft
            ? 'bg-red-500 text-white shadow-red-300 animate-pulse'
            : tatsaechlichBis
            ? 'bg-emerald-600 text-white shadow-emerald-300'
            : 'bg-white text-indigo-600 border-2 border-indigo-200 shadow-slate-200'
        }`}
        title="Stoppuhr"
      >
        <Timer size={20} />
        <span className="text-sm font-bold">
          {laeuft ? formatVergangen(vergangen) : 'Stoppuhr'}
        </span>
      </button>

      {/* Overlay */}
      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOffen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={20} />
                <h3 className="font-bold">Stoppuhr</h3>
              </div>
              <button onClick={() => setOffen(false)} className="text-white/70 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Geplante Zeit */}
              {hatGeplant && (
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl">
                  <Clock size={15} className="text-slate-400" />
                  <span>Geplant: <strong>{probe.zeitVon} – {probe.zeitBis} Uhr</strong> ({zeitDifferenzMinuten(probe.zeitVon, probe.zeitBis)} Min.)</span>
                </div>
              )}

              {/* Stoppuhr-Anzeige */}
              <div className="text-center py-4">
                <div className={`text-6xl font-mono font-bold tabular-nums ${laeuft ? 'text-red-500' : endzeit ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {formatVergangen(vergangen)}
                </div>
                {startzeit && (
                  <p className="text-sm text-slate-400 mt-2">
                    Start: {formatZeit(startzeit)}
                    {endzeit && ` · Ende: ${formatZeit(endzeit)}`}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                {!laeuft ? (
                  <button onClick={handleStart}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition active:scale-95">
                    <Play size={20} fill="white" />
                    {endzeit ? 'Neu starten' : 'Start'}
                  </button>
                ) : (
                  <button onClick={handleStop}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition active:scale-95">
                    <Square size={20} fill="white" />
                    Stopp
                  </button>
                )}
              </div>

              {gespeichert && (
                <p className="text-center text-emerald-600 text-sm font-medium">
                  ✓ Zeiten wurden gespeichert
                </p>
              )}

              {/* Zeitvergleich */}
              <DifferenzAnzeige
                geplantVon={probe?.zeitVon}
                geplantBis={probe?.zeitBis}
                tatsaechlichVon={tatsaechlichVon}
                tatsaechlichBis={tatsaechlichBis}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Stoppuhr;
