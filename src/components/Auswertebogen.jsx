import { useState, useEffect, useCallback } from 'react';
import { BEWERTUNGSKRITERIEN } from '../data/kriterien';
import { getAuswertungenForLehrprobe, addAuswertung, updateAuswertung } from '../lib/db';
import { debounce } from '../lib/utils';

// Die Punkteskala, die wir für jeden Punkt anzeigen
const PUNKTE_SKALA = [
  { value: 5, label: '++' }, // Sehr gut
  { value: 4, label: '+' },  // Gut
  { value: 3, label: 'o' },  // Befriedigend
  { value: 2, label: '-' },  // Ausreichend
  { value: 1, label: '--' }, // Mangelhaft
];

function Auswertebogen({ lehrprobeId }) {
  const [auswertung, setAuswertung] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debounced save function: Speichert erst 300ms nach der letzten Änderung
  const debouncedSave = useCallback(
    debounce(async (dataToSave) => {
      // Wenn eine ID existiert -> updaten, sonst -> neu hinzufügen
      if (dataToSave.id) {
        await updateAuswertung(dataToSave);
      } else {
        const newId = crypto.randomUUID();
        const finalData = { ...dataToSave, id: newId, lehrprobeId };
        await addAuswertung(finalData);
        // Wichtig: Die neue ID im State setzen, damit der nächste Save ein Update ist
        setAuswertung(finalData);
      }
    }, 300),
    [lehrprobeId]
  );

  // Schritt 1: Beim Laden der Komponente die Auswertung aus der DB holen
  useEffect(() => {
    const loadAuswertung = async () => {
      setLoading(true);
      const existingAuswertungen = await getAuswertungenForLehrprobe(lehrprobeId);
      if (existingAuswertungen.length > 0) {
        setAuswertung(existingAuswertungen[0]);
      } else {
        // Leeres Objekt erstellen, falls noch keine Auswertung existiert
        setAuswertung({ punkte: {}, notizen: {}, gesamtnote: '' });
      }
      setLoading(false);
    };
    loadAuswertung();
  }, [lehrprobeId]);

  // Schritt 2: Immer wenn sich die Auswertung ändert, die Speicherung auslösen
  useEffect(() => {
    // Nicht beim initialen Laden speichern
    if (auswertung && !loading) {
      debouncedSave(auswertung);
    }
  }, [auswertung, loading, debouncedSave]);

  // Handler für Änderungen
  const handlePunkteChange = (kriteriumId, value) => {
    setAuswertung(prev => ({
      ...prev,
      punkte: { ...prev.punkte, [kriteriumId]: value }
    }));
  };

  const handleNotizChange = (kriteriumId, text) => {
     setAuswertung(prev => ({
      ...prev,
      notizen: { ...prev.notizen, [kriteriumId]: text }
    }));
  };
  
  const handleGesamtnoteChange = (text) => {
    setAuswertung(prev => ({ ...prev, gesamtnote: text }));
  }

  if (loading) {
    return <div className="text-center p-8">Lade Auswertebogen...</div>;
  }

  return (
    <div className="space-y-8">
      {BEWERTUNGSKRITERIEN.map(kategorie => (
        <div key={kategorie.id} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 border-b pb-2 text-blue-800">{kategorie.titel}</h3>
          <div className="space-y-6">
            {kategorie.punkte.map(punkt => {
              const kriteriumId = `${kategorie.id}_${punkt.id}`;
              return (
                <div key={kriteriumId}>
                  <p className="font-semibold text-gray-800">{punkt.text}</p>
                  {/* Punkte-Radiobuttons */}
                  <div className="flex gap-2 my-2 justify-center">
                    {PUNKTE_SKALA.map(skala => (
                      <label key={skala.value} className="cursor-pointer text-center">
                        <input
                          type="radio"
                          name={kriteriumId}
                          value={skala.value}
                          checked={auswertung?.punkte?.[kriteriumId] === skala.value}
                          onChange={() => handlePunkteChange(kriteriumId, skala.value)}
                          className="sr-only peer" // Versteckt den echten Radio-Button
                        />
                        <div className="w-12 py-1 border rounded-md text-sm peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600">
                          {skala.label}
                        </div>
                         <span className="text-xs text-gray-500">{skala.value}</span>
                      </label>
                    ))}
                  </div>
                  {/* Notiz-Textarea */}
                  <textarea
                    value={auswertung?.notizen?.[kriteriumId] || ''}
                    onChange={(e) => handleNotizChange(kriteriumId, e.target.value)}
                    placeholder="Notizen zu diesem Punkt..."
                    className="w-full mt-2 p-2 border border-gray-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                  ></textarea>
                </div>
              );
            })}
          </div>
        </div>
      ))}
       {/* Gesamtnote und Bemerkung */}
       <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 border-b pb-2 text-blue-800">Gesamteindruck & Note</h3>
           <textarea
              value={auswertung?.gesamtnote || ''}
              onChange={(e) => handleGesamtnoteChange(e.target.value)}
              placeholder="Gesamteindruck, Empfehlungen, Note..."
              className="w-full mt-2 p-2 border border-gray-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              rows="4"
            ></textarea>
       </div>
    </div>
  );
}

export default Auswertebogen;
