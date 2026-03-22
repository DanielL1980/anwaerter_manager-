import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- NEU
import { getEinstellung, setEinstellung } from '../lib/db';
import { Save, Eye, EyeOff } from 'lucide-react';

function Einstellungen() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const navigate = useNavigate(); // <-- NEU

  useEffect(() => {
    const loadKey = async () => {
      const gespeicherterKey = await getEinstellung('apiKey');
      if (gespeicherterKey) {
        setApiKey(gespeicherterKey);
      }
    };
    loadKey();
  }, []);

  const handleSave = async () => {
    await setEinstellung('apiKey', apiKey);
    setStatusMsg('API-Schlüssel erfolgreich gespeichert! Leite weiter...');
    // Nach 2 Sekunden zur Startseite weiterleiten
    setTimeout(() => {
      navigate('/');
    }, 2000); // <-- NEU
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 mb-6">Einstellungen</h2>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-slate-800">Anthropic API Schlüssel (Claude)</h3>
        <p className="text-sm text-slate-600 mt-1 mb-4">
          Dein Schlüssel wird benötigt, um die KI-Zusammenfassungen zu generieren. Er wird nur sicher und lokal in deinem Browser gespeichert.
          Du kannst einen API-Schlüssel unter <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">console.anthropic.com</a> erstellen.
        </p>

        <div className="flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-... (Anthropic API-Schlüssel)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            onClick={() => setShowApiKey(!showApiKey)} 
            className="btn btn-secondary px-3"
            aria-label="API-Schlüssel anzeigen/verbergen"
          >
            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="mt-4 flex justify-between items-center">
          {statusMsg && (
            <p className="text-green-600 font-semibold text-sm">{statusMsg}</p>
          )}
          <button onClick={handleSave} className="btn btn-primary ml-auto">
            <Save size={20} />
            <span>Speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Einstellungen;
