import { BEWERTUNGSKRITERIEN } from '../data/kriterien';

/**
 * Berechnet die durchschnittliche Punktzahl für jede Kategorie.
 * @param {object} auswertung - Das Auswertungsobjekt aus der Datenbank.
 * @returns {object} Ein Objekt mit den Durchschnittswerten für jede Kategorie, z.B. { sachkompetenz: 4.5, ... }
 */
export function berechneKategorieDurchschnitte(auswertung) {
  const ergebnisse = {};

  // Gehe durch jede Hauptkategorie (Sachkompetenz, etc.)
  BEWERTUNGSKRITERIEN.forEach(kategorie => {
    let gesamtpunkte = 0;
    let anzahlBewertungen = 0;

    // Gehe durch jeden Unterpunkt in dieser Kategorie
    kategorie.punkte.forEach(punkt => {
      const kriteriumId = `${kategorie.id}_${punkt.id}`;
      const bewertung = auswertung?.punkte?.[kriteriumId];

      // Wenn für diesen Punkt eine Bewertung existiert...
      if (bewertung) {
        gesamtpunkte += bewertung; // ...addiere die Punkte...
        anzahlBewertungen++;      // ...und zähle die bewertete Frage.
      }
    });

    // Berechne den Durchschnitt, aber nur wenn mindestens ein Punkt bewertet wurde.
    if (anzahlBewertungen > 0) {
      const durchschnitt = gesamtpunkte / anzahlBewertungen;
      ergebnisse[kategorie.id] = parseFloat(durchschnitt.toFixed(2)); // Runde auf 2 Nachkommastellen
    } else {
      ergebnisse[kategorie.id] = null; // Kein Ergebnis, wenn nichts bewertet wurde
    }
  });

  return ergebnisse;
}
