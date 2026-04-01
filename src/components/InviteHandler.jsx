import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEinladung, nimmEinladungAn } from '../lib/db';
import { auth } from '../lib/firebase';

function InviteHandler() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('laden');

  useEffect(() => {
    const verarbeite = async () => {
      if (!auth.currentUser) {
        setStatus('login');
        return;
      }
      try {
        const einladung = await getEinladung(token);
        if (!einladung) { setStatus('ungueltig'); return; }
        await nimmEinladungAn(token);
        setStatus('erfolg');
        setTimeout(() => navigate('/'), 2000);
      } catch (e) {
        setStatus('fehler');
      }
    };
    verarbeite();
  }, [token]);

  const meldungen = {
    laden: 'Einladung wird geprüft...',
    login: 'Bitte zuerst anmelden.',
    ungueltig: 'Einladungslink ungültig oder abgelaufen.',
    erfolg: '✓ Zugriff gewährt! Du wirst weitergeleitet...',
    fehler: 'Ein Fehler ist aufgetreten.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card p-8 text-center max-w-sm">
        <p className="text-lg font-medium text-slate-700">{meldungen[status]}</p>
      </div>
    </div>
  );
}

export default InviteHandler;
