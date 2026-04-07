import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getLehrproben } from '../lib/db';
import NeueLehrprobeModal from '../components/NeueLehrprobeModal';
import { Plus, BookOpen, Calendar, ChevronRight, ClipboardList, Search, X, GraduationCap, Car, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600', 'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600', 'from-amber-500 to-orange-600',
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

function Home() {
  const [lehrproben, setLehrproben] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suche, setSuche] = useState('');
  const [filter, setFilter] = useState('alle');
  const [aktuellerTab, setAktuellerTab] = useState('auswertungen');

  const loadLehrproben = async () => {
    const data = await getLehrproben();
    setLehrproben(data.reverse());
    setIsModalOpen(false);
  };

  useEffect(() => { loadLehrproben(); }, []);

  const gefiltert = lehrproben.filter(p => {
    const matchSuche = p.prüfling.toLowerCase().includes(suche.toLowerCase()) ||
      p.thema.toLowerCase().includes(suche.toLowerCase());
    const matchFilter = filter === 'alle' || p.typ === filter ||
      (!p.typ && filter === 'theorie');
    return matchSuche && matchFilter;
  });

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

      {/* Interne Navigation */}
      <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button onClick={() => setAktuellerTab('auswertungen')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            aktuellerTab === 'auswertungen'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <ClipboardList size={16} /> Auswertungen
        </button>
        <NavLink to="/dashboard"
          onClick={() => setAktuellerTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            aktuellerTab === 'dashboard'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <BarChart2 size={16} /> Dashboard
        </NavLink>
      </div>

      {aktuellerTab === 'auswertungen' && (
        <>
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-500 mt-1">
              {lehrproben.length === 0 ? 'Noch keine Einträge' : `${lehrproben.length} Auswertung${lehrproben.length !== 1 ? 'en' : ''} gespeichert`}
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={20} /><span>Neue Auswertung</span>
            </button>
          </div>

          {lehrproben.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card p-5 flex items-center gap-4">
                  <div className="bg-indigo-100 rounded-xl p-3"><ClipboardList size={22} className="text-indigo-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lehrproben.length}</p>
                    <p className="text-sm text-slate-500">Auswertungen gesamt</p>
                  </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                  <div className="bg-emerald-100 rounded-xl p-3"><Calendar size={22} className="text-emerald-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{format(new Date(lehrproben[0].datum), 'dd. MMM', { locale: de })}</p>
                    <p className="text-sm text-slate-500">Letzte Auswertung</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={suche} onChange={e => setSuche(e.target.value)}
                    placeholder="Nach Name oder Thema suchen..."
                    className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm" />
                  {suche && (
                    <button onClick={() => setSuche('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-700">
                  <option value="alle">Alle Typen</option>
                  <option value="theorie">Nur Theorie</option>
                  <option value="fahrstunde">Nur Fahrstunden</option>
                </select>
              </div>
            </>
          )}

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
          ) : gefiltert.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">Keine Auswertungen gefunden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gefiltert.map((probe) => {
                const farbe = getAvatarColor(probe.prüfling);
                const initialen = getInitials(probe.prüfling);
                return (
                  <div key={probe.id} className="card p-5 flex items-center gap-5 hover:shadow-md hover:border-indigo-100 transition-all duration-200 group">
                    <Link to={`/anwaerter/${encodeURIComponent(probe.prüfling)}`}
                      className={`bg-gradient-to-br ${farbe} rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 transition-transform`}
                      title="Anwärter-Profil öffnen">
                      <span className="text-white font-bold text-lg">{initialen}</span>
                    </Link>
                    <Link to={`/lehrprobe/${probe.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate">{probe.prüfling}</p>
                        <TypBadge typ={probe.typ} />
                      </div>
                      <p className="text-slate-500 text-sm truncate">{probe.thema}</p>
                    </Link>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-700">{format(new Date(probe.datum), 'dd.MM.yyyy')}</p>
                        <p className="text-xs text-slate-400">{format(new Date(probe.datum), 'EEEE', { locale: de })}</p>
                      </div>
                      <Link to={`/lehrprobe/${probe.id}`} className="bg-slate-100 rounded-xl p-2 group-hover:bg-indigo-100 transition-colors">
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <NeueLehrprobeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onLehrprobeAdded={loadLehrproben} />
        </>
      )}
    </div>
  );
}

export default Home;
