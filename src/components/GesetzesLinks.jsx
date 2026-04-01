import { useState } from 'react';
import { ExternalLink, BookOpen, ChevronDown } from 'lucide-react';
import { GESETZE_LINKS, findePassendeGesetze } from '../data/gesetze';

function GesetzesLinks({ thema }) {
  const [zeigeAlle, setZeigeAlle] = useState(false);
  const passend = findePassendeGesetze(thema);
  const angezeigt = zeigeAlle ? GESETZE_LINKS : passend.length > 0 ? passend : GESETZE_LINKS.slice(0, 6);

  return (
    <div className="card overflow-hidden print:hidden">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <BookOpen size={18} />
          <h3 className="font-bold">Rechtsgrundlagen</h3>
        </div>
        <a href="https://www.gesetze-im-internet.de" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-teal-200 hover:text-white text-xs transition">
          gesetze-im-internet.de <ExternalLink size={12} />
        </a>
      </div>

      <div className="p-4">
        {thema && passend.length > 0 && (
          <p className="text-xs text-slate-500 mb-3 bg-teal-50 px-3 py-2 rounded-lg">
            Zum Thema „<strong>{thema}</strong>" passende Gesetze:
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {angezeigt.map(gesetz => (
            <a key={gesetz.kuerzel} href={gesetz.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition group">
              <div className="bg-teal-100 text-teal-700 rounded-lg px-2 py-1 text-xs font-bold flex-shrink-0 group-hover:bg-teal-200 transition">
                {gesetz.kuerzel}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{gesetz.titel}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{gesetz.beschreibung}</p>
              </div>
              <ExternalLink size={14} className="text-slate-300 group-hover:text-teal-500 flex-shrink-0 mt-0.5 transition" />
            </a>
          ))}
        </div>

        <button onClick={() => setZeigeAlle(!zeigeAlle)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition py-2">
          <ChevronDown size={16} className={`transition-transform ${zeigeAlle ? 'rotate-180' : ''}`} />
          {zeigeAlle ? 'Weniger anzeigen' : `Alle ${GESETZE_LINKS.length} Gesetze anzeigen`}
        </button>
      </div>
    </div>
  );
}

export default GesetzesLinks;
