import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEinstellung, setEinstellung, exportiereAllesDaten, importiereDaten } from '../lib/db';
import { Save, Eye, EyeOff, Key, CheckCircle, Download, Upload, AlertTriangle, Database, Share2, ChevronDown } from 'lucide-react';
import { getEinstellung as getEin, setEinstellung as setEin } from '../lib/db';


function EmailEinstellung() {
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { getEin('emailAdresse').then(v => v && setEmail(v)); }, []);
  const save = async () => { await setEin('emailAdresse', email); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="flex gap-2">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="deine@email.de" className="input-field" />
      <button onClick={save} className="btn btn-primary px-3 flex-shrink-0">
        {saved ? <CheckCircle size={18} /> : <Save size={18} />}
      </button>
    </div>
  );
}

function CloudEinstellung({ titel, emoji, clientIdKey, tokenKey, anleitung }) {
  const [clientId, setClientId] = useState('');
  const [anleitungOffen, setAnleitungOffen] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { getEin(clientIdKey).then(v => v && setClientId(v)); }, [clientIdKey]);
  const save = async () => { await setEin(clientIdKey, clientId); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const reset = async () => { await setEin(tokenKey, ''); alert('Token zurückgesetzt. Beim nächsten Teilen erneut anmelden.'); };
  return (
    <div>
      <h4 className="font-semibold text-slate-700 mb-1">{emoji} {titel}</h4>
      <button onClick={() => setAnleitungOffen(!anleitungOffen)}
        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mb-2">
        <ChevronDown size={13} className={anleitungOffen ? 'rotate-180 transition' : 'transition'} />
        Einrichtungs-Anleitung
      </button>
      {anleitungOffen && (
        <ol className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 mb-3 space-y-1 list-decimal list-inside">
          {anleitung.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
      <div className="flex gap-2">
        <input type="text" value={clientId} onChange={e => setClientId(e.target.value)}
          placeholder="Client-ID eintragen..." className="input-field text-sm" />
        <button onClick={save} className="btn btn-primary px-3 flex-shrink-0">
          {saved ? <CheckCircle size={18} /> : <Save size={18} />}
        </button>
      </div>
      <button onClick={reset} className="text-xs text-slate-400 hover:text-red-500 mt-1 transition">
        Anmeldung zurücksetzen
      </button>
    </div>
  );
}

function Einstellungen() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [bestaetigung, setBestaetigung] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadKey = async () => {
      const gespeicherterKey = await getEinstellung('apiKey');
      if (gespeicherterKey) setApiKey(gespeicherterKey);
    };
    loadKey();
  }, []);

  const handleSave = async () => {
    await setEinstellung('apiKey', apiKey);
    setSaved(true);
    setTimeout(() => navigate('/'), 2000);
  };

  const handleExport = async () => {
    try {
      const daten = await exportiereAllesDaten();
      const json = JSON.stringify(daten, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const datum = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `lehrprobe-backup-${datum}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('Backup erfolgreich heruntergeladen!');
      setTimeout(() => setBackupStatus(''), 3000);
    } catch (e) {
      setBackupStatus('Fehler beim Export: ' + e.message);
    }
  };

  const handleImportDatei = (e) => {
    const datei = e.target.files[0];
    if (!datei) return;
    setRestoreError('');
    setRestoreStatus('');
    setBestaetigung(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const backup = JSON.parse(evt.target.result);
        if (!backup.lehrproben) throw new Error('Ungültige Backup-Datei');

        if (bestaetigung) {
          await importiereDaten(backup);
          setRestoreStatus(`✓ ${backup.lehrproben.length} Auswertungen erfolgreich importiert!`);
          setBestaetigung(false);
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (err) {
        setRestoreError('Fehler beim Import: ' + err.message);
        setBestaetigung(false);
      }
    };
    reader.readAsText(datei);
  };

  const handleImportKlick = () => {
    if (window.confirm('Achtung: Beim Import werden bestehende Daten mit den Backup-Daten überschrieben. Fortfahren?')) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Einstellungen</h2>
        <p className="text-slate-500">API-Schlüssel, Backup und App-Konfiguration</p>
      </div>

      {/* API-Key */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2"><Key size={20} /></div>
            <div>
              <h3 className="font-bold text-lg">Google AI API Schlüssel</h3>
              <p className="text-indigo-200 text-sm">Für die KI-gestützte Analyse</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Deinen kostenlosen Schlüssel bekommst du unter{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-medium">
              aistudio.google.com/apikey
            </a>. Er wird nur lokal in deinem Browser gespeichert.
          </p>
          <div className="flex gap-2">
            <input type={showApiKey ? 'text' : 'password'} value={apiKey}
              onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." className="input-field" />
            <button onClick={() => setShowApiKey(!showApiKey)} className="btn btn-secondary px-3"
              aria-label="API-Schlüssel anzeigen/verbergen">
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-5 flex justify-between items-center">
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle size={18} /><span>Gespeichert! Weiterleitung...</span>
              </div>
            )}
            <button onClick={handleSave} className="btn btn-primary ml-auto">
              <Save size={18} /><span>Speichern</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup / Restore */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2"><Database size={20} /></div>
            <div>
              <h3 className="font-bold text-lg">Datensicherung</h3>
              <p className="text-emerald-200 text-sm">Backup erstellen und wiederherstellen</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Alle Daten werden nur lokal in deinem Browser gespeichert. Erstelle regelmäßig ein Backup, damit keine Daten verloren gehen!
            </p>
          </div>

          {/* Export */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Backup erstellen</h4>
            <p className="text-sm text-slate-500 mb-3">Exportiert alle Auswertungen, Notizen und Einstellungen als JSON-Datei.</p>
            <button onClick={handleExport} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200">
              <Download size={18} /><span>Backup herunterladen</span>
            </button>
            {backupStatus && (
              <p className="text-emerald-600 text-sm mt-2 font-medium">{backupStatus}</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="font-semibold text-slate-700 mb-2">Backup wiederherstellen</h4>
            <p className="text-sm text-slate-500 mb-3">Importiert eine zuvor gespeicherte Backup-Datei. Bestehende Daten werden dabei überschrieben.</p>
            <button onClick={handleImportKlick}
              className="btn bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 focus:ring-slate-400 shadow-sm">
              <Upload size={18} /><span>Backup importieren</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportDatei} className="hidden" />
            {restoreStatus && <p className="text-emerald-600 text-sm mt-2 font-medium">{restoreStatus}</p>}
            {restoreError && <p className="text-red-500 text-sm mt-2">{restoreError}</p>}
          </div>
        </div>
      </div>

      {/* Teilen & Cloud-Dienste */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2"><Share2 size={20} /></div>
            <div>
              <h3 className="font-bold text-lg">Teilen & Cloud-Dienste</h3>
              <p className="text-violet-200 text-sm">E-Mail und Cloud für den Auswertungs-Export</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">

          {/* E-Mail */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-1">Standard-E-Mail-Adresse</h4>
            <p className="text-sm text-slate-500 mb-2">Wird als Empfänger beim E-Mail-Versand vorausgefüllt.</p>
            <EmailEinstellung />
          </div>

          <hr className="border-slate-100" />

          {/* Google Drive */}
          <CloudEinstellung
            titel="Google Drive"
            emoji="🟦"
            clientIdKey="googleClientId"
            tokenKey="googleAccessToken"
            anleitung={[
              "Gehe zu console.cloud.google.com",
              "Neues Projekt erstellen → 'APIs & Dienste' → 'OAuth 2.0-Client-IDs'",
              "Anwendungstyp: 'Webanwendung', autorisierte Weiterleitungs-URI: " + window.location.origin,
              "Client-ID hier eintragen",
              "Beim ersten Teilen wirst du zur Google-Anmeldung weitergeleitet",
            ]}
          />

          <hr className="border-slate-100" />

          {/* OneDrive */}
          <CloudEinstellung
            titel="Microsoft OneDrive"
            emoji="🔵"
            clientIdKey="onedriveClientId"
            tokenKey="onedriveAccessToken"
            anleitung={[
              "Gehe zu portal.azure.com → 'App-Registrierungen'",
              "Neue Registrierung → Weiterleitungs-URI: " + window.location.origin,
              "Unter 'API-Berechtigungen': Files.ReadWrite hinzufügen",
              "Application (Client) ID hier eintragen",
            ]}
          />

          <hr className="border-slate-100" />

          {/* Dropbox */}
          <CloudEinstellung
            titel="Dropbox"
            emoji="📦"
            clientIdKey="dropboxClientId"
            tokenKey="dropboxAccessToken"
            anleitung={[
              "Gehe zu dropbox.com/developers → 'Create App'",
              "Wähle 'Scoped access' → 'Full Dropbox'",
              "Unter 'OAuth 2' → Redirect URI: " + window.location.origin,
              "App Key (= Client ID) hier eintragen",
            ]}
          />

          <hr className="border-slate-100" />

          {/* MEGA */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-1">🔴 MEGA</h4>
            <p className="text-sm text-slate-500">
              MEGA benötigt keine Client-ID. Beim Teilen wird die Datei heruntergeladen und
              du wirst zu <a href="https://mega.io" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">mega.io</a> weitergeleitet
              zum manuellen Hochladen. 20 GB kostenlos.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Einstellungen;