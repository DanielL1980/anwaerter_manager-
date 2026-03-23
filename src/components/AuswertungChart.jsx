import { useState } from 'react';
import { KRITERIEN_THEORIE, KRITERIEN_FAHRSTUNDE } from '../data/kriterien';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const PUNKTE_SKALA = [
  { value: 5, symbol: '++' }, { value: 4, symbol: '+' },
  { value: 3, symbol: 'o' }, { value: 2, symbol: '-' }, { value: 1, symbol: '--' },
];

function getFarbe(punkte) {
  if (!punkte) return { bar: 'bg-slate-200', badge: 'bg-slate-100 text-slate-600' };
  if (punkte >= 4.5) return { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
  if (punkte >= 3.5) return { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' };
  if (punkte >= 2.5) return { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' };
  return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
}

function AuswertungChart({ auswertung, durchschnitte }) {
  const [openKategorie, setOpenKategorie] = useState(null);

  if (!durchschnitte || !auswertung) return null;

  const typ = auswertung?.typ || 'theorie';
  const kriterien = typ === 'fahrstunde' ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;

  return (
    <div className="card p-5 print-container mb-2">
      <h3 className="text-lg font-bold mb-4 text-slate-800">Kompetenz-Übersicht</h3>
      <div className="space-y-3">
        {kriterien.map(kategorie => {
          const durchschnitt = durchschnitte[kategorie.id];
          if (durchschnitt === null || durchschnitt === undefined) return null;

          const isOpen = openKategorie === kategorie.id;
          const farben = getFarbe(durchschnitt);
          const breite = (durchschnitt / 5) * 100;

          return (
            <div key={kategorie.id} className="border border-slate-100 rounded-xl overflow-hidden">
              <button onClick={() => setOpenKategorie(isOpen ? null : kategorie.id)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors focus:outline-none">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700 text-sm">{kategorie.titel}</span>
                  <div className="flex items-center gap-2">
                    {kategorie.gewichtung > 1 && (
                      <span className="text-xs text-slate-400">{kategorie.gewichtung}x</span>
                    )}
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${farben.badge}`}>
                      {durchschnitt} / 5.0
                    </span>
                    <ChevronDown size={16} className={clsx('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-500 ${farben.bar}`} style={{ width: `${breite}%` }} />
                </div>
              </button>

              {isOpen && (
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 space-y-2">
                  {kategorie.punkte.map(punkt => {
                    const kriteriumId = `${kategorie.id}_${punkt.id}`;
                    const bewertung = auswertung.punkte[kriteriumId];
                    const symbol = PUNKTE_SKALA.find(s => s.value === bewertung)?.symbol;
                    const pFarben = getFarbe(bewertung);
                    return (
                      <div key={kriteriumId} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 text-xs">{punkt.text}</span>
                        {bewertung ? (
                          <span className={`font-bold px-2 py-0.5 rounded-lg text-xs ml-2 flex-shrink-0 ${pFarben.badge}`}>
                            {symbol} ({bewertung})
                          </span>
                        ) : <span className="text-xs text-slate-400 ml-2">–</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AuswertungChart;
