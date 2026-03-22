import { Outlet, NavLink } from 'react-router-dom';
import { GraduationCap, Cog } from 'lucide-react';

function Layout() {
  const linkStyles = "flex items-center gap-2 p-2 rounded-md transition-colors";
  const activeLinkStyles = "bg-blue-700";
  const inactiveLinkStyles = "hover:bg-blue-500";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-600 text-white shadow-md no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <NavLink to="/" className="flex items-center gap-3">
            <GraduationCap size={28} />
            <h1 className="text-xl font-bold">Lehrprobe Auswerter</h1>
          </NavLink>
          <nav>
            <NavLink
              to="/einstellungen"
              className={({ isActive }) => `${linkStyles} ${isActive ? activeLinkStyles : inactiveLinkStyles}`}
            >
              <Cog size={20} />
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
