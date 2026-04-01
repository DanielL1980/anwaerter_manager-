import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLehrproben, getAuswertungenForLehrprobe } from '../lib/db';
import { berechneKategorieDurchschnitte, berechneGewichteteNote } from '../lib/berechnungen';
import { KRITERIEN_THEORIE, KRITERIEN_FAHRSTUNDE } from '../data/kriterien';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, GraduationCap, Car } from 'lucide-react';

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
  return <span className="flex items-center gap-1 text-slate-400 text-xs"><Minus size={12} />±0</span>;
}

// Inline SVG Liniendiagramm ohne externe Bibliothek
function VerlaufsChart({ probenMitDaten }) {
  const auswertbar = probenMitDaten.filter(p => p.gesamt !== null);
  if (auswertbar.length < 2) return null;

  const werte = auswertbar.map(p => p.gesamt);
  const min = Math.max(0, Math.min(...werte) - 0.5);
  const max = Math.min(5, Math.max(...werte) + 0.5);
  const breite = 600;
  const hoehe = 180;
  const padL = 40, padR = 20, padT = 20, padB = 40;
  const chartBreite = breite - padL - padR;
  const chartHoehe = hoehe - padT - padB;

  const xPos = (i) => padL + (i / (werte.length - 1)) * chartBreite;
  const yPos = (v) => padT + chartHoehe - ((v - min) / (max - min)) * chartHoehe;

  const pfad = werte.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(v)}`).join(' ');
  const flaeche = `${pfad} L ${xPos(werte.length - 1)} ${padT + chartHoehe} L ${padL} ${padT + chartHoehe} Z`;

  // Y-Achse Beschriftungen
  const yTicks = [1, 2, 3, 4, 5];

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-800 mb-4">Entwicklung der Gesamtnote</h3>
      <svg viewBox={`0 0 ${breite} ${hoehe}`} className="w-full" style={{ maxHeight: '200px' }}>
        {/* Gitternetz */}
        {yTicks.filter(t => t >= min && t <= max).map(t => (
          <g key={t}>
            <line x1={padL} y1={yPos(t)} x2={breite - padR} y2={yPos(t)}
              stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
            <text x={padL - 8} y={yPos(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{t}</text>
          </g>
        ))}

        {/* Fläche unter der Kurve */}
        <path d={flaeche} fill="url(#gradient)" opacity="0.3" />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Linie */}
        <path d={pfad} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Punkte + Labels */}
        {werte.map((v, i) => (
          <g key={i}>
            <circle cx={xPos(i)} cy={yPos(v)} r="5" fill="#6366f1" stroke="white" strokeWidth="2" />
            <text x={xPos(i)} y={yPos(v) - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4f46e5">{v}</text>
            <text x={xPos(i)} y={hoehe - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {format(new Date(auswertbar[i].probe.datum), 'dd.MM.')}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function KompetenzVerlauf({ probenMitDaten }) {
  const auswertbar = probenMitDaten.filter(p => p.durchschnitte !== null);
  if (auswertbar.length < 2) return null;

  // Sammle alle vorkommenden Kategorien
  const alleKategorien = new Set();
  auswertbar.forEach(p => Object.keys(p.durchschnitte).forEach(k => alleKategorien.add(k)));

  const kategorienInfo = [...KRITERIEN_THEORIE, ...KRITERIEN_FAHRSTUNDE]
    .filter((k, i, arr) => arr.findIndex(x => x.id === k.id) === i)
    .filter(k => alleKategorien.has(k.id));

  const FARBEN = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

  const breite = 600;
  const hoehe = 180;
  const padL = 40, padR = 20, padT = 20, padB = 40;
  const chartBreite = breite - padL - padR;
  const chartHoehe = hoehe - padT - padB;

  const xPos = (i) => padL + (i / (auswertbar.length - 1)) * chartBreite;
  const yPos = (v) => padT + chartHoehe - ((v - 1) / 4) * chartHoehe;

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-800 mb-2">Entwicklung je Kompetenzbereich</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {kategorienInfo.map((k, i) => (
          <div key={k.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FARBEN[i % FARBEN.length] }} />
            <span className="text-xs text-slate-600">{k.titel}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${breite} ${hoehe}`} className="w-full" style={{ maxHeight: '200px' }}>
        {[1,2,3,4,5].map(t => (
          <g key={t}>
            <line x1={padL} y1={yPos(t)} x2={breite - padR} y2={yPos(t)}
              stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
            <text x={padL - 8} y={yPos(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{t}</text>
          </g>
        ))}

        {kategorienInfo.map((k, ki) => {
          const farbe = FARBEN[ki % FARBEN.length];
          const punkte = auswertbar.map(p => p.durchschnitte[k.id]).filter(Boolean);
          if (punkte.length < 2) return null;
          const verfuegbar = auswertbar.filter(p => p.durchschnitte[k.id] != null);
          const pfad = verfuegbar.map((p, i) => {
            const globalIndex = auswertbar.indexOf(p);
            return `${i === 0 ? 'M' : 'L'} ${xPos(globalIndex)} ${yPos(p.durchschnitte[k.id])}`;
          }).join(' ');
          return <path key={k.id} d={pfad} fill="none" stroke={farbe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />;
        })}

        {auswertbar.map((p, i) => (
          <text key={i} x={xPos(i)} y={hoehe - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {format(new Date(p.probe.datum), 'dd.MM.')}
          </text>
        ))}
      </svg>
    </div>
  );
}

function AnwaerterProfil() {
  const { name } = useParams();
  const anwaerterName = decodeURIComponent(name);
  const [profilDaten, setProfilDaten] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aktuellerTyp, setAktuellerTyp] = useState('alle');

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
        const noteErgebnis = auswertung ? berechneGewichteteNote(auswertung) : null;
        const gesamt = durchschnitte
          ? parseFloat((Object.values(durchschnitte).filter(Boolean).reduce((a, b) => a + b, 0) /
              Object.values(durchschnitte).filter(Boolean).length).toFixed(2))
          : null;
        return { probe, durchschnitte, gesamt, noteErgebnis };
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

  const gefilterteProben = aktuellerTyp === 'alle'
    ? profilDaten
    : profilDaten.filter(p => (p.probe.typ || 'theorie') === aktuellerTyp);

  const letzte = gefilterteProben[gefilterteProben.length - 1];
  const vorletzte = gefilterteProben.length > 1 ? gefilterteProben[gefilterteProben.length - 2] : null;
  const farbe = getAvatarColor(anwaerterName);

  const theorieAnzahl = profilDaten.filter(p => (p.probe.typ || 'theorie') === 'theorie').length;
  const fahrstundeAnzahl = profilDaten.filter(p => p.probe.typ === 'fahrstunde').length;

  return (
    <div className="space-y-6">
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{anwaerterName}</h1>
              <div className="flex gap-4 mt-1">
                <span className="flex items-center gap-1 text-indigo-200 text-sm">
                  <GraduationCap size={14} /> {theorieAnzahl} Theorie
                </span>
                <span className="flex items-center gap-1 text-indigo-200 text-sm">
                  <Car size={14} /> {fahrstundeAnzahl} Fahrstunden
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Typ-Filter */}
      {theorieAnzahl > 0 && fahrstundeAnzahl > 0 && (
        <div className="flex gap-2">
          {['alle', 'theorie', 'fahrstunde'].map(t => (
            <button key={t} onClick={() => setAktuellerTyp(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${aktuellerTyp === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
              {t === 'alle' ? 'Alle' : t === 'theorie' ? 'Theorie' : 'Fahrstunden'}
            </button>
          ))}
        </div>
      )}

      {/* Verlaufsdiagramme */}
      {gefilterteProben.length >= 2 && (
        <>
          <VerlaufsChart probenMitDaten={gefilterteProben} />
          <KompetenzVerlauf probenMitDaten={gefilterteProben} />
        </>
      )}

      {/* Aktueller Stand */}
      {letzte?.durchschnitte && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Aktueller Kompetenzstand</span>
            {letzte.noteErgebnis && (
              <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-xl">
                Note: {letzte.noteErgebnis.note}
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {[...KRITERIEN_THEORIE, ...KRITERIEN_FAHRSTUNDE]
              .filter((k, i, arr) => arr.findIndex(x => x.id === k.id) === i)
              .filter(k => letzte.durchschnitte[k.id] != null)
              .map(k => {
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
                          {wert} / 5.0
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${farben.bar} transition-all duration-700`}
                        style={{ width: `${(wert / 5) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Alle Auswertungen */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">Alle Auswertungen</h3>
        <div className="space-y-2">
          {[...gefilterteProben].reverse().map(({ probe, gesamt, noteErgebnis }) => {
            const farben = getFarbe(gesamt);
            const istFahrstunde = probe.typ === 'fahrstunde';
            return (
              <Link key={probe.id} to={`/lehrprobe/${probe.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group">
                <div className="flex items-center gap-3">
                  <div className={`${istFahrstunde ? 'bg-blue-100' : 'bg-indigo-100'} rounded-lg p-1.5`}>
                    {istFahrstunde ? <Car size={14} className="text-blue-600" /> : <GraduationCap size={14} className="text-indigo-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{probe.thema}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(probe.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {noteErgebnis && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${farben.badge}`}>
                      Note {noteErgebnis.note}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AnwaerterProfil;
