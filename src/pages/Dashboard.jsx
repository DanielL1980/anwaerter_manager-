import { useState, useEffect } from 'react';
import { getLehrproben, getAuswertungenForLehrprobe } from '../lib/db';
import { berechneKategorieDurchschnitte } from '../lib/berechnungen';
import { BEWERTUNGSKRITERIEN } from '../data/kriterien';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { ClipboardList, TrendingUp, TrendingDown, Calendar, Award, ChevronRight } from 'lucide-react';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
];

function getInitials(name) {
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getFarbe(wert) {
  if (!wert) return { bar: 'bg-slate-200', text: 'text-slate-500', bg: 'bg-slate-100' };
  if (wert >= 4.5) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (wert >= 3.5) return { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' };
  if (wert >= 2.5) return { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
}

function Dashboard() {
  const [daten, setDaten] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ladeDaten = async () => {
      const lehrproben = await getLehrproben();
      if (lehrproben.length === 0) { setDaten({ leer: true }); setLoading(false); return; }

      // Auswertungen für alle Lehrproben laden
      const auswertungenMitProbe = await Promise.all(
        lehrproben.map(async (probe) => {
          const auswertungen = await getAuswertungenForLehrprobe(probe.id);
          const auswertung = auswertungen[0];
          const durchschnitte = auswertung ? berechneKategorieDurchschnitte(auswertung) : null;
          const gesamt = durchschnitte
            ? parseFloat((Object.values(durchschnitte).filter(Boolean).reduce((a, b) => a + b, 0) /
                Object.values(durchschnitte).filter(Boolean).length).toFixed(2))
            : null;
          return { probe, durchschnitte, gesamt };
        })
      );

      // Gesamtdurchschnitte je Kompetenz über alle Lehrproben
      const kompetenzSummen = {};
      const kompetenzAnzahl = {};
      BEWERTUNGSKRITERIEN.forEach(k => { kompetenzSummen[k.id] = 0; kompetenzAnzahl[k.id] = 0; });

      auswertungenMitProbe.forEach(({ durchschnitte }) => {
        if (!durchschnitte) return;
        BEWERTUNGSKRITERIEN.forEach(k => {
          if (durchschnitte[k.id]) {
            kompetenzSummen[k.id] += durchschnitte[k.id];
            kompetenzAnzahl[k.id]++;
          }
        });
      });

      const kompetenzDurchschnitte = BEWERTUNGSKRITERIEN.map(k => ({
        id: k.id,
        titel: k.titel,
        wert: kompetenzAnzahl[k.id] > 0
          ? parseFloat((kompetenzSummen[k.id] / kompetenzAnzahl[k.id]).toFixed(2))
          : null,
      })).filter(k => k.wert !== null);

      const sorted = [...kompetenzDurchschnitte].sort((a, b) => b.wert - a.wert);
      const beste = sorted[0];
      const schlechteste = sorted[sorted.length - 1];

      // Rangliste
      const rangliste = auswertungenMitProbe
        .filter(d => d.gesamt !== null)
        .sort((a, b) => b.gesamt - a.gesamt);

      // Zeitstrahl – letzte 5 Lehrproben
      const zeitstrahl = [...lehrproben].reverse().slice(0, 5);

      setDaten({ lehrproben, kompetenzDurchschnitte, beste, schlechteste, rangliste, zeitstrahl });
      setLoading(false);
    };
    ladeDaten();
  }, []);

  if (loading) return <div className="text-center p-12 text-slate-500">Lade Dashboard...</div>;
  if (daten?.leer) return (
    <div className="card p-16 text-center">
      <p className="text-slate-500">Noch keine Daten vorhanden. Lege zuerst eine Auswertung an.</p>
      <Link to="/" className="btn btn-primary mt-4 mx-auto">Zur Übersicht</Link>
    </div>
  );

  const gesamtSchnitt = daten.rangliste.length > 0
    ? parseFloat((daten.rangliste.reduce((a, b) => a + b.gesamt, 0) / daten.rangliste.length).toFixed(2))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Gesamtübersicht aller Auswertungen</p>
      </div>

      {/* Stat-Karten */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="bg-indigo-100 rounded-xl p-2.5 w-fit mb-3">
            <ClipboardList size={20} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{daten.lehrproben.length}</p>
          <p className="text-sm text-slate-500 mt-0.5">Auswertungen</p>
        </div>
        <div className="card p-5">
          <div className="bg-blue-100 rounded-xl p-2.5 w-fit mb-3">
            <Award size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{gesamtSchnitt ?? '–'}</p>
          <p className="text-sm text-slate-500 mt-0.5">Ø Gesamtnote</p>
        </div>
        <div className="card p-5">
          <div className="bg-emerald-100 rounded-xl p-2.5 w-fit mb-3">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{daten.beste?.wert ?? '–'}</p>
          <p className="text-sm text-slate-500 mt-0.5 truncate">↑ {daten.beste?.titel}</p>
        </div>
        <div className="card p-5">
          <div className="bg-red-100 rounded-xl p-2.5 w-fit mb-3">
            <TrendingDown size={20} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{daten.schlechteste?.wert ?? '–'}</p>
          <p className="text-sm text-slate-500 mt-0.5 truncate">↓ {daten.schlechteste?.titel}</p>
        </div>
      </div>

      {/* Kompetenz-Übersicht */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">Ø Kompetenzwerte (alle Auswertungen)</h3>
        <div className="space-y-3">
          {daten.kompetenzDurchschnitte.map(k => {
            const farben = getFarbe(k.wert);
            return (
              <div key={k.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{k.titel}</span>
                  <span className={`text-sm font-bold ${farben.text}`}>{k.wert} / 5.0</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${farben.bar} transition-all duration-700`} style={{ width: `${(k.wert / 5) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Rangliste */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award size={18} className="text-amber-500" /> Rangliste
          </h3>
          <div className="space-y-2">
            {daten.rangliste.map(({ probe, gesamt }, index) => {
              const farben = getFarbe(gesamt);
              const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
              return (
                <Link key={probe.id} to={`/lehrprobe/${probe.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group">
                  <span className={`text-lg font-bold w-6 text-center ${medalColors[index] || 'text-slate-400'}`}>
                    {index + 1}
                  </span>
                  <div className={`bg-gradient-to-br ${getAvatarColor(probe.prüfling)} rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-xs">{getInitials(probe.prüfling)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{probe.prüfling}</p>
                    <p className="text-xs text-slate-400 truncate">{probe.thema}</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${farben.bg} ${farben.text}`}>
                    {gesamt}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Zeitstrahl */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" /> Letzte Aktivitäten
          </h3>
          <div className="space-y-1">
            {daten.zeitstrahl.map((probe, index) => (
              <Link key={probe.id} to={`/lehrprobe/${probe.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  {index < daten.zeitstrahl.length - 1 && <div className="w-0.5 h-6 bg-slate-200 mt-0.5" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="font-semibold text-slate-800 text-sm truncate">{probe.prüfling}</p>
                  <p className="text-xs text-slate-400 truncate">{probe.thema}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-slate-600">
                    {format(new Date(probe.datum), 'dd. MMM', { locale: de })}
                  </p>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 ml-auto mt-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
