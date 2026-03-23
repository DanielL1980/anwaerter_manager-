import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLehrproben } from '../lib/db';
import NeueLehrprobeModal from '../components/NeueLehrprobeModal';
import { Plus, BookOpen, Calendar, ChevronRight, ClipboardList } from 'lucide-react';
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

function Home() {
  const [lehrproben, setLehrproben] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadLehrproben = async () => {
    const data = await getLehrproben();
    setLehrproben(data.reverse());
    setIsModalOpen(false);
  };

  useEffect(() => { loadLehrproben(); }, []);

  return (
    <div>
      {/* Header-Bereich */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Lehrproben</h2>
          <p className="text-slate-500 mt-1">
            {lehrproben.length === 0
              ? 'Noch keine Einträge vorhanden'
              : `${lehrproben.length} Lehrprobe${lehrproben.length !== 1 ? 'n' : ''} gespeichert`}
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={20} />
          <span>Neue Lehrprobe</span>
        </button>
      </div>

      {/* Statistik-Leiste */}
      {lehrproben.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-5 flex items-center gap-4">
            <div className="bg-indigo-100 rounded-xl p-3">
              <ClipboardList size={22} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{lehrproben.length}</p>
              <p className="text-sm text-slate-500">Lehrproben gesamt</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="bg-emerald-100 rounded-xl p-3">
              <Calendar size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {format(new Date(lehrproben[0].datum), 'dd. MMM', { locale: de })}
              </p>
              <p className="text-sm text-slate-500">Letzte Lehrprobe</p>
            </div>
          </div>
        </div>
      )}

      {/* Lehrproben-Liste */}
      {lehrproben.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="bg-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={36} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Noch keine Lehrproben</h3>
          <p className="text-slate-500 mb-6">Legen Sie die erste Lehrprobe an, um zu beginnen.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mx-auto">
            <Plus size={20} />
            <span>Erste Lehrprobe anlegen</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lehrproben.map((probe) => {
            const farbe = getAvatarColor(probe.prüfling);
            const initialen = getInitials(probe.prüfling);
            return (
              <Link
                key={probe.id}
                to={`/lehrprobe/${probe.id}`}
                className="card p-5 flex items-center gap-5 hover:shadow-md hover:border-indigo-100 transition-all duration-200 group block"
              >
                {/* Avatar */}
                <div className={`bg-gradient-to-br ${farbe} rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="text-white font-bold text-lg">{initialen}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-lg truncate">{probe.prüfling}</p>
                  <p className="text-slate-500 text-sm truncate mt-0.5">{probe.thema}</p>
                </div>

                {/* Datum + Pfeil */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-700">
                      {format(new Date(probe.datum), 'dd.MM.yyyy')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(probe.datum), 'EEEE', { locale: de })}
                    </p>
                  </div>
                  <div className="bg-slate-100 rounded-xl p-2 group-hover:bg-indigo-100 transition-colors">
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <NeueLehrprobeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLehrprobeAdded={loadLehrproben}
      />
    </div>
  );
}

export default Home;
