import { useState, useEffect } from 'react';
import { getAuswertungenForLehrprobe } from '../lib/db';
import { berechneKategorieDurchschnitte } from '../lib/berechnungen';
import { KRITERIEN_THEORIE, KRITERIEN_FAHRSTUNDE } from '../data/kriterien';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const SKALA = { 5: '++', 4: '+', 3: 'o', 2: '-', 1: '--' };
const SKALA_TEXT = { 5: 'Sehr Gut', 4: 'Gut', 3: 'Befriedigend', 2: 'Ausreichend', 1: 'Mangelhaft' };

function kopfzeileHtml(probe, auswertung, noteErgebnis) {
  const istFahrstunde = probe.typ === 'fahrstunde';
  const geplantMin = probe.zeitVon && probe.zeitBis
    ? (parseInt(probe.zeitBis.split(':')[0])*60+parseInt(probe.zeitBis.split(':')[1]))
      - (parseInt(probe.zeitVon.split(':')[0])*60+parseInt(probe.zeitVon.split(':')[1]))
    : null;
  const tatsMin = probe.zeitTatsaechlichVon && probe.zeitTatsaechlichBis
    ? (parseInt(probe.zeitTatsaechlichBis.split(':')[0])*60+parseInt(probe.zeitTatsaechlichBis.split(':')[1]))
      - (parseInt(probe.zeitTatsaechlichVon.split(':')[0])*60+parseInt(probe.zeitTatsaechlichVon.split(':')[1]))
    : null;

  return `
    <div class="kopfzeile">
      <h1>${istFahrstunde ? 'Auswertebogen Fahrstunden' : 'Auswertebogen Theoretischer Unterricht'}</h1>
      <table class="meta-tabelle">
        <tr>
          <td><b>MKL / Ausbilder:</b> _______________________</td>
          <td><b>Anwärter:</b> ${probe.prüfling}</td>
        </tr>
        <tr>
          <td><b>Datum:</b> ${format(new Date(probe.datum), 'dd.MM.yyyy')}</td>
          <td><b>Thema:</b> ${probe.thema}</td>
        </tr>
        <tr>
          <td><b>Ausb.-Zeit geplant:</b> ${probe.zeitVon || '___'} – ${probe.zeitBis || '___'} Uhr${geplantMin !== null ? ` = ${geplantMin} Min.` : ''}</td>
          <td><b>Ausb.-Zeit tatsächlich:</b> ${probe.zeitTatsaechlichVon || '___'} – ${probe.zeitTatsaechlichBis || '___'} Uhr${tatsMin !== null ? ` = ${tatsMin} Min.` : ''}</td>
        </tr>
        <tr>
          <td><b>Ausb.-Woche:</b> ${probe.ausbildungswoche || '___'} &nbsp;&nbsp; <b>Ausb.-Stunde:</b> ${probe.ausbildungsstunde || '___'}</td>
          <td><b>${istFahrstunde ? 'Ausbildungsstufe' : 'Art'}:</b> ${istFahrstunde ? (probe.stufe || '___') : (probe.unterrichtstyp || '___')}</td>
        </tr>
      </table>
    </div>`;
}

function bewertungstabelleHtml(auswertung, kriterien) {
  let html = '';
  kriterien.forEach(kategorie => {
    html += `
      <div class="kategorie">
        <div class="kategorie-header">
          ${kategorie.titel}
          ${kategorie.gewichtung > 1 ? `<span class="gewichtung">(${kategorie.gewichtung}-fach gewichtet)</span>` : ''}
        </div>
        <table class="bewertungs-tabelle">
          <thead>
            <tr>
              <th class="kriterium-col">Kriterium</th>
              <th class="note-col">++</th>
              <th class="note-col">+</th>
              <th class="note-col">o</th>
              <th class="note-col">-</th>
              <th class="note-col">--</th>
              <th class="notiz-col">Notizen</th>
            </tr>
          </thead>
          <tbody>`;
    kategorie.punkte.forEach(punkt => {
      const id = `${kategorie.id}_${punkt.id}`;
      const bewertung = auswertung?.punkte?.[id];
      const notiz = auswertung?.notizen?.[id] || '';
      html += `
            <tr>
              <td class="kriterium-col">${punkt.text}</td>
              ${[5,4,3,2,1].map(v => `<td class="note-col center">${bewertung === v ? '●' : '○'}</td>`).join('')}
              <td class="notiz-col">${notiz}</td>
            </tr>`;
    });
    html += `</tbody></table></div>`;
  });
  return html;
}

function notenberechnungHtml(auswertung, kriterien, noteErgebnis) {
  if (!noteErgebnis) return '';
  const durchschnitte = berechneKategorieDurchschnitte(auswertung);
  return `
    <div class="notenberechnung">
      <h3>Notenberechnung</h3>
      <table class="noten-tabelle">
        <thead>
          <tr>
            ${kriterien.map(k => `<th>${k.titel}<br><small>${k.gewichtung}-fach</small></th>`).join('')}
            <th>Gew. Index (Σ:5)</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            ${kriterien.map(k => `<td class="center">${durchschnitte[k.id]?.toFixed(2) || '–'}</td>`).join('')}
            <td class="center"><b>${noteErgebnis.index}</b></td>
            <td class="center note-gross"><b>${noteErgebnis.note}</b></td>
          </tr>
        </tbody>
      </table>
      <p class="bewertungsrichtlinie">
        sehr gut = 1,0; 1,3 &nbsp;|&nbsp; gut = 1,7; 2,0; 2,3 &nbsp;|&nbsp; befriedigend = 2,7; 3,0; 3,3 &nbsp;|&nbsp;
        ausreichend = 3,7; 4,0; 4,3 &nbsp;|&nbsp; mangelhaft = 4,7; 5,0; 5,3 &nbsp;|&nbsp; ungenügend = 5,7; 6,0
      </p>
    </div>`;
}

function gesamteindruckHtml(auswertung) {
  if (!auswertung?.gesamtnote) return '';
  return `
    <div class="gesamteindruck">
      <h3>Gesamteindruck & Bemerkungen</h3>
      <div class="gesamttext">${auswertung.gesamtnote}</div>
    </div>`;
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #000; background: #fff; }
  h1 { font-size: 13pt; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 6px; }
  h3 { font-size: 10pt; margin: 12px 0 6px; }
  .kopfzeile { margin-bottom: 12px; }
  .meta-tabelle { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  .meta-tabelle td { padding: 3px 6px; border: 1px solid #ccc; }
  .kategorie { margin-bottom: 10px; break-inside: avoid; }
  .kategorie-header { background: #333; color: #fff; padding: 4px 8px; font-weight: bold; font-size: 9pt; }
  .gewichtung { float: right; font-weight: normal; font-size: 8pt; }
  .bewertungs-tabelle { width: 100%; border-collapse: collapse; font-size: 8pt; }
  .bewertungs-tabelle th { background: #f0f0f0; padding: 3px 4px; border: 1px solid #ccc; text-align: center; font-size: 8pt; }
  .bewertungs-tabelle td { padding: 3px 4px; border: 1px solid #ccc; vertical-align: top; }
  .kriterium-col { width: 35%; }
  .note-col { width: 5%; text-align: center; }
  .notiz-col { width: 25%; font-size: 7.5pt; }
  .center { text-align: center; }
  .notenberechnung { margin-top: 12px; break-inside: avoid; border: 2px solid #333; padding: 8px; }
  .noten-tabelle { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 6px; }
  .noten-tabelle th { background: #333; color: #fff; padding: 4px 6px; text-align: center; border: 1px solid #555; }
  .noten-tabelle td { padding: 5px 6px; border: 1px solid #ccc; }
  .note-gross { font-size: 14pt; }
  .bewertungsrichtlinie { font-size: 7pt; margin-top: 6px; color: #555; }
  .gesamteindruck { margin-top: 12px; break-inside: avoid; }
  .gesamttext { border: 1px solid #ccc; padding: 8px; min-height: 60px; font-size: 8.5pt; white-space: pre-wrap; }
  .ki-seite { page-break-before: always; }
  .ki-seite h2 { font-size: 12pt; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .ki-inhalt { font-size: 9pt; line-height: 1.5; white-space: pre-wrap; }
  .drucken-btn { position: fixed; top: 12px; right: 12px; background: #333; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 10pt; z-index: 999; }
  @media print { .drucken-btn { display: none; } body { font-size: 8.5pt; } }
`;

export function erstelleDruckHTML(probe, auswertung, kiText) {
  const istFahrstunde = probe.typ === 'fahrstunde';
  const kriterien = istFahrstunde ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;

  const kiSeite = kiText ? `
    <div class="ki-seite">
      <h2>KI-gestützte Analyse – ${probe.thema}</h2>
      <p style="font-size:8pt;color:#666;margin-bottom:8px">Anwärter: ${probe.prüfling} · ${format(new Date(probe.datum), 'dd.MM.yyyy')}</p>
      <div class="ki-inhalt">${kiText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${istFahrstunde ? 'Fahrstunden-Auswertung' : 'Theorie-Auswertung'} – ${probe.prüfling}</title>
  <style>${CSS}</style>
</head>
<body>
  <button class="drucken-btn" onclick="window.print()">🖨️ Drucken / PDF</button>
  ${kopfzeileHtml(probe, auswertung, null)}
  ${bewertungstabelleHtml(auswertung, kriterien)}
  ${gesamteindruckHtml(auswertung)}
  ${kiSeite}
</body>
</html>`;
}

export default function DruckAnsicht({ probe }) {
  const [auswertung, setAuswertung] = useState(null);

  useEffect(() => {
    getAuswertungenForLehrprobe(probe.id).then(a => setAuswertung(a[0] || null));
  }, [probe.id]);

  const handleDrucken = () => {
    const html = erstelleDruckHTML(probe, auswertung, null);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return { handleDrucken, auswertung };
}
