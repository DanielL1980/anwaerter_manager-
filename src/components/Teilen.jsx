import { useState, useEffect } from 'react';
import { Share2, Mail, Cloud, X, ChevronDown, ExternalLink, Check } from 'lucide-react';
import { getEinstellung, setEinstellung, getAuswertungenForLehrprobe } from '../lib/db';
import { erstelleDruckHTML } from './DruckAnsicht';

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

async function uploadMega(htmlContent, dateiname) {
  // MEGA hat keine direkte Web-API ohne SDK – wir öffnen MEGA und zeigen Anweisung
  throw new Error('MEGA_MANUAL');
}

// =================== OAUTH KONFIGURATION ===================
const OAUTH_CONFIG = {
  google: {
    name: 'Google Drive',
    icon: '🟦',
    authUrl: (clientId) => `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0].split('#')[0])}&response_type=token&scope=https://www.googleapis.com/auth/drive.file`,
    tokenKey: 'googleAccessToken',
    clientIdKey: 'googleClientId',
  },
  onedrive: {
    name: 'OneDrive',
    icon: '🔵',
    authUrl: (clientId) => `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0].split('#')[0])}&response_type=token&scope=Files.ReadWrite`,
    tokenKey: 'onedriveAccessToken',
    clientIdKey: 'onedriveClientId',
  },
  dropbox: {
    name: 'Dropbox',
    icon: '📦',
    authUrl: (clientId) => `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.href.split('?')[0].split('#')[0])}&response_type=token`,
    tokenKey: 'dropboxAccessToken',
    clientIdKey: 'dropboxClientId',
  },
};

// =================== HAUPTKOMPONENTE ===================
function Teilen({ probe }) {
  const [offen, setOffen] = useState(false);
  const [status, setStatus] = useState('');
  const [fehler, setFehler] = useState('');
  const [laedt, setLaedt] = useState('');
  const [auswertung, setAuswertung] = useState(null);

  useEffect(() => {
    getAuswertungenForLehrprobe(probe.id).then(a => setAuswertung(a[0] || null));
  }, [probe.id]);

  const dateiname = `Auswertung_${probe.prüfling.replace(/\s+/g, '_')}_${probe.datum}.html`;

  const getHTML = () => erstelleDruckHTML(probe, auswertung, null);

  const handleZwischenablage = async () => {
    const istFahrstunde = probe.typ === 'fahrstunde';
    const { KRITERIEN_FAHRSTUNDE, KRITERIEN_THEORIE } = await import('../data/kriterien');
    const { berechneKategorieDurchschnitte, berechneGewichteteNote } = await import('../lib/berechnungen');
    const kriterien = istFahrstunde ? KRITERIEN_FAHRSTUNDE : KRITERIEN_THEORIE;
    const SKALA = { 5: '++', 4: '+', 3: 'o', 2: '-', 1: '--' };
    const SKALA_TEXT = { 5: 'Sehr Gut', 4: 'Gut', 3: 'Befriedigend', 2: 'Ausreichend', 1: 'Mangelhaft' };
    const noteErgebnis = auswertung ? berechneGewichteteNote(auswertung) : null;

    // Kopfzeile
    let html = `<html><body>`;
    html += `<h1 style="font-size:16pt;text-align:center;border-bottom:2px solid #000;padding-bottom:6px">`;
    html += `${istFahrstunde ? 'Auswertebogen Fahrstunden' : 'Auswertebogen Theoretischer Unterricht'}</h1>`;

    // Metadaten-Tabelle
    html += `<table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:12px">`;
    html += `<tr><td><b>Anwärter:</b> ${probe.prüfling}</td><td><b>Thema:</b> ${probe.thema}</td></tr>`;
    html += `<tr><td><b>Datum:</b> ${probe.datum}</td><td><b>${istFahrstunde ? 'Ausbildungsstufe' : 'Art'}:</b> ${probe.stufe || probe.unterrichtstyp || '–'}</td></tr>`;
    if (probe.zeitVon) {
      const geplantMin = (parseInt(probe.zeitBis.split(':')[0])*60+parseInt(probe.zeitBis.split(':')[1]))-(parseInt(probe.zeitVon.split(':')[0])*60+parseInt(probe.zeitVon.split(':')[1]));
      html += `<tr><td><b>Geplante Zeit:</b> ${probe.zeitVon} – ${probe.zeitBis} Uhr (${geplantMin} Min.)</td>`;
      if (probe.zeitTatsaechlichVon) {
        const tatsMin = (parseInt(probe.zeitTatsaechlichBis.split(':')[0])*60+parseInt(probe.zeitTatsaechlichBis.split(':')[1]))-(parseInt(probe.zeitTatsaechlichVon.split(':')[0])*60+parseInt(probe.zeitTatsaechlichVon.split(':')[1]));
        html += `<td><b>Tatsächliche Zeit:</b> ${probe.zeitTatsaechlichVon} – ${probe.zeitTatsaechlichBis} Uhr (${tatsMin} Min.)</td></tr>`;
      } else { html += `<td></td></tr>`; }
    }
    if (probe.ausbildungswoche) html += `<tr><td><b>Ausbildungswoche:</b> ${probe.ausbildungswoche}</td><td><b>Ausbildungsstunde:</b> ${probe.ausbildungsstunde || '–'}</td></tr>`;
    html += `</table>`;

    // Bewertungsbögen
    kriterien.forEach(kategorie => {
      html += `<h2 style="font-size:11pt;background:#333;color:#fff;padding:4px 8px;margin-top:10px">`;
      html += `${kategorie.titel}${kategorie.gewichtung > 1 ? ` (${kategorie.gewichtung}-fach gewichtet)` : ''}</h2>`;
      html += `<table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:9pt">`;
      html += `<tr style="background:#f0f0f0"><th style="width:40%;text-align:left">Kriterium</th><th style="width:8%">++</th><th style="width:8%">+</th><th style="width:8%">o</th><th style="width:8%">-</th><th style="width:8%">--</th><th style="width:20%;text-align:left">Notizen</th></tr>`;
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

    // Notenberechnung
    if (noteErgebnis) {
      html += `<h2 style="font-size:11pt;margin-top:14px">Notenberechnung</h2>`;
      html += `<table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:9pt">`;
      html += `<tr style="background:#333;color:#fff">`;
      kriterien.forEach(k => { html += `<th>${k.titel}<br/>(${k.gewichtung}-fach)</th>`; });
      html += `<th>Gew. Index</th><th>Note</th></tr><tr>`;
      const durchschnitte = berechneKategorieDurchschnitte(auswertung);
      kriterien.forEach(k => { html += `<td style="text-align:center">${durchschnitte[k.id]?.toFixed(2) || '–'}</td>`; });
      html += `<td style="text-align:center"><b>${noteErgebnis.index}</b></td>`;
      html += `<td style="text-align:center;font-size:14pt"><b>${noteErgebnis.note}</b></td></tr></table>`;
      html += `<p style="font-size:8pt;color:#666;margin-top:4px">sehr gut = 1,0; 1,3 | gut = 1,7; 2,0; 2,3 | befriedigend = 2,7; 3,0; 3,3 | ausreichend = 3,7; 4,0; 4,3 | mangelhaft = 4,7; 5,0; 5,3 | ungenügend = 5,7; 6,0</p>`;
    }

    // Gesamteindruck
    if (auswertung?.gesamtnote) {
      html += `<h2 style="font-size:11pt;margin-top:14px">Gesamteindruck & Bemerkungen</h2>`;
      html += `<div style="border:1px solid #ccc;padding:8px;font-size:9pt;white-space:pre-wrap">${auswertung.gesamtnote}</div>`;
    }

    html += `</body></html>`;

    try {
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([item]);
      setStatus('✓ Formatierter Text kopiert! Öffne Google Docs → Neu → long-press → Einfügen');
    } catch (e) {
      // Fallback: Plain Text
      const ta = document.createElement('textarea');
      ta.value = html.replace(/<[^>]+>/g, '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setStatus('✓ Text kopiert (einfaches Format). Öffne Google Docs → long-press → Einfügen');
    }
  };

  const handleEmail = async () => {
    const emailKey = await getEinstellung('emailAdresse');
    const betreff = encodeURIComponent(`Auswertung: ${probe.prüfling} – ${probe.thema}`);
    const body = encodeURIComponent(
      `Auswertung vom ${probe.datum}\nAnwärter: ${probe.prüfling}\nThema: ${probe.thema}\n\nDie vollständige Auswertung bitte über die App abrufen.`
    );
    const mailto = emailKey
      ? `mailto:${emailKey}?subject=${betreff}&body=${body}`
      : `mailto:?subject=${betreff}&body=${body}`;
    window.open(mailto, '_blank');
  };

  const handleCloud = async (dienst) => {
    setLaedt(dienst);
    setFehler('');
    setStatus('');
    try {
      const config = OAUTH_CONFIG[dienst];
      const tokenKey = config.tokenKey;
      const clientIdKey = config.clientIdKey;
      const clientId = await getEinstellung(clientIdKey);
      let token = await getEinstellung(tokenKey);

      if (!clientId) {
        setFehler(`Kein Client-ID für ${config.name} eingerichtet. Bitte in den Einstellungen konfigurieren.`);
        setLaedt('');
        return;
      }

      if (!token) {
        // Token aus URL-Hash lesen (nach OAuth-Redirect)
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          token = params.get('access_token');
          if (token) {
            await setEinstellung(tokenKey, token);
            window.location.hash = '';
          }
        }
        if (!token) {
          // Dienst merken und OAuth Flow starten
          sessionStorage.setItem('oauthDienst', dienst);
          window.location.href = config.authUrl(clientId);
          return;
        }
      }

      const html = getHTML();
      let url;

      if (dienst === 'google') url = await uploadGoogleDrive(html, dateiname, token);
      else if (dienst === 'onedrive') url = await uploadOneDrive(html, dateiname, token);
      else if (dienst === 'dropbox') url = await uploadDropbox(html, dateiname, token);

      setStatus(`✓ Erfolgreich hochgeladen!`);
      setTimeout(() => window.open(url, '_blank'), 500);
    } catch (e) {
      if (e.message === 'MEGA_MANUAL') {
        setStatus('MEGA: Bitte die Datei manuell hochladen – "Drucken als HTML" und dann in mega.io hochladen.');
      } else if (e.message.includes('401')) {
        // Token abgelaufen
        const config = OAUTH_CONFIG[dienst];
        await setEinstellung(config.tokenKey, '');
        setFehler(`Token abgelaufen. Bitte erneut anmelden.`);
      } else {
        setFehler(`Fehler: ${e.message}`);
      }
    }
    setLaedt('');
  };

  const handleMega = () => {
    const html = getHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dateiname;
    a.click();
    setTimeout(() => window.open('https://mega.io', '_blank'), 500);
    setStatus('Datei wurde heruntergeladen. Bitte in MEGA hochladen.');
  };

  return (
    <>
      <button onClick={() => setOffen(true)}
        className="btn btn-secondary flex items-center gap-2">
        <Share2 size={18} />
        <span className="hidden sm:inline">Teilen</span>
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOffen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">

            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 size={18} />
                <h3 className="font-bold">Auswertung teilen & drucken</h3>
              </div>
              <button onClick={() => setOffen(false)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Drucken */}
              <button onClick={() => { const html = getHTML(); const b = new Blob([html], {type:'text/html'}); window.open(URL.createObjectURL(b), '_blank'); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition text-left">
                <span className="text-2xl">🖨️</span>
                <div>
                  <p className="font-bold text-slate-800">Drucken / PDF</p>
                  <p className="text-xs text-slate-500">Öffnet sauberes A4-Layout in neuem Tab</p>
                </div>
              </button>

              {/* Zwischenablage */}
              <button onClick={handleZwischenablage}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 transition text-left">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-bold text-slate-800">In Zwischenablage kopieren</p>
                  <p className="text-xs text-slate-600">Text kopieren → Google Docs öffnen → Einfügen</p>
                </div>
              </button>

              {/* E-Mail */}
              <button onClick={handleEmail}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-bold text-slate-800">Per E-Mail senden</p>
                  <p className="text-xs text-slate-500">Öffnet deinen E-Mail-Client (Outlook, Gmail, etc.)</p>
                </div>
              </button>

              {/* Cloud-Dienste */}
              {[
                { id: 'google', label: 'Google Drive', emoji: '🟦', desc: '15 GB kostenlos' },
                { id: 'onedrive', label: 'Microsoft OneDrive', emoji: '🔵', desc: '5 GB kostenlos' },
                { id: 'dropbox', label: 'Dropbox', emoji: '📦', desc: '2 GB kostenlos' },
              ].map(d => (
                <button key={d.id} onClick={() => handleCloud(d.id)} disabled={laedt === d.id}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-left">
                  <span className="text-2xl">{laedt === d.id ? '⟳' : d.emoji}</span>
                  <div>
                    <p className="font-bold text-slate-800">{d.label}</p>
                    <p className="text-xs text-slate-500">{d.desc} · Als HTML-Datei hochladen</p>
                  </div>
                </button>
              ))}

              {/* MEGA */}
              <button onClick={handleMega}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 transition text-left">
                <span className="text-2xl">🔴</span>
                <div>
                  <p className="font-bold text-slate-800">MEGA</p>
                  <p className="text-xs text-slate-500">20 GB kostenlos · Datei herunterladen + in MEGA hochladen</p>
                </div>
              </button>

              {status && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                  {status}
                </div>
              )}
              {fehler && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {fehler}
                </div>
              )}

              <p className="text-xs text-slate-400 text-center pt-1">
                Cloud-Dienste in den <a href="/einstellungen" className="text-indigo-500 underline">Einstellungen</a> konfigurieren
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Teilen;
