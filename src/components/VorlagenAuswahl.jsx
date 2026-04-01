import { useState } from 'react';
import { VORLAGEN_THEORIE, VORLAGEN_FAHRSTUNDE } from '../data/vorlagen';
import { ChevronDown, Check } from 'lucide-react';

function VorlagenAuswahl({ typ, onAuswaehlen }) {
  const [offen, setOffen] = useState(false);
  const [offeneGruppe, setOffeneGruppe] = useState(null);
  const vorlagen = typ === 'fahrstunde' ? VORLAGEN_FAHRSTUNDE : VORLAGEN_THEORIE;

  const gruppen = [...new Set(vorlagen.map(v => v.gruppe))];

  return (
    <div className="relative">
      <button type="button" onClick={() => setOffen(!offen)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-600 hover:border-indigo-300 transition">
        <span>Aus Vorlage wählen...</span>
        <ChevronDown size={16} className={`transition-transform ${offen ? 'rotate-180' : ''}`} />
      </button>

      {offen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
          {gruppen.map(gruppe => (
            <div key={gruppe}>
              <button type="button"
                onClick={() => setOffeneGruppe(offeneGruppe === gruppe ? null : gruppe)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition text-sm font-semibold text-slate-700 border-b border-slate-100">
                <span>{gruppe}</span>
                <ChevronDown size={14} className={`transition-transform text-slate-400 ${offeneGruppe === gruppe ? 'rotate-180' : ''}`} />
              </button>
              {offeneGruppe === gruppe && (
                <div className="bg-slate-50">
                  {vorlagen.filter(v => v.gruppe === gruppe).map(v => (
                    <button key={v.thema} type="button"
                      onClick={() => { onAuswaehlen(v.thema); setOffen(false); }}
                      className="w-full text-left px-6 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center gap-2">
                      <Check size={13} className="text-indigo-400 flex-shrink-0" />
                      {v.thema}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VorlagenAuswahl;
