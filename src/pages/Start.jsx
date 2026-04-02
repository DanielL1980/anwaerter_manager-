import { Link } from 'react-router-dom';
import { GraduationCap, Car } from 'lucide-react';

function Start() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">MKL Auswerteapp</h2>
        <p className="text-slate-500">Bitte Bereich auswählen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">

        {/* Anwärter */}
        <Link to="/anwaerter"
          className="group card p-8 flex flex-col items-center gap-4 hover:shadow-lg hover:border-indigo-200 transition-all active:scale-95 text-center">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <GraduationCap size={40} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Anwärter</h3>
            <p className="text-sm text-slate-500">Theorieunterricht & Fahrstunden auswerten</p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-medium">Theorie</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-medium">Fahrstunde</span>
          </div>
        </Link>

        {/* Bewerber */}
        <Link to="/bewerber"
          className="group card p-8 flex flex-col items-center gap-4 hover:shadow-lg hover:border-teal-200 transition-all active:scale-95 text-center">
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Car size={40} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Bewerber</h3>
            <p className="text-sm text-slate-500">Fahrpraktische Prüfungen erfassen</p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-lg font-medium">B / BE</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg font-medium">C / CE</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Start;
