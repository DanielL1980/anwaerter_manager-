import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBewerberpruefungen } from '../lib/bewerberDb';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronRight, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import {
  GRUNDFAHRAUFGABEN_B, GRUNDFAHRAUFGABEN_BE,
  GRUNDFAHRAUFGABEN_C, GRUNDFAHRAUFGABEN_CE,
  VERBINDEN_TRENNEN
} from '../data/bewerberKriterien';

const ALLE_AUFGABEN = [
  ...GRUNDFAHRAUFGABEN_B,
  ...GRUNDFAHRAUFGABEN_BE,
  ...GRUNDFAHRAUFGABEN_C,
  ...GRUNDFAHRAUFGABEN_CE,
  ...VERBINDEN_TRENNEN,
];

function BewerberDashboard() {
  const [pruefungen, setPruefungen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBewerberpruefungen().then(data => {
      setPruefungen(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center p-8 text-slate-500">Laden...</div>;

  if (pruefungen.length === 0) {
    return (
      <div className="card p-16 text-center mt-4">
        <div className="bg-teal-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
          <ClipboardList size={36} className="text-teal-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">Noch keine Daten</h3>
        <p className="text-slate-500">Lege zuerst eine fahrpraktische Bewertung an.</p>
      </div>
    );
  }

  // Statistiken berechnen
  const anzahlBBE = pruefungen.filter(p => p.klasse === 'B_BE').length;
  const anzahlCCE = pruefungen.filter(p => p.klasse === 'C_CE').length;
  const letzte = pruefungen[0];

  // Mängel-Auswertung über alle Bewertungen
  const aufgabenStats = {};
  ALLE_AUFGABEN.forEach(a => {
    aufgabenStats[a.id] = { text: a.text, gruen: 0, gelb: 0, rot: 0, gesamt: 0 };
  });

  pruefungen.forEach(p => {
    if (!p.ampel) return;
    Object.entries(p.ampel).forEach(([id, farbe]) => {
      if (aufgabenStats[id] && farbe) {
        aufgabenStats[id][farbe]++;
        aufgabenStats[id].gesamt++;
      }
    });
  });

  // Nur bewertete Aufgaben, sortiert nach Mängeln+Nicht erfüllt
  const bewertet = Object.values(aufgabenStats)
    .filter(a => a.gesamt > 0)
    .sort((a, b) => (b.gelb + b.rot) - (a.gelb + a.rot));

  // Bewerber mit Ampel-Zusammenfassung
  const bewerberMap = {};
  pruefungen.forEach(p => {
    const key = p.bewerber;
    if (!bewerberMap[key]) {
      bewerberMap[key] = { name: p.bewerber, dienstgrad: p.dienstgrad, klasse: p.klasse, gruen: 0, gelb: 0, rot: 0, id: p.id, datum: p.datum };
    }
    if (p.ampel) {
      Object.values(p.ampel).forEach(farbe => {
        if (farbe) bewerberMap[key][farbe]++;
      });
    }
  });
  const bewerberListe = Object.values(bewerberMap);

  const getInitials = (name) => name?.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  // Anzahl Aufgaben mit Mängeln
  const aufgabenMitMaengeln = bewertet.filter(a => a.gelb + a.rot > 0).length;

  return (
    <div className="space-y-5 mt-2">

      {/* Stat Kacheln */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '📋', value: pruefungen.length, label: 'Bewertungen gesamt', color: 'bg-teal-100' },
          { icon: '👤', value: bewerberListe.length, label: 'Bewerber erfasst', color: 'bg-emerald-100' },
          { icon: '📅', value: format(new Date(letzte.datum), 'dd. MMM', { locale: de }), label: 'Letzte Bewertung', color: 'bg-amber-100' },
          { icon: '⚠️', value: aufgabenMitMaengeln, label: 'Aufgaben mit Mängeln', color: 'bg-red-100' },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <div className={`${s.color} rounded-xl w-9 h-9 flex items-center justify-center text-lg mb-2`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Zwei Spalten: Letzte Aktivitäten + Klassen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Letzte Aktivitäten */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-3">
            <h3 className="font-bold text-white text-sm">🕐 Letzte Aktivitäten</h3>
          </div>
          <div className="px-4 py-2">
            {pruefungen.slice(0, 5).map(p => (
              <Link key={p.id} to={`/bewerber/${p.id}`}
                className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition -mx-1 px-1 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {p.dienstgrad ? `${p.dienstgrad} ${p.bewerber}` : p.bewerber}
                  </p>
                  <p className="text-xs text-slate-400">{p.klasse === 'B_BE' ? 'B/BE' : 'C/CE'}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{format(new Date(p.datum), 'dd. MMM', { locale: de })}</p>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* B/BE vs C/CE */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-3">
            <h3 className="font-bold text-white text-sm">📊 Klassenverteilung</h3>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-slate-600">B / BE</span>
                <span className="text-sm font-bold text-teal-600">{anzahlBBE}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${pruefungen.length ? (anzahlBBE / pruefungen.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-slate-600">C / CE</span>
                <span className="text-sm font-bold text-emerald-600">{anzahlCCE}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${pruefungen.length ? (anzahlCCE / pruefungen.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">Gesamt: {pruefungen.length} Bewertungen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Häufige Mängel */}
      {bewertet.length > 0 && (
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-300" />
            <h3 className="font-bold text-white text-sm">Häufige Mängel & Auffälligkeiten</h3>
          </div>
          <div className="px-4 py-2">
            {bewertet.map(a => {
              const total = a.gruen + a.gelb + a.rot;
              const breitenFaktor = 120 / total;
              return (
                <div key={a.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                  <p className="flex-1 text-sm text-slate-700 min-w-0 truncate" title={a.text}>{a.text}</p>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {a.gruen > 0 && <div className="h-2.5 rounded-l-full bg-emerald-500" style={{ width: `${a.gruen * breitenFaktor}px` }} />}
                    {a.gelb > 0 && <div className={`h-2.5 bg-amber-400 ${a.gruen === 0 ? 'rounded-l-full' : ''} ${a.rot === 0 ? 'rounded-r-full' : ''}`} style={{ width: `${a.gelb * breitenFaktor}px` }} />}
                    {a.rot > 0 && <div className={`h-2.5 rounded-r-full bg-red-500 ${a.gruen === 0 && a.gelb === 0 ? 'rounded-l-full' : ''}`} style={{ width: `${a.rot * breitenFaktor}px` }} />}
                  </div>
                  <span className="text-xs text-slate-400 font-mono w-6 text-right flex-shrink-0">{total}×</span>
                </div>
              );
            })}
            <div className="flex gap-4 pt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> OK</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Mängel</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Nicht erfüllt</span>
            </div>
          </div>
        </div>
      )}

      {/* Bewerber Übersicht */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-3">
          <h3 className="font-bold text-white text-sm">👤 Bewerber – Ampel-Übersicht</h3>
        </div>
        <div className="px-4 py-2">
          {bewerberListe.map(b => (
            <Link key={b.id} to={`/bewerber/${b.id}`}
              className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition -mx-1 px-1 rounded-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{getInitials(b.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {b.dienstgrad ? `${b.dienstgrad} ${b.name}` : b.name}
                </p>
                <p className="text-xs text-slate-400">{b.klasse === 'B_BE' ? 'B/BE' : 'C/CE'}</p>
              </div>
              {/* Ampel Dots */}
              <div className="flex gap-1 flex-shrink-0">
                {Array(b.gruen).fill(0).map((_, i) => <span key={`g${i}`} className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />)}
                {Array(b.gelb).fill(0).map((_, i) => <span key={`y${i}`} className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />)}
                {Array(b.rot).fill(0).map((_, i) => <span key={`r${i}`} className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />)}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0 ${b.klasse === 'B_BE' ? 'bg-teal-100 text-teal-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {b.klasse === 'B_BE' ? 'B/BE' : 'C/CE'}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}

export default BewerberDashboard;
