import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      alert('Anmeldung fehlgeschlagen: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-4xl">📋</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Anwärterauswertung</h1>
        <p className="text-slate-500 text-sm mb-8">
          Digitales Werkzeug für die Fahrlehrerausbildung
        </p>
        <button onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span className="font-semibold text-slate-700">Mit Google anmelden</span>
        </button>
        <p className="text-xs text-slate-400 mt-6">
          Deine Daten sind nur für dich sichtbar und werden sicher in der Cloud gespeichert.
        </p>
      </div>
    </div>
  );
}

export default Login;
