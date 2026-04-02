import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBewerberpruefung, updateBewerberpruefung, deleteBewerberpruefung } from '../lib/bewerberDb';
import BewerberAmpelItem from '../components/BewerberAmpel';
import BewerberNotizblock from '../components/BewerberNotizblock';
import BewerberKartenpins from '../components/BewerberKartenpins';
import Stoppuhr from '../components/Stoppuhr';
import AnwaerterTeilen from '../components/AnwaerterTeilen';
import { ChevronLeft, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { debounce } from '../lib/utils';
import {
  GRUNDFAHRAUFGABEN_B, GRUNDFAHRAUFGABEN_BE,
  GRUNDFAHRAUFGABEN_C, GRUNDFAHRAUFGABEN_CE,
  VERBINDEN_TRENNEN
} from '../data/bewerberKriterien';

function oeffneZusammenfassungTab(pruefung) {
  const istBBE = pruefung.klasse === 'B_BE';
  const AMPEL_TEXT = { gruen: 'Ohne Beanstandung', gelb: 'Mit Mängeln', rot: 'Nicht erfüllt' };
  const AMPEL_FARBE = { gruen: '#16a34a', gelb: '#d97706', rot: '#dc2626' };

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

  let aufgabenHTML = '';
  aufgabenGruppen.forEach(gruppe => {
    const bewertet = gruppe.aufgaben.filter(a => pruefung.ampel?.[a.id]);
    if (bewertet.length === 0) return;
    aufgabenHTML += `<h2 style="font-size:12pt;background:#0d9488;color:#fff;padding:6px 10px;margin-top:14px">${gruppe.titel}</h2>`;
    aufgabenHTML += `<table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:9.5pt">`;
    gruppe.aufgaben.forEach(a => {
      const ampel = pruefung.ampel?.[a.id];
      if (!ampel) return;
      const notiz = pruefung.ampelNotizen?.[a.id];
      aufgabenHTML += `<tr>
        <td style="width:60%">${a.text}</td>
        <td style="width:15%;text-align:center;background:${AMPEL_FARBE[ampel]}20;color:${AMPEL_FARBE[ampel]};font-weight:bold">${AMPEL_TEXT[ampel]}</td>
        <td style="width:25%;font-size:8.5pt">${notiz?.tastaturText || (notiz?.stiftData ? '(Stiftnotiz)' : '')}</td>
      </tr>`;
    });
    aufgabenHTML += `</table>`;
  });

  let notizHTML = '';
  notizFelder.forEach(([feld, label]) => {
    const notiz = pruefung[feld];
    if (notiz?.tastaturText?.trim() || notiz?.stiftData) {
      notizHTML += `<h2 style="font-size:12pt;background:#0d9488;color:#fff;padding:6px 10px;margin-top:14px">${label}</h2>`;
      if (notiz.tastaturText?.trim()) {
        notizHTML += `<div style="border:1px solid #ccc;padding:8px;font-size:9.5pt;white-space:pre-wrap">${notiz.tastaturText}</div>`;
      }
      if (notiz.stiftData) notizHTML += `<p style="font-size:8.5pt;color:#666;font-style:italic">+ Handschriftliche Notiz vorhanden</p>`;
    }
  });

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
  <title>Zusammenfassung ${pruefung.bewerber}</title>
  <style>* { box-sizing:border-box; } body { font-family:Arial,sans-serif; font-size:10pt; color:#000; background:#fff; max-width:800px; margin:0 auto; padding:20px; }
  h1 { font-size:16pt; text-align:center; border-bottom:2px solid #0d9488; padding-bottom:8px; }
  .meta { width:100%; border-collapse:collapse; margin-bottom:14px; }
  .meta td { padding:4px 8px; border:1px solid #ccc; font-size:9.5pt; }
  .drucken { position:fixed; top:12px; right:12px; background:#0d9488; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; }
  @media print { .drucken { display:none; } }</style></head>
  <body>
  <button class="drucken" onclick="window.print()">🖨️ Drucken / PDF</button>
  <h1>Fahrpraktische Bewertung ${istBBE ? 'B/BE' : 'C/CE'}</h1>
  <table class="meta">
    <tr><td><b>Bewerber:</b> ${pruefung.dienstgrad ? pruefung.dienstgrad + ' ' : ''}${pruefung.bewerber}</td>
        <td><b>Datum:</b> ${format(new Date(pruefung.datum), 'dd.MM.yyyy')}</td></tr>
    ${!istBBE && pruefung.karteNr ? `<tr><td colspan="2"><b>Karte-Nr.:</b> ${pruefung.karteNr}</td></tr>` : ''}
    ${pruefung.zeitTatsaechlichVon ? `<tr><td colspan="2"><b>Zeit:</b> ${pruefung.zeitTatsaechlichVon} – ${pruefung.zeitTatsaechlichBis} Uhr</td></tr>` : ''}
  </table>
  ${aufgabenHTML}
  ${notizHTML}
  </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}

function BewerberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pruefung, setPruefung] = useState(null);
  const [loading, setLoading] = useState(true);

  const debouncedSave = useCallback(
    debounce(async (data) => { await updateBewerberpruefung(data); }, 500), []
  );

  useEffect(() => {
    getBewerberpruefung(id).then(p => { setPruefung(p); setLoading(false); });
  }, [id]);

  const update = (changes) => {
    const neu = { ...pruefung, ...changes };
    setPruefung(neu);
    debouncedSave(neu);
  };

  const handleAmpelChange = (aufgabeId, farbe) => update({ ampel: { ...(pruefung.ampel || {}), [aufgabeId]: farbe } });
  const handleAmpelNotizChange = (aufgabeId, notizDaten) => update({ ampelNotizen: { ...(pruefung.ampelNotizen || {}), [aufgabeId]: notizDaten } });
  const handleNotizChange = (feld, daten) => update({ [feld]: daten });

  const handleLoeschen = async () => {
    if (!window.confirm('Bewertung wirklich löschen?')) return;
    await deleteBewerberpruefung(id);
    navigate('/bewerber');
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

  const stoppuhrProbe = {
    id: pruefung.id, zeitVon: '', zeitBis: '',
    zeitTatsaechlichVon: pruefung.zeitTatsaechlichVon || '',
    zeitTatsaechlichBis: pruefung.zeitTatsaechlichBis || '',
  };

  // Stub für AnwaerterTeilen (teilt die Bewerberpruefung)
  const teilenProbe = { ...pruefung, prüfling: `${pruefung.dienstgrad ? pruefung.dienstgrad + ' ' : ''}${pruefung.bewerber}`, thema: `${istBBE ? 'B/BE' : 'C/CE'} – ${format(new Date(pruefung.datum), 'dd.MM.yyyy')}` };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link to="/bewerber" className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium transition">
          <ChevronLeft size={20} /> Zurück
        </Link>
        <div className="flex gap-2">
          <button onClick={() => oeffneZusammenfassungTab(pruefung)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-teal-200 text-teal-600 hover:bg-teal-50 transition text-sm font-medium">
            <FileText size={16} /> Zusammenfassung
          </button>
          <AnwaerterTeilen lehrprobeId={pruefung.id} anwaerterName={teilenProbe.prüfling} probe={teilenProbe} />
          <button onClick={handleLoeschen}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition text-sm">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {(pruefung.bewerber || '?').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{pruefung.dienstgrad ? `${pruefung.dienstgrad} ${pruefung.bewerber}` : pruefung.bewerber}</h2>
              <p className="text-teal-200 text-sm">Fahrpraktische Bewertung {istBBE ? 'B/BE' : 'C/CE'}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-teal-50 border-t border-teal-100 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-teal-700">
          <span>📅 {format(new Date(pruefung.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
          {!istBBE && pruefung.karteNr && <span>📋 Karte-Nr. {pruefung.karteNr}</span>}
          {pruefung.zeitTatsaechlichVon && <span>⏱ {pruefung.zeitTatsaechlichVon} – {pruefung.zeitTatsaechlichBis} Uhr</span>}
        </div>
      </div>

      {/* Aufgabengruppen */}
      {aufgabenGruppen.map(gruppe => (
        <div key={gruppe.titel} className="card overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-3">
            <h3 className="font-bold text-white text-sm">{gruppe.titel}</h3>
          </div>
          <div className="px-4 py-2">
            {gruppe.aufgaben.map(aufgabe => (
              <BewerberAmpelItem key={aufgabe.id} aufgabe={aufgabe}
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

      {/* Kartenpins */}
      <BewerberKartenpins pruefungId={pruefung.id} />

      {/* Stoppuhr */}
      <Stoppuhr lehrprobeId={pruefung.id} probe={stoppuhrProbe}
        onZeitGespeichert={(von, bis) => update({ zeitTatsaechlichVon: von, zeitTatsaechlichBis: bis })} />
    </div>
  );
}

export default BewerberDetail;
