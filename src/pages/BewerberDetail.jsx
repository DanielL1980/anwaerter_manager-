import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBewerberpruefung, updateBewerberpruefung, deleteBewerberpruefung } from '../lib/bewerberDb';
import BewerberAmpelItem from '../components/BewerberAmpel';
import BewerberNotizblock from '../components/BewerberNotizblock';
import Stoppuhr from '../components/Stoppuhr';
import { ChevronLeft, Trash2, Sparkles, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { debounce } from '../lib/utils';
import {
  GRUNDFAHRAUFGABEN_B, GRUNDFAHRAUFGABEN_BE,
  GRUNDFAHRAUFGABEN_C, GRUNDFAHRAUFGABEN_CE,
  VERBINDEN_TRENNEN
} from '../data/bewerberKriterien';

function BewerberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pruefung, setPruefung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zusammenfassungKopiert, setZusammenfassungKopiert] = useState(false);

  const debouncedSave = useCallback(
    debounce(async (data) => { await updateBewerberpruefung(data); }, 500),
    []
  );

  useEffect(() => {
    getBewerberpruefung(id).then(p => { setPruefung(p); setLoading(false); });
  }, [id]);

  const update = (changes) => {
    const neu = { ...pruefung, ...changes };
    setPruefung(neu);
    debouncedSave(neu);
  };

  const handleAmpelChange = (aufgabeId, farbe) => {
    update({ ampel: { ...(pruefung.ampel || {}), [aufgabeId]: farbe } });
  };

  const handleAmpelNotizChange = (aufgabeId, notizDaten) => {
    update({ ampelNotizen: { ...(pruefung.ampelNotizen || {}), [aufgabeId]: notizDaten } });
  };

  const handleNotizChange = (feld, daten) => {
    update({ [feld]: daten });
  };

  const handleLoeschen = async () => {
    if (!window.confirm('Prüfung wirklich löschen?')) return;
    await deleteBewerberpruefung(id);
    navigate('/bewerber');
  };

  const erstelleZusammenfassung = () => {
    if (!pruefung) return '';
    const istBBE = pruefung.klasse === 'B_BE';
    const AMPEL_TEXT = { gruen: 'Ohne Beanstandung', gelb: 'Mit Mängeln', rot: 'Nicht erfüllt' };

    let text = `BEWERBER-PRÜFUNG ${istBBE ? 'B/BE' : 'C/CE'}\n`;
    text += `${'='.repeat(50)}\n`;
    text += `Bewerber: ${pruefung.dienstgrad ? pruefung.dienstgrad + ' ' : ''}${pruefung.bewerber}\n`;
    text += `Datum: ${format(new Date(pruefung.datum), 'dd.MM.yyyy', { locale: de })}\n`;
    if (!istBBE && pruefung.karteNr) text += `Karte-Nr.: ${pruefung.karteNr}\n`;
    if (pruefung.zeitTatsaechlichVon) text += `Zeit: ${pruefung.zeitTatsaechlichVon} – ${pruefung.zeitTatsaechlichBis} Uhr\n`;
    text += '\n';

    const aufgabenGruppen = istBBE
      ? [
          { titel: 'Grundfahraufgaben B', aufgaben: GRUNDFAHRAUFGABEN_B },
          { titel: 'Grundfahraufgaben BE', aufgaben: GRUNDFAHRAUFGABEN_BE },
          { titel: 'Verbinden / Trennen', aufgaben: VERBINDEN_TRENNEN },
        ]
      : [
          { titel: 'Abfahrtkontrolle', aufgaben: [{ id: 'abfahrtkontrolle', text: `Abfahrtkontrolle (Karte ${pruefung.karteNr || '–'})` }] },
          { titel: 'Grundfahraufgaben C', aufgaben: GRUNDFAHRAUFGABEN_C },
          { titel: 'Grundfahraufgaben CE', aufgaben: GRUNDFAHRAUFGABEN_CE },
          { titel: 'Verbinden / Trennen', aufgaben: VERBINDEN_TRENNEN },
        ];

    aufgabenGruppen.forEach(gruppe => {
      text += `${gruppe.titel}:\n`;
      gruppe.aufgaben.forEach(a => {
        const ampel = pruefung.ampel?.[a.id];
        if (ampel) {
          text += `  • ${a.text}: ${AMPEL_TEXT[ampel]}\n`;
          const notiz = pruefung.ampelNotizen?.[a.id];
          if (notiz?.tastaturText?.trim()) text += `    Notiz: ${notiz.tastaturText}\n`;
          if (notiz?.stiftData) text += `    (Stiftnotiz vorhanden)\n`;
        }
      });
      text += '\n';
    });

    const notizFelder = istBBE
      ? [['notizFahrenB', 'Fahren B'], ['notizFahrenBE', 'Fahren BE']]
      : [['notizFahrenC', 'Fahren C'], ['notizFahrenCE', 'Fahren CE']];

    notizFelder.forEach(([feld, label]) => {
      const notiz = pruefung[feld];
      if (notiz?.tastaturText?.trim() || notiz?.stiftData) {
        text += `${label}:\n`;
        if (notiz.tastaturText?.trim()) text += `  ${notiz.tastaturText}\n`;
        if (notiz.stiftData) text += `  (Stiftnotiz vorhanden)\n`;
        text += '\n';
      }
    });

    return text;
  };

  const handleZusammenfassungKopieren = async () => {
    const text = erstelleZusammenfassung();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setZusammenfassungKopiert(true);
    setTimeout(() => setZusammenfassungKopiert(false), 3000);
  };

  if (loading) return <div className="text-center p-8 text-slate-500">Laden...</div>;
  if (!pruefung) return <div className="text-center p-8 text-slate-500">Nicht gefunden.</div>;

  const istBBE = pruefung.klasse === 'B_BE';

  const aufgabenGruppen = istBBE
    ? [
        { titel: 'Grundfahraufgaben B', aufgaben: GRUNDFAHRAUFGABEN_B },
        { titel: 'Grundfahraufgaben BE', aufgaben: GRUNDFAHRAUFGABEN_BE },
        { titel: 'Verbinden / Trennen der Fahrzeugkombination', aufgaben: VERBINDEN_TRENNEN },
      ]
    : [
        { titel: `Abfahrtkontrolle (Karte-Nr. ${pruefung.karteNr || '–'})`, aufgaben: [{ id: 'abfahrtkontrolle', text: 'Abfahrtkontrolle durchgeführt' }] },
        { titel: 'Grundfahraufgaben C', aufgaben: GRUNDFAHRAUFGABEN_C },
        { titel: 'Grundfahraufgaben CE', aufgaben: GRUNDFAHRAUFGABEN_CE },
        { titel: 'Verbinden / Trennen der Fahrzeugkombination', aufgaben: VERBINDEN_TRENNEN },
      ];

  const notizFelder = istBBE
    ? [['notizFahrenB', 'Fahren B'], ['notizFahrenBE', 'Fahren BE']]
    : [['notizFahrenC', 'Fahren C'], ['notizFahrenCE', 'Fahren CE']];

  // Stoppuhr-kompatibler Probe-Stub
  const stoppuhrProbe = {
    id: pruefung.id,
    zeitVon: '', zeitBis: '',
    zeitTatsaechlichVon: pruefung.zeitTatsaechlichVon || '',
    zeitTatsaechlichBis: pruefung.zeitTatsaechlichBis || '',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center no-print">
        <Link to="/bewerber" className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium transition">
          <ChevronLeft size={20} /> Zurück
        </Link>
        <div className="flex gap-2">
          <button onClick={handleZusammenfassungKopieren}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition ${zusammenfassungKopiert ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {zusammenfassungKopiert ? <Check size={16} /> : <Sparkles size={16} />}
            {zusammenfassungKopiert ? 'Kopiert!' : 'Zusammenfassung'}
          </button>
          <button onClick={handleLoeschen}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition text-sm">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Hero-Karte */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {(pruefung.bewerber || '?').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">
                {pruefung.dienstgrad ? `${pruefung.dienstgrad} ${pruefung.bewerber}` : pruefung.bewerber}
              </h2>
              <p className="text-teal-200 text-sm">Fahrpraktische Prüfung {istBBE ? 'B/BE' : 'C/CE'}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-teal-50 border-t border-teal-100 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-teal-700">
          <span>📅 {format(new Date(pruefung.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
          {!istBBE && pruefung.karteNr && <span>📋 Karte-Nr. {pruefung.karteNr}</span>}
          {pruefung.zeitTatsaechlichVon && <span>⏱ {pruefung.zeitTatsaechlichVon} – {pruefung.zeitTatsaechlichBis} Uhr</span>}
        </div>
      </div>

      {/* Grundfahraufgaben */}
      {aufgabenGruppen.map(gruppe => (
        <div key={gruppe.titel} className="card overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-3">
            <h3 className="font-bold text-white text-sm">{gruppe.titel}</h3>
          </div>
          <div className="px-4 py-2">
            {gruppe.aufgaben.map(aufgabe => (
              <BewerberAmpelItem
                key={aufgabe.id}
                aufgabe={aufgabe}
                ampelWert={pruefung.ampel?.[aufgabe.id] || null}
                notiz={pruefung.ampelNotizen?.[aufgabe.id] || null}
                onAmpelChange={(farbe) => handleAmpelChange(aufgabe.id, farbe)}
                onNotizChange={(notizDaten) => handleAmpelNotizChange(aufgabe.id, notizDaten)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Notizfelder Fahren */}
      {notizFelder.map(([feld, label]) => (
        <div key={feld} className="card p-5">
          <BewerberNotizblock
            blockId={`${pruefung.id}-${feld}`}
            label={label}
            gespeichert={pruefung[feld]}
            onSpeichern={(daten) => handleNotizChange(feld, daten)}
          />
        </div>
      ))}

      {/* Stoppuhr */}
      <Stoppuhr lehrprobeId={pruefung.id} probe={stoppuhrProbe} onZeitGespeichert={(von, bis) => update({ zeitTatsaechlichVon: von, zeitTatsaechlichBis: bis })} />
    </div>
  );
}

export default BewerberDetail;
