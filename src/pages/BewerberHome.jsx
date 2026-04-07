import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBewerberpruefungen } from '../lib/bewerberDb';
import NeueBewerberPruefungModal from '../components/NeueBewerberPruefungModal';
import { Plus, ClipboardList, Calendar, ChevronRight, Search, X, Car, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import BewerberDashboard from './BewerberDashboard';

const AVATAR_COLORS = [
  'from-teal-500 to-emerald-600', 'from-cyan-500 to-teal-600',
  'from-emerald-500 to-green-600', 'from-green-500 to-teal-600',
];

function getInitials(name) {
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function KlasseBadge({ klasse }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${klasse === 'C_CE' ? 'bg-teal-100 text-teal-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {klasse === 'C_CE' ? 'C / CE' : 'B / BE'}
    </span>
  );
}

function BewerberHome() {
  const [pruefungen, setPruefungen] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suche, setSuche] = useState('');
  const [aktuellerTab, setAktuellerTab] = useState('bewertungen');

  const laden = async () => {
    const data = await getBewerberpruefungen();
    setPruefungen(data);
    setIsModalOpen(false);
  };

  useEffect(() => { laden(); }, []);

  const gefiltert = pruefungen.filter(p =>
    p.bewerber?.toLowerCase().includes(suche.toLowerCase()) ||
    p.dienstgrad?.toLowerCase().includes(suche.toLowerCase())
  );

  return (
    <div>
      {/* Bereich-Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl w-12 h-12 flex items-center justify-center shadow-sm">
            <Car size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bewerber</h2>
            <p className="text-slate-500 text-sm">Fahrpraktische Bewertungen</p>
          </div>
        </div>
      </div>

      {/* Interne Navigation */}
      <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button onClick={() => setAktuellerTab('bewertungen')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            aktuellerTab === 'bewertungen'
              ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <ClipboardList size={16} /> Bewertungen
        </button>
        <button onClick={() => setAktuellerTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            aktuellerTab === 'dashboard'
              ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          <BarChart2 size={16} /> Dashboard
        </button>
      </div>

      {aktuellerTab === 'dashboard' && <BewerberDashboard />}

      {aktuellerTab === 'bewertungen' && (
        <>
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-500 mt-1">
              {pruefungen.length === 0 ? 'Noch keine Einträge' : `${pruefungen.length} Bewertung${pruefungen.length !== 1 ? 'en' : ''} gespeichert`}
            </p>
            <button onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold hover:from-teal-700 hover:to-emerald-700 transition active:scale-95 shadow-sm">
              <Plus size={20} /><span>Neue Bewertung</span>
            </button>
          </div>

          {pruefungen.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card p-5 flex items-center gap-4">
                  <div className="bg-teal-100 rounded-xl p-3"><ClipboardList size={22} className="text-teal-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pruefungen.length}</p>
                    <p className="text-sm text-slate-500">Bewertungen gesamt</p>
                  </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                  <div className="bg-emerald-100 rounded-xl p-3"><Calendar size={22} className="text-emerald-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{format(new Date(pruefungen[0].datum), 'dd. MMM', { locale: de })}</p>
                    <p className="text-sm text-slate-500">Letzte Bewertung</p>
                  </div>
                </div>
              </div>

              <div className="relative mb-4">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={suche} onChange={e => setSuche(e.target.value)}
                  placeholder="Nach Name oder Dienstgrad suchen..."
                  className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-sm" />
                {suche && (
                  <button onClick={() => setSuche('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <X size={16} />
                  </button>
                )}
              </div>
            </>
          )}

          {pruefungen.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="bg-teal-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
                <ClipboardList size={36} className="text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Noch keine Bewertungen</h3>
              <p className="text-slate-500 mb-6">Legen Sie die erste fahrpraktische Bewertung an.</p>
              <button onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold mx-auto">
                <Plus size={20} /><span>Erste Bewertung anlegen</span>
              </button>
            </div>
          ) : gefiltert.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">Keine Einträge gefunden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gefiltert.map(p => {
                const farbe = getAvatarColor(p.bewerber || '');
                const initialen = getInitials(p.bewerber || '?');
                return (
                  <div key={p.id} className="card p-5 flex items-center gap-5 hover:shadow-md hover:border-teal-100 transition-all group">
                    <div className={`bg-gradient-to-br ${farbe} rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-white font-bold text-lg">{initialen}</span>
                    </div>
                    <Link to={`/bewerber/${p.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate">
                          {p.dienstgrad ? `${p.dienstgrad} ${p.bewerber}` : p.bewerber}
                        </p>
                        <KlasseBadge klasse={p.klasse} />
                      </div>
                      <p className="text-slate-500 text-sm">{format(new Date(p.datum), 'dd.MM.yyyy', { locale: de })}</p>
                    </Link>
                    <Link to={`/bewerber/${p.id}`} className="bg-slate-100 rounded-xl p-2 group-hover:bg-teal-100 transition-colors">
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <NeueBewerberPruefungModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdded={laden} />
        </>
      )}
    </div>
  );
}

export default BewerberHome;
