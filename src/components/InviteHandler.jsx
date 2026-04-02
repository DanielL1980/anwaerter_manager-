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
        setTimeout(() => navigate('/'), 2500);
      } catch (e) {
        console.error(e);
        setStatus('fehler');
      }
    };
    verarbeite();
  }, [token]);

  const config = {
    laden:    { emoji: '⏳', text: 'Einladung wird geprüft...', farbe: 'text-slate-600' },
    login:    { emoji: '🔐', text: 'Bitte zuerst anmelden.', farbe: 'text-amber-600' },
    ungueltig:{ emoji: '❌', text: 'Einladungslink ungültig oder abgelaufen.', farbe: 'text-red-600' },
    erfolg:   { emoji: '✅', text: 'Zugriff gewährt! Du wirst weitergeleitet...', farbe: 'text-emerald-600' },
    fehler:   { emoji: '⚠️', text: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.', farbe: 'text-red-600' },
  };

  const c = config[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">{c.emoji}</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Einladung</h2>
        <p className={`text-base font-medium ${c.farbe}`}>{c.text}</p>
        {status === 'login' && (
          <p className="text-sm text-slate-500 mt-3">Melde dich mit deinem Google-Konto an und öffne den Link erneut.</p>
        )}
        {status === 'erfolg' && (
          <p className="text-sm text-slate-400 mt-3">Du hast jetzt Zugriff auf den geteilten Anwärter.</p>
        )}
      </div>
    </div>
  );
}

export default InviteHandler;
