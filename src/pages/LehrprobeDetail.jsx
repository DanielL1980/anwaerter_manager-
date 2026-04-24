import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLehrprobe, getAuswertungenForLehrprobe, saveAuswertung } from '../lib/db';
import KiZusammenfassung from '../components/KiZusammenfassung';
import AnwaerterTeilen from '../components/AnwaerterTeilen';
import GlobaleNotiz from '../components/GlobaleNotiz';
import Stoppuhr from '../components/Stoppuhr';
import Schnellnotizen from '../components/Schnellnotizen';
import { ChevronLeft, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { berechneKategorieDurchschnitte } from '../lib/berechnungen';
import { KRITERIEN_FAHRSTUNDE, KRITERIEN_THEORIE } from '../data/kriterien';
import { deleteLehrprobe } from '../lib/db';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { debounce } from '../lib/utils';

const SKALA = [
  { wert: 5, label: '++', farbe: 'bg-emerald-500 text-white' },
  { wert: 4, label: '+',  farbe: 'bg-green-400 text-white' },
  { wert: 3, label: 'o',  farbe: 'bg-amber-400 text-white' },
  { wert: 2, label: '–',  farbe: 'bg-orange-500 text-white' },
  { wert: 1, label: '––', farbe: 'bg-red-600 text-white' },
];

function KriteriumZeile({ id, punkt, auswertung, onBewertung, onNotiz }) {
  const bewertung = auswertung?.punkte?.[id];
  const notiz = auswertung?.notizen?.[id] || '';
  const [notizOffen, setNotizOffen] = useState(false);

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 pt-1 min-w-0">{punkt.text}</p>
        <div className="flex gap-1 flex-shrink-0">
          {SKALA.map(s => (
            <button
              key={s.wert}
              onClick={() => onBewertung(id, bewertung === s.wert ? null : s.wert)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                bewertung === s.wert
                  ? `${s.farbe} shadow-sm ring-2 ring-offset-1 ring-current`
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 ml-0">
        {notizOffen || notiz ? (
          <textarea
            value={notiz}
            onChange={e => onNotiz(id, e.target.value)}
            onFocus={() => setNotizOffen(true)}
            placeholder="Notiz..."
            rows={2}
            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition resize-none"
          />
        ) : (
          <button onClick={() => setNotizOffen(true)} className="text-xs text-slate-400 hover:text-indigo-500 transition">
            + Notiz hinzufügen
          </button>
        )}
      </div>
    </div>
  );
}

function KategorieBlock({ kategorie, auswertung, onBewertung, onNotiz }) {
  const [offen, setOffen] = useState(false);
  const kriterien = kategorie.punkte || [];
  const bewertet = kriterien.filter(p => auswertung?.punkte?.[`${kategorie.id}_${p.id}`]).length;
  const gesamt = kriterien.length;

  return (
    <div className="card overflow-hidden mb-3">
      <button
        onClick={() => setOffen(!offen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-700 to-violet-700 hover:from-indigo-800 hover:to-violet-800 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-white text-sm">{kategorie.titel}</span>
          {kategorie.gewichtung && (
            <span className="text-indigo-300 text-xs">{kategorie.gewichtung}-fach</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bewertet === gesamt ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'}`}>
            {bewertet}/{gesamt}
          </span>
          {offen ? <ChevronUp size={18} className="text-white" /> : <ChevronDown size={18} className="text-white" />}
        </div>
      </button>
      {offen && (
        <div className="px-4 py-1">
          {kriterien.map(punkt => (
            <KriteriumZeile
              key={punkt.id}
              id={`${kategorie.id}_${punkt.id}`}
              punkt={punkt}
              auswertung={auswertung}
              onBewertung={onBewertung}
              onNotiz={onNotiz}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LehrprobeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [probe, setProbe] = useState(null);
  const [auswertung, setAuswertung] = useState(null);
  const [loading, setLoading] = useState(true);

  const debouncedSave = useCallback(
    debounce(async (data) => { await saveAuswertung(data); }, 600), []
  );

  useEffect(() => {
    Promise.all([getLehrprobe(id), getAuswertungenForLehrprobe(id)]).then(([p, a]) => {
      setProbe(p);
      setAuswertung(a[0] || { lehrprobeId: id, punkte: {}, notizen: {}, gesamtnote: '' });
      setLoading(false);
    });
  }, [id]);

  const handleBewertung = (kriteriumId, wert) => {
    const neu = { ...auswertung, punkte: { ...auswertung.punkte, [kriteriumId]: wert } };
    if (wert === null) delete neu.punkte[kriteriumId];
    setAuswertung(neu);
    debouncedSave(neu);
  };

  const handleNotiz = (kriteriumId, text) => {
    const neu = { ...auswertung, notizen: { ...auswertung.notizen, [kriteriumId]: text } };
    setAuswertung(neu);
    debouncedSave(neu);
  };

  const handleGesamtnotiz = (text) => {
    const neu = { ...auswertung, gesamtnote: text };
    setAuswertung(neu);
    debouncedSave(neu);
  };

  const handleLoeschen = async () => {
    if (!window.confirm('Auswertung wirklich löschen?')) return;
    await deleteLehrprobe(id);
    navigate('/anwaerter');
  };

  if (loading) return <div className="text-center p-8 text-slate-500">Laden...</div>;
  if (!probe) return <div className="text-center p-8 text-slate-500">Nicht gefunden.</div>;

  const istFahrstunde = probe.typ === 'fahrstunde';
  const kriterien = istFahrstunde ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;
  const durchschnitte = auswertung ? berechneKategorieDurchschnitte(auswertung, kriterien) : {};

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Link to="/anwaerter" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition">
          <ChevronLeft size={20} /> Zurück
        </Link>
        <div className="flex gap-2">
          <AnwaerterTeilen lehrprobeId={id} anwaerterName={probe.prüfling} probe={probe} />
          <button onClick={handleLoeschen}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition text-sm">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {probe.prüfling.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{probe.prüfling}</h2>
              <p className="text-indigo-200 text-sm truncate">{probe.thema}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
          <span>📅 {format(new Date(probe.datum), 'dd. MMMM yyyy', { locale: de })}</span>
          {probe.stufe && <span>📚 Stufe {probe.stufe}</span>}
          {istFahrstunde && <span>🚗 Fahrstunde</span>}
          {probe.zeitTatsaechlichVon && <span>⏱ {probe.zeitTatsaechlichVon} – {probe.zeitTatsaechlichBis} Uhr</span>}
        </div>
      </div>

      <div>
        {kriterien.map(kategorie => (
          <KategorieBlock
            key={kategorie.id}
            kategorie={kategorie}
            auswertung={auswertung}
            onBewertung={handleBewertung}
            onNotiz={handleNotiz}
          />
        ))}
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Gesamteindruck & Bemerkungen</h3>
        <textarea
          value={auswertung?.gesamtnote || ''}
          onChange={e => handleGesamtnotiz(e.target.value)}
          placeholder="Abschließende Bemerkungen, Empfehlungen und abschließende Einschätzung..."
          rows={4}
          className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
        />
      </div>

      {auswertung && probe && (
        <KiZusammenfassung auswertung={auswertung} durchschnitte={durchschnitte} lehrprobe={probe} />
      )}

      <Schnellnotizen lehrprobeId={id} />

      <GlobaleNotiz lehrprobeId={id} />

      <Stoppuhr lehrprobeId={id} probe={probe}
        onZeitGespeichert={(von, bis) => setProbe(p => ({ ...p, zeitTatsaechlichVon: von, zeitTatsaechlichBis: bis }))} />
    </div>
  );
}

export default LehrprobeDetail;
