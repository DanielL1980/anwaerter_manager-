import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Settings, Moon, Sun, Car } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

function Layout({ user, onSignOut }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 shadow-lg sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <Car size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">MKL Auswerteapp</h1>
              <p className="text-indigo-200 text-xs">Fahrlehrerausbildung</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/einstellungen"
              className={({ isActive }) => `flex items-center justify-center w-10 h-10 rounded-xl transition ${isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              <Settings size={18} />
            </NavLink>
            <button onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/20 transition text-white/70 hover:text-white"
              title={darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user && (
              <div className="flex items-center gap-2 ml-1">
                <img src={user.photoURL} alt={user.displayName}
                  className="w-8 h-8 rounded-full border-2 border-white/40 flex-shrink-0" />
                <button onClick={onSignOut}
                  className="text-xs text-white/70 hover:text-white px-2 py-1 rounded-lg hover:bg-white/20 transition hidden sm:block">
                  Abmelden
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
