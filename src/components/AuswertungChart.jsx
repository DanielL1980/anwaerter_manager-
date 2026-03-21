import { BEWERTUNGSKRITERIEN } from '../data/kriterien';

// Funktion, um je nach Punktzahl eine Farbe zu bekommen
function getFarbeFuerPunkte(punkte) {
  if (punkte >= 4.5) return 'bg-green-500';  // Sehr Gut
  if (punkte >= 3.5) return 'bg-blue-500';   // Gut
  if (punkte >= 2.5) return 'bg-yellow-500'; // Befriedigend
  if (punkte >= 1.5) return 'bg-orange-500'; // Ausreichend
  return 'bg-red-500';                      // Mangelhaft
}

function AuswertungChart({ durchschnitte }) {
  if (!durchschnitte) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 print-container">
      <h3 className="text-xl font-bold mb-4 text-slate-800">Kompetenz-Übersicht</h3>
      <div className="space-y-4">
        {BEWERTUNGSKRITERIEN.map(kategorie => {
          const durchschnitt = durchschnitte[kategorie.id];
          if (durchschnitt === null || durchschnitt === undefined) {
            return null; // Zeige nichts an, wenn keine Bewertung vorhanden ist
          }

          const breiteInProzent = (durchschnitt / 5) * 100;
          const farbe = getFarbeFuerPunkte(durchschnitt);

          return (
            <div key={kategorie.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-700">{kategorie.titel}</span>
                <span className="font-bold text-slate-800">{durchschnitt} / 5.00</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${farbe}`}
                  style={{ width: `${breiteInProzent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AuswertungChart;
