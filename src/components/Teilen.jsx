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
