import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getLehrproben } from '../lib/db';
import NeueLehrprobeModal from '../components/NeueLehrprobeModal';
import {
  Plus, BookOpen, Calendar, ChevronRight, ChevronDown, ChevronUp,
  ClipboardList, Search, X, GraduationCap, Car, BarChart2, FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
];

function getInitials(name) {
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function TypBadge({ typ }) {
  if (typ === 'fahrstunde') return (
    <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">
      <Car size={11} /> Fahrstunde
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">
      <GraduationCap size={11} /> Theorie
    </span>
  );
}

function AnwaerterOrdner({ name, auswertungen }) {
  const [offen, setOffen] = useState(false);
  const farbe = getAvatarColor(name);
  const initialen = getInitials(name);
  const letzte = auswertungen[0];

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${offen ? 'border-indigo-200 shadow-md' : ''}`}>
      {/* Reiter / Klapptrigger */}
      <button
        onClick={() => setOffen(!offen)}
        className={`w-full flex items-center gap-4 p-4 text-left transition-all ${offen ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
      >
        <div className={`bg-gradient-to-br ${farbe} rounded-2xl w-12 h-12 flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white font-bold text-base">{initialen}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">{name}</p>
          <p className="text-slate-500 text-sm">
            {auswertungen.length} Auswertung{auswertungen.length !== 1 ? 'en' : ''}
            {' · '}Letzte: {format(new Date(letzte.datum), 'dd. MMM yyyy', { locale: de })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg">
            {auswertungen.length}
          </span>
          {offen
            ? <ChevronUp size={18} className="text-indigo-500" />
            : <ChevronDown size={18} className="text-slate-400" />
          }
        </div>
      </button>

      {/* Aufgeklappter Inhalt */}
      {offen && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          <div className="px-4 py-3 space-y-1">
            {auswertungen.map(probe => (
              <Link
                key={probe.id}
                to={`/lehrprobe/${probe.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition group"
              >
                <TypBadge typ={probe.typ} />
                <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{probe.thema}</p>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {format(new Date(probe.datum), 'dd.MM.yy')}
                </span>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-indigo-500 transition flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Home() {
  const [lehrproben, setLehrproben] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suche, setSuche] = useState('');
  const [aktuellerTab, setAktuellerTab] = useState('auswertungen');

  const loadLehrproben = async () => {
    const data = await getLehrproben();
    setLehrproben(data);
    setIsModalOpen(false);
  };

  useEffect(() => { loadLehrproben(); }, []);

  // Gruppiere nach Anwärter-Name
  const anwaerterMap = {};
  lehrproben.forEach(p => {
    if (!anwaerterMap[p.prüfling]) anwaerterMap[p.prüfling] = [];
    anwaerterMap[p.prüfling].push(p);
  });

  // Suche filtert nach Name oder Thema
  const gefilterteAnwaerter = Object.entries(anwaerterMap).filter(([name, proben]) => {
    if (!suche) return true;
    const s = suche.toLowerCase();
    return name.toLowerCase().includes(s) || proben.some(p => p.thema.toLowerCase().includes(s));
  });

  const anzahlAnwaerter = Object.keys(anwaerterMap).length;

  return (
    <div>
      {/* Bereich-Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl w-12 h-12 flex items-center justify-center shadow-sm">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Anwärter</h2>
            <p className="text-slate-500 text-sm">Theorieunterricht & Fahrstunden</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setAktuellerTab('auswertungen')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            aktuellerTab === 'auswertungen'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderOpen size={16} /> Anwärter
        </button>
        <NavLink
          to="/dashboard"
          onClick={() => setAktuellerTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            aktuellerTab === 'dashboard'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart2 size={16} /> Dashboard
        </NavLink>
      </div>

      {aktuellerTab === 'auswertungen' && (
        <>
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-500 mt-1">
              {anzahlAnwaerter === 0
                ? 'Noch keine Einträge'
                : `${anzahlAnwaerter} Anwärter · ${lehrproben.length} Auswertungen`}
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={20} /><span>Neue Auswertung</span>
            </button>
          </div>

          {lehrproben.length > 0 && (
            <>
              {/* Statistik */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card p-5 flex items-center gap-4">
                  <div className="bg-indigo-100 rounded-xl p-3">
                    <FolderOpen size={22} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{anzahlAnwaerter}</p>
                    <p className="text-sm text-slate-500">Anwärter</p>
                  </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                  <div className="bg-emerald-100 rounded-xl p-3">
                    <ClipboardList size={22} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lehrproben.length}</p>
                    <p className="text-sm text-slate-500">Auswertungen</p>
                  </div>
                </div>
              </div>

              {/* Suche */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={suche}
                  onChange={e => setSuche(e.target.value)}
                  placeholder="Nach Anwärter oder Thema suchen..."
                  className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                />
                {suche && (
                  <button onClick={() => setSuche('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Anwärter-Ordner */}
          {lehrproben.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="bg-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
                <BookOpen size={36} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Noch keine Auswertungen</h3>
              <p className="text-slate-500 mb-6">Legen Sie die erste Auswertung an, um zu beginnen.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mx-auto">
                <Plus size={20} /><span>Erste Auswertung anlegen</span>
              </button>
            </div>
          ) : gefilterteAnwaerter.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">Kein Anwärter gefunden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gefilterteAnwaerter.map(([name, proben]) => (
                <AnwaerterOrdner key={name} name={name} auswertungen={proben} />
              ))}
            </div>
          )}

          <NeueLehrprobeModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onLehrprobeAdded={loadLehrproben}
          />
        </>
      )}
    </div>
  );
}

export default Home;
