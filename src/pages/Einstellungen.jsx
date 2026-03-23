import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEinstellung, setEinstellung } from '../lib/db';
import { Save, Eye, EyeOff, Key, CheckCircle } from 'lucide-react';

function Einstellungen() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
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

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Einstellungen</h2>
      <p className="text-slate-500 mb-8">API-Schlüssel und App-Konfiguration</p>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Key size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Google AI API Schlüssel</h3>
              <p className="text-indigo-200 text-sm">Für die KI-gestützte Analyse</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Deinen kostenlosen Schlüssel bekommst du unter{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-medium"
            >
              aistudio.google.com/apikey
            </a>
            . Er wird nur lokal in deinem Browser gespeichert.
          </p>

          <div className="flex gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="input-field"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="btn btn-secondary px-3"
              aria-label="API-Schlüssel anzeigen/verbergen"
            >
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="mt-5 flex justify-between items-center">
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle size={18} />
                <span>Gespeichert! Weiterleitung...</span>
              </div>
            )}
            <button onClick={handleSave} className="btn btn-primary ml-auto">
              <Save size={18} />
              <span>Speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Einstellungen;
