import { useState } from 'react';
import { BEWERTUNGSKRITERIEN } from '../data/kriterien';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// Wir definieren hier die Skala nochmal, um an die Symbole zu kommen
const PUNKTE_SKALA = [
  { value: 5, symbol: '++' },
  { value: 4, symbol: '+' },
  { value: 3, symbol: 'o' },
  { value: 2, symbol: '-' },
  { value: 1, symbol: '--' },
];

function getFarbeFuerPunkte(punkte) {
  if (!punkte) return 'bg-slate-200';
  if (punkte >= 4.5) return 'bg-green-500';
  if (punkte >= 3.5) return 'bg-blue-500';
  if (punkte >= 2.5) return 'bg-yellow-500';
  if (punkte >= 1.5) return 'bg-orange-500';
  return 'bg-red-500';
}

// Die neue Chart-Komponente, die jetzt das ganze Auswertungsobjekt braucht
function AuswertungChart({ auswertung, durchschnitte }) {
  const [openKategorie, setOpenKategorie] = useState(null); // Speichert die ID der offenen Kategorie

  if (!durchschnitte || !auswertung) {
    return null;
  }

  const handleToggle = (kategorieId) => {
    // Wenn die geklickte Kategorie schon offen ist, schließe sie. Sonst, öffne sie.
    setOpenKategorie(openKategorie === kategorieId ? null : kategorieId);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 print-container">
      <h3 className="text-xl font-bold mb-4 text-slate-800 px-2">Kompetenz-Übersicht</h3>
      <div className="space-y-2">
        {BEWERTUNGSKRITERIEN.map(kategorie => {
          const durchschnitt = durchschnitte[kategorie.id];
          const isOpen = openKategorie === kategorie.id;

          // Wir zeigen nur Kategorien an, die auch bewertet wurden
          if (durchschnitt === null || durchschnitt === undefined) {
            return null;
          }

          const breiteInProzent = (durchschnitt / 5) * 100;
          const farbe = getFarbeFuerPunkte(durchschnitt);

          return (
            <div key={kategorie.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Der klickbare Header des Akkordeons */}
              <button
                onClick={() => handleToggle(kategorie.id)}
                className="w-full text-left p-3 hover:bg-slate-50 focus:outline-none"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{kategorie.titel}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 text-sm">{durchschnitt} / 5.0</span>
                    <ChevronDown
                      size={20}
                      className={clsx('text-slate-500 transition-transform', isOpen && 'rotate-180')}
                    />
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${farbe}`}
                    style={{ width: `${breiteInProzent}%` }}
                  ></div>
                </div>
              </button>
              
              {/* Der ausklappbare Detail-Bereich */}
              {isOpen && (
                <div className="bg-slate-50 p-4 border-t border-slate-200">
                  <ul className="space-y-2">
                    {kategorie.punkte.map(punkt => {
                      const kriteriumId = `${kategorie.id}_${punkt.id}`;
                      const bewertung = auswertung.punkte[kriteriumId];
                      const symbol = PUNKTE_SKALA.find(s => s.value === bewertung)?.symbol;

                      return (
                        <li key={kriteriumId} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{punkt.text}</span>
                          {bewertung ? (
                             <span className={clsx(
                               'font-bold px-2 py-0.5 rounded-md text-xs',
                               bewertung >= 4 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                             )}>
                               {symbol} ({bewertung})
                             </span>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
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
