import { KRITERIEN_THEORIE, KRITERIEN_FAHRSTUNDE } from '../data/kriterien';

function berechneKategorieDurchschnitteGeneric(auswertung, kriterien) {
  const ergebnisse = {};
  kriterien.forEach(kategorie => {
    let gesamtpunkte = 0;
    let anzahlBewertungen = 0;
    kategorie.punkte.forEach(punkt => {
      const kriteriumId = `${kategorie.id}_${punkt.id}`;
      const bewertung = auswertung?.punkte?.[kriteriumId];
      if (bewertung) { gesamtpunkte += bewertung; anzahlBewertungen++; }
    });
    ergebnisse[kategorie.id] = anzahlBewertungen > 0
      ? parseFloat((gesamtpunkte / anzahlBewertungen).toFixed(2))
      : null;
  });
  return ergebnisse;
}

export function berechneKategorieDurchschnitte(auswertung) {
  const typ = auswertung?.typ || 'theorie';
  const kriterien = typ === 'fahrstunde' ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;
  return berechneKategorieDurchschnitteGeneric(auswertung, kriterien);
}

export function berechneGewichteteNote(auswertung) {
  const typ = auswertung?.typ || 'theorie';
  const kriterien = typ === 'fahrstunde' ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;
  const durchschnitte = berechneKategorieDurchschnitteGeneric(auswertung, kriterien);

  let gewichteterGesamt = 0;
  let gesamtGewichtung = 0;

  kriterien.forEach(k => {
    const wert = durchschnitte[k.id];
    if (wert !== null) {
      // Umrechnung: 5 Punkte = Note 1, 1 Punkt = Note 5
      const note = 6 - wert;
      gewichteterGesamt += note * (k.gewichtung || 1);
      gesamtGewichtung += (k.gewichtung || 1);
    }
  });

  if (gesamtGewichtung === 0) return null;
  const index = parseFloat((gewichteterGesamt / gesamtGewichtung).toFixed(2));

  // Note aus Index
  let note = '–';
  if (index <= 1.5) note = '1,0';
  else if (index <= 1.85) note = '1,3';
  else if (index <= 2.15) note = '1,7';
  else if (index <= 2.5) note = '2,0';
  else if (index <= 2.85) note = '2,3';
  else if (index <= 3.15) note = '2,7';
  else if (index <= 3.5) note = '3,0';
  else if (index <= 3.85) note = '3,3';
  else if (index <= 4.15) note = '3,7';
  else if (index <= 4.5) note = '4,0';
  else if (index <= 4.85) note = '4,3';
  else if (index <= 5.15) note = '4,7';
  else if (index <= 5.5) note = '5,0';
  else if (index <= 5.85) note = '5,3';
  else if (index <= 6.15) note = '5,7';
  else note = '6,0';

  return { index, note };
}
