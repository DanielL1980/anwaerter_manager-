import { Outlet, NavLink } from 'react-router-dom';
import { GraduationCap, Settings } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-lg no-print">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="bg-white/20 rounded-xl p-2 group-hover:bg-white/30 transition">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Lehrprobe Auswerter</h1>
              <p className="text-indigo-200 text-xs">Fahrlehrerausbildung</p>
            </div>
          </NavLink>
          <nav>
            <NavLink
              to="/einstellungen"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                  isActive ? 'bg-white/30' : 'hover:bg-white/20'
                }`
              }
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Einstellungen</span>
            </NavLink>
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
