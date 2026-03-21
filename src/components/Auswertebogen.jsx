import { useState, useEffect, useCallback } from 'react';
import { BEWERTUNGSKRITERIEN } from '../data/kriterien';
import { getAuswertungenForLehrprobe, addAuswertung, updateAuswertung } from '../lib/db';
import { berechneKategorieDurchschnitte } from '../lib/berechnungen'; // <-- NEU: Berechnungs-Helfer importieren
import AuswertungChart from './AuswertungChart'; // <-- NEU: Chart-Komponente importieren
import { debounce } from '../lib/utils';
import clsx from 'clsx';

const PUNKTE_SKALA = [
  { value: 5, label: 'Sehr Gut', symbol: '++' },
  { value: 4, label: 'Gut', symbol: '+' },
  { value: 3, label: 'Befriedigend', symbol: 'o' },
  { value: 2, label: 'Ausreichend', symbol: '-' },
  { value: 1, label: 'Mangelhaft', symbol: '--' },
];

function Auswertebogen({ lehrprobeId }) {
  const [auswertung, setAuswertung] = useState(null);
  const [durchschnitte, setDurchschnitte] = useState(null); // <-- NEU: State für die Durchschnittswerte
  const [loading, setLoading] = useState(true);

  const debouncedSave = useCallback(
    debounce(async (dataToSave) => {
      if (dataToSave.id) {
        await updateAuswertung(dataToSave);
      } else {
        const newId = crypto.randomUUID();
        const finalData = { ...dataToSave, id: newId, lehrprobeId };
        await addAuswertung(finalData);
        setAuswertung(finalData);
      }
    }, 300),
    [lehrprobeId]
  );

  useEffect(() => {
    const loadAuswertung = async () => {
      setLoading(true);
      const existing = await getAuswertungenForLehrprobe(lehrprobeId);
      const currentAuswertung = existing[0] || { punkte: {}, notizen: {}, gesamtnote: '' };
      setAuswertung(currentAuswertung);
      // Berechne die Durchschnitte direkt nach dem Laden
      setDurchschnitte(berechneKategorieDurchschnitte(currentAuswertung));
      setLoading(false);
    };
    loadAuswertung();
  }, [lehrprobeId]);

  useEffect(() => {
    if (auswertung && !loading) {
      debouncedSave(auswertung);
      // Berechne die Durchschnitte bei jeder Änderung neu
      setDurchschnitte(berechneKategorieDurchschnitte(auswertung));
    }
  }, [auswertung, loading, debouncedSave]);

  const handlePunkteChange = (kriteriumId, value) => {
    setAuswertung(prev => ({ ...prev, punkte: { ...prev.punkte, [kriteriumId]: value }}));
  };

  const handleNotizChange = (kriteriumId, text) => {
     setAuswertung(prev => ({ ...prev, notizen: { ...prev.notizen, [kriteriumId]: text }}));
  };
  
  const handleGesamtnoteChange = (text) => {
    setAuswertung(prev => ({ ...prev, gesamtnote: text }));
  }

  if (loading) {
    return <div className="text-center p-8">Lade Auswertebogen...</div>;
  }

  return (
    <div className="space-y-8">
      {/* HIER WIRD DAS DIAGRAMM EINGEFÜGT */}
      <AuswertungChart durchschnitte={durchschnitte} />

      {BEWERTUNGSKRITERIEN.map(kategorie => (
        <div key={kategorie.id} className="bg-white rounded-xl shadow-md overflow-hidden print-container auswertebogen-kategorie">
          <h3 className="text-xl font-bold p-5 bg-slate-50 border-b border-slate-200 text-slate-800">{kategorie.titel}</h3>
          <div className="divide-y divide-slate-200">
            {kategorie.punkte.map(punkt => {
              const kriteriumId = `${kategorie.id}_${punkt.id}`;
              const bewertung = auswertung?.punkte?.[kriteriumId];
              return (
                <div key={kriteriumId} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <p className="font-semibold text-slate-800 self-center">{punkt.text}</p>
                  <div>
                    <div className="flex flex-wrap gap-2 radio-container-print">
                      {PUNKTE_SKALA.map(skala => (
                        <label key={skala.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name={kriteriumId}
                            value={skala.value}
                            checked={bewertung === skala.value}
                            onChange={() => handlePunkteChange(kriteriumId, skala.value)}
                            className="sr-only peer"
                          />
                          <div className={clsx(
                            'px-3 py-1.5 border rounded-full text-sm font-semibold transition-colors',
                            bewertung === skala.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300'
                          )}>
                            {skala.symbol}
                          </div>
                        </label>
                      ))}
                    </div>
                     {bewertung && <p className="radio-print-label">{PUNKTE_SKALA.find(s => s.value === bewertung)?.label}</p>}
                    <textarea
                      value={auswertung?.notizen?.[kriteriumId] || ''}
                      onChange={(e) => handleNotizChange(kriteriumId, e.target.value)}
                      placeholder="Notizen..."
                      className="w-full mt-3 p-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 transition"
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
       <div className="bg-white rounded-xl shadow-md p-5 print-container">
          <h3 className="text-xl font-bold mb-3 text-slate-800">Gesamteindruck & Note</h3>
           <textarea
              value={auswertung?.gesamtnote || ''}
              onChange={(e) => handleGesamtnoteChange(e.target.value)}
              placeholder="Zusammenfassende Bemerkungen, Empfehlungen und Note eintragen..."
              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 transition"
              rows="5"
            ></textarea>
       </div>
    </div>
  );
}

export default Auswertebogen;
