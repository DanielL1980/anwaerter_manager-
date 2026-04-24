import { useState, useEffect } from 'react';
import { Share2, X, Copy, Check, Clock, Shield, ShieldOff, Trash2, Users, ChevronLeft } from 'lucide-react';
import {
  erstelleEinladungslink,
  erstelleOrdnerEinladung,
  getOrdnerZugaenge,
  updateOrdnerZugang,
  deleteOrdnerZugang,
  getAuswertungenForLehrprobe,
  getEinstellung,
  setEinstellung
} from '../lib/db';
import { erstelleDruckHTML } from './DruckAnsicht';
import { berechneGewichteteNote, berechneKategorieDurchschnitte } from '../lib/berechnungen';
import { KRITERIEN_FAHRSTUNDE, KRITERIEN_THEORIE } from '../data/kriterien';

// =================== CLOUD UPLOAD FUNKTIONEN ===================
async function uploadGoogleDrive(htmlContent, dateiname, accessToken) {
  const metadata = { name: dateiname, mimeType: 'text/html' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([htmlContent], { type: 'text/html' }));
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Google Drive Fehler: ${res.status}`);
  const data = await res.json();
  return `https://drive.google.com/file/d/${data.id}/view`;
}

async function uploadOneDrive(htmlContent, dateiname, accessToken) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/LehrprobeAuswertungen/${dateiname}:/content`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'text/html' },
    body: htmlContent,
  });
  if (!res.ok) throw new Error(`OneDrive Fehler: ${res.status}`);
  const data = await res.json();
  return data.webUrl;
}

async function uploadDropbox(htmlContent, dateiname, accessToken) {
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path: `/LehrprobeAuswertungen/${dateiname}`, mode: 'overwrite' }),
    },
    body: htmlContent,
  });
  if (!res.ok) throw new Error(`Dropbox Fehler: ${res.status}`);
  return 'https://www.dropbox.com/home/LehrprobeAuswertungen';
}

const OAUTH_CONFIG = {
  google: {
    name: 'Google Drive', icon: '🟦',
    authUrl: (clientId) => `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0].split('#')[0])}&response_type=token&scope=https://www.googleapis.com/auth/drive.file`,
    tokenKey: 'googleAccessToken', clientIdKey: 'googleClientId',
  },
  onedrive: {
    name: 'OneDrive', icon: '🔵',
    authUrl: (clientId) => `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0].split('#')[0])}&response_type=token&scope=Files.ReadWrite`,
    tokenKey: 'onedriveAccessToken', clientIdKey: 'onedriveClientId',
  },
  dropbox: {
    name: 'Dropbox', icon: '📦',
    authUrl: (clientId) => `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0].split('#')[0])}&response_type=token`,
    tokenKey: 'dropboxAccessToken', clientIdKey: 'dropboxClientId',
  },
};

// =================== HAUPTKOMPONENTE ===================
function Teilen({ probe }) {
  const [offen, setOffen] = useState(false);
  const [ansicht, setAnsicht] = useState('haupt');
  const [status, setStatus] = useState('');
  const [fehler, setFehler] = useState('');
  const [laedt, setLaedt] = useState('');
  const [auswertung, setAuswertung] = useState(null);
  // Ordner-Teilen
  const [zugriffTyp, setZugriffTyp] = useState('schreiben');
  const [ordnerLink, setOrdnerLink] = useState('');
  const [einzelLink, setEinzelLink] = useState('');
  const [kopiert, setKopiert] = useState(false);
  const [zugaenge, setZugaenge] = useState([]);
  const [zugaengeLaedt, setZugaengeLaedt] = useState(false);

  useEffect(() => {
    getAuswertungenForLehrprobe(probe.id).then(a => setAuswertung(a[0] || null));
  }, [probe.id]);

  const oeffnen = () => {
    setOffen(true);
    setAnsicht('haupt');
    setStatus('');
    setFehler('');
    setOrdnerLink('');
    setEinzelLink('');
    setKopiert(false);
  };

  const zurueck = () => {
    setAnsicht('haupt');
    setFehler('');
    setOrdnerLink('');
    setEinzelLink('');
    setKopiert(false);
  };

  const dateiname = `Auswertung_${probe.prüfling.replace(/\s+/g, '_')}_${probe.datum}.html`;
  const getHTML = () => erstelleDruckHTML(probe, auswertung, null);

  // ── Ordner-Link erstellen ──────────────────────────────────
  const handleOrdnerLinkErstellen = async () => {
    setLaedt('ordner');
    setFehler('');
    try {
      const url = await erstelleOrdnerEinladung(probe.id, probe.prüfling, zugriffTyp);
      setOrdnerLink(url);
      setAnsicht('ordner-link');
    } catch (e) {
      setFehler('Fehler: ' + e.message);
    }
    setLaedt('');
  };

  // ── Einzelne Auswertung Link erstellen ────────────────────
  const handleEinzelLinkErstellen = async () => {
    setLaedt('einzeln');
    setFehler('');
    try {
      const url = await erstelleEinladungslink(probe.id);
      setEinzelLink(url);
    } catch (e) {
      setFehler('Fehler: ' + e.message);
    }
    setLaedt('');
  };

  const handleKopieren = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2500);
  };

  // ── Zugänge laden ─────────────────────────────────────────
  const ladeZugaenge = async () => {
    setZugaengeLaedt(true);
    try {
      const z = await getOrdnerZugaenge(probe.id);
      setZugaenge(z);
    } catch (e) { console.error(e); }
    setZugaengeLaedt(false);
  };

  const handleZugriffAendern = async (zugangId, neuerZugriff) => {
    await updateOrdnerZugang(zugangId, neuerZugriff);
    await ladeZugaenge();
  };

  const handleWiderrufen = async (zugangId) => {
    if (!window.confirm('Zugriff wirklich widerrufen?')) return;
    await deleteOrdnerZugang(zugangId);
    await ladeZugaenge();
  };

  // ── Zwischenablage ────────────────────────────────────────
  const handleZwischenablage = async () => {
    const istFahrstunde = probe.typ === 'fahrstunde';
    const kriterien = istFahrstunde ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;
    const noteErgebnis = auswertung ? berechneGewichteteNote(auswertung) : null;
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
    if (noteErgebnis) html += `<p style="margin-top:12px"><b>Gewichteter Index:</b> ${noteErgebnis.index} &nbsp;|&nbsp; <b>Note:</b> ${noteErgebnis.note}</p>`;
    if (auswertung?.gesamtnote) html += `<h2 style="font-size:11pt;margin-top:14px">Gesamteindruck</h2><div style="border:1px solid #ccc;padding:8px">${auswertung.gesamtnote}</div>`;
    html += `</body></html>`;
    try {
      const blob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
      setStatus('✓ Formatierter Text kopiert! Google Docs → Neu → long-press → Einfügen');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = html.replace(/<[^>]+>/g, '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setStatus('✓ Text kopiert. Google Docs → long-press → Einfügen');
    }
  };

  // ── Cloud Upload ──────────────────────────────────────────
  const handleCloud = async (dienst) => {
    setLaedt(dienst); setFehler(''); setStatus('');
    try {
      const config = OAUTH_CONFIG[dienst];
      const clientId = await getEinstellung(config.clientIdKey);
      let token = await getEinstellung(config.tokenKey);
      if (!clientId) { setFehler(`Kein Client-ID für ${config.name}. Bitte in Einstellungen konfigurieren.`); setLaedt(''); return; }
      if (!token) {
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          token = params.get('access_token');
          if (token) { await setEinstellung(config.tokenKey, token); window.location.hash = ''; }
        }
        if (!token) { sessionStorage.setItem('oauthDienst', dienst); window.location.href = config.authUrl(clientId); return; }
      }
      const html = getHTML();
      let url;
      if (dienst === 'google') url = await uploadGoogleDrive(html, dateiname, token);
      else if (dienst === 'onedrive') url = await uploadOneDrive(html, dateiname, token);
      else if (dienst === 'dropbox') url = await uploadDropbox(html, dateiname, token);
      setStatus('✓ Erfolgreich hochgeladen!');
      setTimeout(() => window.open(url, '_blank'), 500);
    } catch (e) {
      if (e.message.includes('401')) { const config = OAUTH_CONFIG[dienst]; await setEinstellung(config.tokenKey, ''); setFehler('Token abgelaufen. Bitte erneut anmelden.'); }
      else setFehler(`Fehler: ${e.message}`);
    }
    setLaedt('');
  };

  const handleMega = () => {
    const html = getHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = dateiname; a.click();
    setTimeout(() => window.open('https://mega.io', '_blank'), 500);
    setStatus('Datei heruntergeladen. Bitte in MEGA hochladen.');
  };

  const titelMap = {
    haupt: 'Teilen & Drucken',
    ordner: 'Ordner teilen',
    'ordner-link': 'Link erstellt',
    einzeln: 'Auswertung teilen',
    zugaenge: 'Zugänge verwalten',
  };

  return (
    <>
      <button onClick={oeffnen} className="btn btn-secondary flex items-center gap-2">
        <Share2 size={18} />
        <span className="hidden sm:inline">Teilen</span>
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOffen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ansicht !== 'haupt' && (
                  <button onClick={zurueck} className="text-white/70 hover:text-white transition mr-1">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <Share2 size={18} />
                  <h3 className="font-bold">{titelMap[ansicht]}</h3>
                </div>
              </div>
              <button onClick={() => setOffen(false)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">

              {/* ── HAUPT ──────────────────────────────────────────────── */}
              {ansicht === 'haupt' && (
                <>
                  {/* Drucken */}
                  <button onClick={() => { const b = new Blob([getHTML()], {type:'text/html'}); window.open(URL.createObjectURL(b), '_blank'); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition text-left">
                    <span className="text-2xl">🖨️</span>
                    <div><p className="font-bold text-slate-800">Drucken / PDF</p><p className="text-xs text-slate-500">Öffnet sauberes A4-Layout in neuem Tab</p></div>
                  </button>

                  {/* Zwischenablage */}
                  <button onClick={handleZwischenablage}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 transition text-left">
                    <span className="text-2xl">📋</span>
                    <div><p className="font-bold text-slate-800">In Zwischenablage kopieren</p><p className="text-xs text-slate-600">Google Docs → long-press → Einfügen</p></div>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">KOLLEGEN EINLADEN</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Ganzen Ordner teilen */}
                  <button onClick={() => setAnsicht('ordner')}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition text-left">
                    <span className="text-2xl">📁</span>
                    <div>
                      <p className="font-bold text-slate-800">Ganzen Ordner teilen</p>
                      <p className="text-xs text-slate-500">Alle Auswertungen von {probe.prüfling} – Lese- oder Schreibzugriff wählbar</p>
                    </div>
                  </button>

                  {/* Nur diese Auswertung */}
                  <button onClick={() => { setAnsicht('einzeln'); setEinzelLink(''); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-bold text-slate-800">Nur diese Auswertung teilen</p>
                      <p className="text-xs text-slate-500">Schreibzugriff auf diese Auswertung, 7 Tage gültig</p>
                    </div>
                  </button>

                  {/* Zugänge verwalten */}
                  <button onClick={() => { setAnsicht('zugaenge'); ladeZugaenge(); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left">
                    <Users size={22} className="text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Zugänge verwalten</p>
                      <p className="text-xs text-slate-500">Zugriff einschränken oder widerrufen</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">CLOUD & E-MAIL</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* E-Mail */}
                  <button onClick={async () => {
                    const emailKey = await getEinstellung('emailAdresse');
                    const betreff = encodeURIComponent(`Auswertung: ${probe.prüfling} – ${probe.thema}`);
                    const body = encodeURIComponent(`Auswertung vom ${probe.datum}\nAnwärter: ${probe.prüfling}\nThema: ${probe.thema}`);
                    window.open(`mailto:${emailKey || ''}?subject=${betreff}&body=${body}`, '_blank');
                  }} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left">
                    <span className="text-2xl">📧</span>
                    <div><p className="font-bold text-slate-800">Per E-Mail senden</p><p className="text-xs text-slate-500">Öffnet E-Mail-Client</p></div>
                  </button>

                  {/* Cloud-Dienste */}
                  {[
                    { id: 'google', label: 'Google Drive', emoji: '🟦', desc: '15 GB kostenlos' },
                    { id: 'onedrive', label: 'OneDrive', emoji: '🔵', desc: '5 GB kostenlos' },
                    { id: 'dropbox', label: 'Dropbox', emoji: '📦', desc: '2 GB kostenlos' },
                  ].map(d => (
                    <button key={d.id} onClick={() => handleCloud(d.id)} disabled={laedt === d.id}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-left">
                      <span className="text-2xl">{laedt === d.id ? '⟳' : d.emoji}</span>
                      <div><p className="font-bold text-slate-800">{d.label}</p><p className="text-xs text-slate-500">{d.desc}</p></div>
                    </button>
                  ))}

                  <button onClick={handleMega}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 transition text-left">
                    <span className="text-2xl">🔴</span>
                    <div><p className="font-bold text-slate-800">MEGA</p><p className="text-xs text-slate-500">20 GB kostenlos</p></div>
                  </button>

                  {status && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">{status}</div>}
                  {fehler && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{fehler}</div>}
                </>
              )}

              {/* ── ORDNER TEILEN ──────────────────────────────────────── */}
              {ansicht === 'ordner' && (
                <>
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                    <p className="text-sm font-semibold text-violet-800 mb-1">📁 Ordner: {probe.prüfling}</p>
                    <p className="text-xs text-violet-600">Der Kollege erhält Zugriff auf alle Auswertungen dieses Anwärters.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Zugriff wählen:</p>
                    <div className="flex gap-2">
                      <button onClick={() => setZugriffTyp('lesen')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition ${zugriffTyp === 'lesen' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <Shield size={16} /> Nur lesen
                      </button>
                      <button onClick={() => setZugriffTyp('schreiben')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition ${zugriffTyp === 'schreiben' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <ShieldOff size={16} /> Lesen & Schreiben
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <Clock size={14} className="text-amber-500 flex-shrink-0" />
                    <span>Einladungslink ist <b>7 Tage</b> gültig</span>
                  </div>
                  <button onClick={handleOrdnerLinkErstellen} disabled={laedt === 'ordner'}
                    className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition active:scale-95 disabled:opacity-60">
                    {laedt === 'ordner' ? '⏳ Wird erstellt...' : '🔗 Einladungslink erstellen'}
                  </button>
                  {fehler && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{fehler}</p>}
                </>
              )}

              {/* ── ORDNER-LINK ANZEIGEN ───────────────────────────────── */}
              {ansicht === 'ordner-link' && (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-sm font-semibold text-emerald-700 mb-1">✅ Link erstellt!</p>
                    <p className="text-xs text-emerald-600">{zugriffTyp === 'lesen' ? '👁 Nur lesen' : '✏️ Lesen & Schreiben'} · 7 Tage gültig</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Einladungslink:</p>
                    <p className="text-xs text-slate-700 break-all font-mono">{ordnerLink}</p>
                  </div>
                  <button onClick={() => handleKopieren(ordnerLink)}
                    className={`w-full py-3 rounded-xl font-bold transition active:scale-95 flex items-center justify-center gap-2 ${kopiert ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
                    {kopiert ? <Check size={18} /> : <Copy size={18} />}
                    {kopiert ? 'Link kopiert!' : 'Link kopieren'}
                  </button>
                </>
              )}

              {/* ── EINZELNE AUSWERTUNG ────────────────────────────────── */}
              {ansicht === 'einzeln' && (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">📄 Diese Auswertung teilen</p>
                    <p className="text-xs text-blue-600">Kollege erhält Schreibzugriff auf genau diese Auswertung.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <Clock size={14} className="text-amber-500 flex-shrink-0" />
                    <span>Einladungslink ist <b>7 Tage</b> gültig</span>
                  </div>
                  {!einzelLink ? (
                    <button onClick={handleEinzelLinkErstellen} disabled={laedt === 'einzeln'}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition active:scale-95 disabled:opacity-60">
                      {laedt === 'einzeln' ? '⏳ Wird erstellt...' : '🔗 Einladungslink erstellen'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Einladungslink:</p>
                        <p className="text-xs text-slate-700 break-all font-mono">{einzelLink}</p>
                      </div>
                      <button onClick={() => handleKopieren(einzelLink)}
                        className={`w-full py-3 rounded-xl font-bold transition active:scale-95 flex items-center justify-center gap-2 ${kopiert ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {kopiert ? <Check size={18} /> : <Copy size={18} />}
                        {kopiert ? 'Link kopiert!' : 'Link kopieren'}
                      </button>
                      <button onClick={() => setEinzelLink('')}
                        className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">
                        Neuen Link erstellen
                      </button>
                    </div>
                  )}
                  {fehler && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{fehler}</p>}
                </>
              )}

              {/* ── ZUGÄNGE VERWALTEN ──────────────────────────────────── */}
              {ansicht === 'zugaenge' && (
                <>
                  <p className="text-sm font-semibold text-slate-700">Aktive Zugänge für {probe.prüfling}:</p>
                  {zugaengeLaedt ? (
                    <p className="text-sm text-slate-400 text-center py-6">Lade Zugänge...</p>
                  ) : zugaenge.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                      <p className="text-sm text-slate-500">Noch keine aktiven Zugänge.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {zugaenge.map(z => (
                        <div key={z.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">Gast · {z.gastId?.slice(0, 8)}...</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {z.zugriff === 'lesen' ? '👁 Nur lesen' : '✏️ Lesen & Schreiben'}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handleZugriffAendern(z.id, z.zugriff === 'lesen' ? 'schreiben' : 'lesen')}
                              title={z.zugriff === 'lesen' ? 'Schreibzugriff erteilen' : 'Auf Lesezugriff einschränken'}
                              className="p-2 rounded-lg hover:bg-slate-200 transition text-slate-500">
                              {z.zugriff === 'lesen' ? <ShieldOff size={16} /> : <Shield size={16} />}
                            </button>
                            <button onClick={() => handleWiderrufen(z.id)}
                              title="Zugriff widerrufen"
                              className="p-2 rounded-lg hover:bg-red-100 transition text-red-400">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Teilen;
