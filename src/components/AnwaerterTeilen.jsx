import { useState, useEffect } from 'react';
import { Share2, X, Copy, Check, Clock, Printer, Link } from 'lucide-react';
import { erstelleEinladungslink, getAuswertungenForLehrprobe } from '../lib/db';
import { erstelleDruckHTML } from './DruckAnsicht';
import { berechneKategorieDurchschnitte, berechneGewichteteNote } from '../lib/berechnungen';
import { KRITERIEN_FAHRSTUNDE, KRITERIEN_THEORIE } from '../data/kriterien';

function AnwaerterTeilen({ lehrprobeId, anwaerterName, probe }) {
  const [offen, setOffen] = useState(false);
  const [link, setLink] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [fehler, setFehler] = useState('');
  const [auswertung, setAuswertung] = useState(null);

  useEffect(() => {
    if (probe) {
      getAuswertungenForLehrprobe(lehrprobeId).then(a => setAuswertung(a[0] || null));
    }
  }, [lehrprobeId]);

  const handleLinkErstellen = async () => {
    setLaedt(true);
    setFehler('');
    try {
      const url = await erstelleEinladungslink(lehrprobeId);
      setLink(url);
    } catch (e) {
      setFehler('Fehler beim Erstellen des Links: ' + e.message);
    }
    setLaedt(false);
  };

  const handleLinkKopieren = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    }
  };

  const handleDrucken = () => {
    if (!probe) return;
    const html = erstelleDruckHTML(probe, auswertung, null);
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const handleZwischenablage = async () => {
    if (!probe || !auswertung) return;
    const istFahrstunde = probe.typ === 'fahrstunde';
    const kriterien = istFahrstunde ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;
    const SKALA = { 5: '++', 4: '+', 3: 'o', 2: '-', 1: '--' };
    const noteErgebnis = berechneGewichteteNote(auswertung);

    let html = `<html><body>`;
    html += `<h1 style="font-size:16pt;text-align:center;border-bottom:2px solid #000;padding-bottom:6px">${istFahrstunde ? 'Auswertebogen Fahrstunden' : 'Auswertebogen Theoretischer Unterricht'}</h1>`;
    html += `<table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:12px">`;
    html += `<tr><td><b>Anwärter:</b> ${probe.prüfling}</td><td><b>Thema:</b> ${probe.thema}</td></tr>`;
    html += `<tr><td><b>Datum:</b> ${probe.datum}</td><td><b>Ausbildungsstufe:</b> ${probe.stufe || '–'}</td></tr>`;
    if (probe.zeitVon) {
      html += `<tr><td><b>Geplante Zeit:</b> ${probe.zeitVon} – ${probe.zeitBis} Uhr</td>`;
      html += probe.zeitTatsaechlichVon ? `<td><b>Tatsächlich:</b> ${probe.zeitTatsaechlichVon} – ${probe.zeitTatsaechlichBis} Uhr</td></tr>` : `<td></td></tr>`;
    }
    html += `</table>`;

    kriterien.forEach(kategorie => {
      html += `<h2 style="font-size:11pt;background:#333;color:#fff;padding:4px 8px;margin-top:10px">${kategorie.titel}</h2>`;
      html += `<table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:9pt">`;
      html += `<tr style="background:#f0f0f0"><th style="width:40%;text-align:left">Kriterium</th><th>++</th><th>+</th><th>o</th><th>-</th><th>--</th><th style="text-align:left">Notizen</th></tr>`;
      kategorie.punkte.forEach(punkt => {
        const id = `${kategorie.id}_${punkt.id}`;
        const bew = auswertung?.punkte?.[id];
        const notiz = auswertung?.notizen?.[id] || '';
        html += `<tr><td>${punkt.text}</td>`;
        [5,4,3,2,1].forEach(v => { html += `<td style="text-align:center">${bew === v ? '●' : '○'}</td>`; });
        html += `<td>${notiz}</td></tr>`;
      });
      html += `</table>`;
    });

    if (noteErgebnis) {
      html += `<p style="margin-top:12px"><b>Gewichteter Index:</b> ${noteErgebnis.index} &nbsp;|&nbsp; <b>Note:</b> ${noteErgebnis.note}</p>`;
    }
    if (auswertung?.gesamtnote) {
      html += `<h2 style="font-size:11pt;margin-top:14px">Gesamteindruck</h2><div style="border:1px solid #ccc;padding:8px">${auswertung.gesamtnote}</div>`;
    }
    html += `</body></html>`;

    try {
      const blob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
      setKopiert('zwischenablage');
      setTimeout(() => setKopiert(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = html.replace(/<[^>]+>/g, '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setKopiert('zwischenablage');
      setTimeout(() => setKopiert(false), 3000);
    }
  };

  return (
    <>
      <button onClick={() => setOffen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm font-medium">
        <Share2 size={16} />
        <span className="hidden sm:inline">Teilen</span>
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOffen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold">Teilen & Drucken</h3>
                <p className="text-indigo-200 text-sm">{anwaerterName}</p>
              </div>
              <button onClick={() => setOffen(false)} className="text-white/70 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">

              {/* Drucken */}
              <button onClick={handleDrucken}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition text-left">
                <span className="text-2xl">🖨️</span>
                <div>
                  <p className="font-bold text-slate-800">Drucken / PDF</p>
                  <p className="text-xs text-slate-500">Öffnet sauberes A4-Layout in neuem Tab</p>
                </div>
              </button>

              {/* Zwischenablage */}
              <button onClick={handleZwischenablage}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${kopiert === 'zwischenablage' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                <span className="text-2xl">{kopiert === 'zwischenablage' ? '✅' : '📋'}</span>
                <div>
                  <p className="font-bold text-slate-800">{kopiert === 'zwischenablage' ? 'Kopiert!' : 'In Zwischenablage'}</p>
                  <p className="text-xs text-slate-500">Für Google Docs – long-press → Einfügen</p>
                </div>
              </button>

              {/* Trennlinie */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">KOLLEGEN EINLADEN</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Einladungslink */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-800">
                <p className="font-semibold mb-1">Schreibzugriff teilen</p>
                <p className="text-xs">Kollege bekommt Zugriff auf diesen Anwärter und alle Auswertungen.</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <Clock size={14} className="text-amber-500 flex-shrink-0" />
                <span>Einladungslink ist <b>7 Tage</b> gültig</span>
              </div>

              {!link ? (
                <button onClick={handleLinkErstellen} disabled={laedt}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition text-left">
                  <span className="text-2xl">{laedt ? '⏳' : '🔗'}</span>
                  <div>
                    <p className="font-bold text-slate-800">{laedt ? 'Wird erstellt...' : 'Einladungslink erstellen'}</p>
                    <p className="text-xs text-slate-500">Per WhatsApp, E-Mail oder SMS teilen</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Einladungslink:</p>
                    <p className="text-xs text-slate-700 break-all font-mono">{link}</p>
                  </div>
                  <button onClick={handleLinkKopieren}
                    className={`w-full py-3 rounded-xl font-bold transition active:scale-95 flex items-center justify-center gap-2 ${kopiert === true ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
                    {kopiert === true ? <Check size={18} /> : <Copy size={18} />}
                    {kopiert === true ? 'Link kopiert!' : 'Link kopieren'}
                  </button>
                  <button onClick={() => setLink('')}
                    className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
                    Neuen Link erstellen
                  </button>
                </div>
              )}

              {fehler && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{fehler}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AnwaerterTeilen;
