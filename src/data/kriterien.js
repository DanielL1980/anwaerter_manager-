// Kriterien für theoretischen Unterricht
export const KRITERIEN_THEORIE = [
  {
    id: 'didaktik',
    titel: 'Didaktik & Methodik',
    gewichtung: 3,
    punkte: [
      { id: 'einstieg', text: 'Einstieg, Motivation, Betroffenheit' },
      { id: 'lernziel', text: 'Lernziel (kognitiv/affektiv) genannt und erreicht' },
      { id: 'gliederung', text: 'Thema, Zeit, Ziel, Quellen, Gliederung in Einleitung' },
      { id: 'medieneinsatz', text: 'Medieneinsatz sinnvoll (Tafel, Flipchart, ActivBoard, PowerPoint, Modell, Film, Handout)' },
      { id: 'zusammenhang', text: 'Ganzheitlicher Zusammenhang (Anknüpfung, Ausblick, Praxisbezug, Folgerungen, § 1 FschAusbO)' },
      { id: 'roter_faden', text: 'Erkennbarer „Roter Faden" und Struktur' },
      { id: 'erfolgskontrolle', text: 'Erfolgskontrolle geplant und auf Zielhöhe geprüft' },
    ],
  },
  {
    id: 'aktivierung',
    titel: 'Aktivierung & Atmosphäre',
    gewichtung: 1,
    punkte: [
      { id: 'aktivierung_lt', text: 'Aktivierung der Lernenden (Fragen, Impulse, Beteiligung)' },
      { id: 'atmosphaere', text: 'Lernatmosphäre und Gruppenklima' },
      { id: 'eingehen', text: 'Eingehen auf Fragen und Beiträge der Lernenden' },
    ],
  },
  {
    id: 'ausbilderverhalten',
    titel: 'Ausbilderverhalten',
    gewichtung: 1,
    punkte: [
      { id: 'fachkompetenz', text: 'Fachkompetenz, Stoffbeherrschung, Fachterminologie, Glaubwürdigkeit' },
      { id: 'sprache', text: 'Sprache & Vortragstechnik (Dialekt, Modulation, Verständlichkeit, Klarheit)' },
      { id: 'koerpersprache', text: 'Körpersprache (Mimik, Gestik), Stimmführung' },
      { id: 'floskeln', text: 'Keine übermäßigen Floskeln, klarer Ausdruck' },
      { id: 'paed_kompetenz', text: 'Pädagogische Kompetenz, AGVA, Primat der Didaktik' },
    ],
  },
];

// Kriterien für Fahrstunden (praktische Ausbildung)
export const KRITERIEN_FAHRSTUNDE = [
  {
    id: 'einleitung_fahrt',
    titel: 'Einleitung der Fahrstunde',
    gewichtung: 1,
    punkte: [
      { id: 'aufzeichnungsblatt', text: 'Aufzeichnungsblatt genutzt und in Einleitung integriert' },
      { id: 'ausbildungsstand', text: 'Ausbildungsstand des FS ermittelt und angesprochen' },
      { id: 'lernziel_fahrt', text: 'Lernziel angesprochen' },
      { id: 'schwerpunkt', text: 'Schwerpunkt der Stunde angesprochen' },
      { id: 'theoriebezug', text: 'Verknüpfung zur theoretischen Ausbildung angesprochen' },
      { id: 'ausbildungsstrecke', text: 'Ausbildungsstrecke angesprochen (i.g.O. / a.g.O.)' },
      { id: 'paragraph1', text: '§ 1 FschAusbO – sicheres, verantwortungsvolles, umweltbewusstes Fahren angesprochen' },
      { id: 'folgerungen', text: 'Folgerungen für den FS bei Abweichung von der Norm angesprochen' },
    ],
  },
  {
    id: 'didaktik_fahrt',
    titel: 'Didaktische Konzeption (AGVA)',
    gewichtung: 2,
    punkte: [
      { id: 'auswahl', text: 'A – Auswahl der Fahraufgaben geeignet und stufengerecht' },
      { id: 'gewichtung', text: 'G – Gewichtung der Ausbildungsinhalte angemessen' },
      { id: 'vereinfachung', text: 'V – Vereinfachung (abnehmende Hilfe erkennbar)' },
      { id: 'anordnung', text: 'A – Anordnung/Reihenfolge der Fahraufgaben sinnvoll' },
      { id: 'lernrhythmus', text: 'Lernrhythmus: Belastung/Erholung berücksichtigt' },
      { id: 'zielgruppenanalyse', text: 'Zielgruppenanalyse (Ausbildungsstand, Über-/Unterforderung berücksichtigt)' },
      { id: 'strecke', text: 'Streckenwahl geeignet, Zeitmanagement eingehalten' },
    ],
  },
  {
    id: 'sicherheit',
    titel: 'Sicherheit & Verkehrsregeln',
    gewichtung: 2,
    punkte: [
      { id: 'vorausschauend', text: 'Erziehung zur vorausschauenden und energiesparenden Fahrweise' },
      { id: 'gefahrenlehre', text: 'Gefahrenlehre angesprochen' },
      { id: 'sipo', text: 'Sicherheitsposition (vollständige Einweisung / leichte Mängel / schwere Mängel)' },
      { id: 'eingriffe', text: 'Eingriffe notwendig und angemessen (Doppelpedale, Lenkrad)' },
      { id: 'stresswahrnehmung', text: 'Stresswahrnehmung beim FS – geeignete Lösungen angewandt' },
      { id: 'verkehrsschwache', text: 'Berücksichtigung verkehrsschwacher Personen angesprochen' },
    ],
  },
  {
    id: 'kommunikation_fahrt',
    titel: 'Kommunikation & Ausbilderverhalten',
    gewichtung: 1,
    punkte: [
      { id: 'anweisungen', text: 'Anweisungen klar, verständlich, rechtzeitig, angemessene Häufigkeit' },
      { id: 'instruktionssprache', text: 'Instruktionssprache korrekt (kurze Sätze, Verben, Wichtiges vorweg)' },
      { id: 'kontakt_fs', text: 'Kontakt zum Fahrschüler – partnerschaftlich, dialogisch, freundlich' },
      { id: 'fachkompetenz_fahrt', text: 'Fachkompetenz, Fachterminologie, Glaubwürdigkeit' },
      { id: 'koerpersprache_fahrt', text: 'Mimik, Gestik, Stimmführung, verbaler Ausdruck, keine Floskeln' },
    ],
  },
  {
    id: 'abschluss_fahrt',
    titel: 'Abschlussbesprechung & Reflexion',
    gewichtung: 1,
    punkte: [
      { id: 'ziel_erreicht', text: 'Ausbildungsziel(e) erreicht / nicht erreicht – begründet' },
      { id: 'selbsteinschaetzung', text: 'Fahrschüler-Selbsteinschätzung eingeholt' },
      { id: 'wesentliches', text: 'Wesentliche Beobachtungen angesprochen (nicht gesamte Stunde wiederholt)' },
      { id: 'motivation_ab', text: 'Fahrschüler motiviert / nicht demotiviert' },
      { id: 'ausblick_fahrt', text: 'Ausblick auf die nächste Ausbildungsstunde gegeben' },
      { id: 'aufzeichnungsblatt_ab', text: 'Eintrag im Aufzeichnungsblatt erläutert (Lernfortschritt, Fehler, Lob, Kritik)' },
      { id: 'selbstreflexion', text: 'MKL-Selbstreflexion: „Ging der Plan auf?" – Probleme/Mängel erkannt (Dreiklang)' },
    ],
  },
];

// Rückwärtskompatibilität – alte Komponenten nutzen noch BEWERTUNGSKRITERIEN
export const BEWERTUNGSKRITERIEN = KRITERIEN_THEORIE;
