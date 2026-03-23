import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLehrproben, getAuswertungenForLehrprobe } from '../lib/db';
import { berechneKategorieDurchschnitte } from '../lib/berechnungen';
import { BEWERTUNGSKRITERIEN } from '../data/kriterien';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600', 'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600', 'from-amber-500 to-orange-600',
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
  if (!wert) return { bar: 'bg-slate-200', text: 'text-slate-500', badge: 'bg-slate-100 text-slate-600' };
  if (wert >= 4.5) return { bar: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' };
  if (wert >= 3.5) return { bar: 'bg-blue-500', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
  if (wert >= 2.5) return { bar: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' };
  return { bar: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-700' };
}

function Trend({ aktuell, vorher }) {
  if (!aktuell || !vorher) return null;
  const diff = parseFloat((aktuell - vorher).toFixed(2));
  if (diff > 0) return <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><TrendingUp size={12} />+{diff}</span>;
  if (diff < 0) return <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><TrendingDown size={12} />{diff}</span>;
  return <span className="flex items-center gap-1 text-slate-400 text-xs"><Minus size={12} />0</span>;
}

function AnwaerterProfil() {
  const { name } = useParams();
  const anwaerterName = decodeURIComponent(name);
  const [profilDaten, setProfilDaten] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const laden = async () => {
      const alle = await getLehrproben();
      const meineProben = alle
        .filter(p => p.prüfling === anwaerterName)
        .sort((a, b) => new Date(a.datum) - new Date(b.datum));

      const probenMitDaten = await Promise.all(meineProben.map(async (probe) => {
        const auswertungen = await getAuswertungenForLehrprobe(probe.id);
        const auswertung = auswertungen[0];
        const durchschnitte = auswertung ? berechneKategorieDurchschnitte(auswertung) : null;
        const gesamt = durchschnitte
          ? parseFloat((Object.values(durchschnitte).filter(Boolean).reduce((a, b) => a + b, 0) /
              Object.values(durchschnitte).filter(Boolean).length).toFixed(2))
          : null;
        return { probe, durchschnitte, gesamt };
      }));

      setProfilDaten(probenMitDaten);
      setLoading(false);
    };
    laden();
  }, [anwaerterName]);

  if (loading) return <div className="text-center p-12 text-slate-500">Lade Profil...</div>;
  if (!profilDaten?.length) return (
    <div className="text-center p-12">
      <p className="text-slate-500">Keine Daten für diesen Anwärter gefunden.</p>
      <Link to="/" className="btn btn-primary mt-4 mx-auto">Zurück</Link>
    </div>
  );

  const letzte = profilDaten[profilDaten.length - 1];
  const vorletzte = profilDaten.length > 1 ? profilDaten[profilDaten.length - 2] : null;
  const farbe = getAvatarColor(anwaerterName);

  return (
    <div className="space-y-6">
      {/* Zurück */}
      <Link to="/" className="btn btn-secondary w-fit">
        <ChevronLeft size={18} /> Übersicht
      </Link>

      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-6 text-white">
          <div className="flex items-center gap-5">
            <div className={`bg-gradient-to-br ${farbe} rounded-2xl w-16 h-16 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/30`}>
              <span className="text-white font-bold text-xl">{getInitials(anwaerterName)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{anwaerterName}</h1>
              <p className="text-indigo-200 mt-0.5">{profilDaten.length} Lehrprobe{profilDaten.length !== 1 ? 'n' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aktueller Stand */}
      {letzte.durchschnitte && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4">Aktueller Kompetenzstand</h3>
          <div className="space-y-3">
            {BEWERTUNGSKRITERIEN.map(k => {
              const wert = letzte.durchschnitte[k.id];
              const vorherWert = vorletzte?.durchschnitte?.[k.id];
              const farben = getFarbe(wert);
              return (
                <div key={k.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">{k.titel}</span>
                    <div className="flex items-center gap-2">
                      <Trend aktuell={wert} vorher={vorherWert} />
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${farben.badge}`}>
                        {wert ?? '–'} / 5.0
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${farben.bar} transition-all duration-700`}
                      style={{ width: wert ? `${(wert / 5) * 100}%` : '0%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verlauf */}
      {profilDaten.length > 1 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4">Entwicklung über alle Lehrproben</h3>
          <div className="space-y-2">
            {profilDaten.map(({ probe, gesamt }, index) => {
              const farben = getFarbe(gesamt);
              const breite = gesamt ? (gesamt / 5) * 100 : 0;
              return (
                <Link key={probe.id} to={`/lehrprobe/${probe.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group">
                  <span className="text-xs text-slate-400 w-5 text-center font-bold">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600 truncate">{probe.thema}</span>
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                        {format(new Date(probe.datum), 'dd.MM.yy')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${farben.bar}`} style={{ width: `${breite}%` }} />
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${farben.badge}`}>
                    {gesamt ?? '–'}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Alle Lehrproben */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">Alle Lehrproben</h3>
        <div className="space-y-2">
          {[...profilDaten].reverse().map(({ probe }) => (
            <Link key={probe.id} to={`/lehrprobe/${probe.id}`}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{probe.thema}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(probe.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}
                </p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnwaerterProfil;
