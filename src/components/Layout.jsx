import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <GraduationCap size={28} />
          <h1 className="text-xl font-bold">Lehrprobe Auswerter</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
