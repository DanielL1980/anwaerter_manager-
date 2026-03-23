import { useState, useEffect, useCallback } from 'react';
import { KRITERIEN_THEORIE, KRITERIEN_FAHRSTUNDE } from '../data/kriterien';
import { getAuswertungenForLehrprobe, addAuswertung, updateAuswertung } from '../lib/db';
import { berechneKategorieDurchschnitte, berechneGewichteteNote } from '../lib/berechnungen';
import AuswertungChart from './AuswertungChart';
import KiZusammenfassung from './KiZusammenfassung';
import { debounce } from '../lib/utils';
import clsx from 'clsx';

const PUNKTE_SKALA = [
  { value: 5, label: 'Sehr Gut', symbol: '++' },
  { value: 4, label: 'Gut', symbol: '+' },
  { value: 3, label: 'Befriedigend', symbol: 'o' },
  { value: 2, label: 'Ausreichend', symbol: '-' },
  { value: 1, label: 'Mangelhaft', symbol: '--' },
];

const SKALA_FARBEN = {
  5: 'border-emerald-400 bg-emerald-500 text-white shadow-emerald-200',
  4: 'border-blue-400 bg-blue-500 text-white shadow-blue-200',
  3: 'border-amber-400 bg-amber-400 text-white shadow-amber-200',
  2: 'border-orange-400 bg-orange-500 text-white shadow-orange-200',
  1: 'border-red-400 bg-red-500 text-white shadow-red-200',
};

function NoteAnzeige({ auswertung }) {
  const ergebnis = berechneGewichteteNote(auswertung);
  if (!ergebnis) return null;
  return (
    <div className="card overflow-hidden print-container">
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-4">
        <h3 className="text-base font-bold text-white">Notenberechnung</h3>
      </div>
      <div className="p-5 flex items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-1">Gewichteter Index</p>
          <p className="text-3xl font-bold text-slate-800">{ergebnis.index}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-1">Note</p>
          <p className="text-3xl font-bold text-indigo-600">{ergebnis.note}</p>
        </div>
        <div className="text-xs text-slate-400 flex-1">
          <p>Theorie: Didaktik 3-fach · Aktivierung 1-fach · Ausbilderverhalten 1-fach</p>
          <p className="mt-1">Fahrstunde: Didaktik 2-fach · Sicherheit 2-fach · Komm. 1-fach · Einleitung 1-fach · Abschluss 1-fach</p>
        </div>
      </div>
    </div>
  );
}

function Auswertebogen({ lehrprobeId, lehrprobe }) {
  const [auswertung, setAuswertung] = useState(null);
  const [durchschnitte, setDurchschnitte] = useState(null);
  const [loading, setLoading] = useState(true);

  const typ = lehrprobe?.typ || 'theorie';
  const kriterien = typ === 'fahrstunde' ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;

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
      const currentAuswertung = existing[0] || { punkte: {}, notizen: {}, gesamtnote: '', typ };
      setAuswertung(currentAuswertung);
      setDurchschnitte(berechneKategorieDurchschnitte(currentAuswertung));
      setLoading(false);
    };
    loadAuswertung();
  }, [lehrprobeId]);

  useEffect(() => {
    if (auswertung && !loading) {
      debouncedSave(auswertung);
      setDurchschnitte(berechneKategorieDurchschnitte(auswertung));
    }
  }, [auswertung, loading, debouncedSave]);

  const handlePunkteChange = (kriteriumId, value) => {
    setAuswertung(prev => ({ ...prev, punkte: { ...prev.punkte, [kriteriumId]: value } }));
  };

  const handleNotizChange = (kriteriumId, text) => {
    setAuswertung(prev => ({ ...prev, notizen: { ...prev.notizen, [kriteriumId]: text } }));
  };

  const handleGesamtnoteChange = (text) => {
    setAuswertung(prev => ({ ...prev, gesamtnote: text }));
  };

  if (loading) return <div className="text-center p-8 text-slate-500">Lade Auswertebogen...</div>;

  return (
    <div className="space-y-6">
      <AuswertungChart durchschnitte={durchschnitte} auswertung={auswertung} />
      <NoteAnzeige auswertung={auswertung} />

      {auswertung && durchschnitte && lehrprobe && (
        <KiZusammenfassung auswertung={auswertung} durchschnitte={durchschnitte} lehrprobe={lehrprobe} />
      )}

      {kriterien.map(kategorie => (
        <div key={kategorie.id} className="card overflow-hidden print-container auswertebogen-kategorie">
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">{kategorie.titel}</h3>
            {kategorie.gewichtung > 1 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-lg">
                {kategorie.gewichtung}-fach gewichtet
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {kategorie.punkte.map(punkt => {
              const kriteriumId = `${kategorie.id}_${punkt.id}`;
              const bewertung = auswertung?.punkte?.[kriteriumId];
              return (
                <div key={kriteriumId} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <p className="font-medium text-slate-700 self-center">{punkt.text}</p>
                  <div>
                    <div className="flex flex-wrap gap-2 radio-container-print">
                      {PUNKTE_SKALA.map(skala => (
                        <label key={skala.value} className="cursor-pointer">
                          <input type="radio" name={kriteriumId} value={skala.value}
                            checked={bewertung === skala.value}
                            onChange={() => handlePunkteChange(kriteriumId, skala.value)}
                            className="sr-only peer" />
                          <div className={clsx(
                            'px-3 py-1.5 border-2 rounded-xl text-sm font-bold transition-all duration-150 shadow-sm',
                            bewertung === skala.value
                              ? SKALA_FARBEN[skala.value]
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          )}>
                            {skala.symbol}
                          </div>
                        </label>
                      ))}
                    </div>
                    {bewertung && (
                      <p className="text-xs mt-1.5 font-semibold text-slate-500 radio-print-label">
                        {PUNKTE_SKALA.find(s => s.value === bewertung)?.label}
                      </p>
                    )}
                    <textarea
                      value={auswertung?.notizen?.[kriteriumId] || ''}
                      onChange={(e) => handleNotizChange(kriteriumId, e.target.value)}
                      placeholder="Notizen..."
                      className="w-full mt-3 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-slate-50 placeholder-slate-400"
                      rows="2"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="card p-5 print-container">
        <h3 className="text-base font-bold mb-3 text-slate-800">Gesamteindruck & Bemerkungen</h3>
        <textarea
          value={auswertung?.gesamtnote || ''}
          onChange={(e) => handleGesamtnoteChange(e.target.value)}
          placeholder="Zusammenfassende Bemerkungen, Empfehlungen und abschließende Einschätzung..."
          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-slate-50 placeholder-slate-400"
          rows="5"
        />
      </div>
    </div>
  );
}

export default Auswertebogen;
