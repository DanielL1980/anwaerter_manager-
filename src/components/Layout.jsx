import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { GraduationCap, Settings, LayoutDashboard, ClipboardList, Moon, Sun } from 'lucide-react';

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
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-lg no-print">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="bg-white/20 rounded-xl p-2 group-hover:bg-white/30 transition">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">MKL Auswerteapp</h1>
              <p className="text-indigo-200 text-xs">Fahrlehrerausbildung</p>
            </div>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-white/30' : 'hover:bg-white/20'}`}>
              <ClipboardList size={18} />
              <span className="hidden sm:inline">Auswertungen</span>
            </NavLink>
            <NavLink to="/dashboard"
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-white/30' : 'hover:bg-white/20'}`}>
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/einstellungen"
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-white/30' : 'hover:bg-white/20'}`}>
              <Settings size={18} />
              <span className="hidden sm:inline">Einstellungen</span>
            </NavLink>
            {/* Dark Mode Toggle */}
            <button onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/20 transition-all ml-1"
              title={darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Nutzer & Abmelden */}
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
