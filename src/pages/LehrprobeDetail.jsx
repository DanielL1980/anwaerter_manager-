import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLehrprobe, deleteLehrprobe } from '../lib/db';
import Auswertebogen from '../components/Auswertebogen';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import GespraechsnotizBlock from '../components/GespraechsnotizBlock';
import { ChevronLeft, Calendar, Printer, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import '../print.css';

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

function LehrprobeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [probe, setProbe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchProbe = async () => {
      setLoading(true);
      const data = await getLehrprobe(id);
      setProbe(data);
      setLoading(false);
    };
    fetchProbe();
  }, [id]);

  if (loading) return <div className="text-center p-12 text-slate-500">Lade Lehrprobe...</div>;
  if (!probe) return (
    <div className="text-center p-12">
      <h2 className="text-xl font-bold mb-4">Lehrprobe nicht gefunden</h2>
      <Link to="/" className="text-indigo-600 hover:underline">Zurück zur Übersicht</Link>
    </div>
  );

  const farbe = getAvatarColor(probe.prüfling);
  const initialen = getInitials(probe.prüfling);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <Link to="/" className="btn btn-secondary"><ChevronLeft size={18} /><span>Übersicht</span></Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn btn-secondary">
            <Printer size={18} /><span className="hidden sm:inline">Drucken / PDF</span>
          </button>
          <button onClick={() => setIsDeleteModalOpen(true)}
            className="btn bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-400 shadow-sm">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden mb-6 print-container info-box">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-6 text-white">
          <div className="flex items-center gap-5">
            <div className={`bg-gradient-to-br ${farbe} rounded-2xl w-16 h-16 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/30`}>
              <span className="text-white font-bold text-xl">{initialen}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{probe.thema}</h1>
              <Link to={`/anwaerter/${encodeURIComponent(probe.prüfling)}`}
                className="text-indigo-200 mt-0.5 flex items-center gap-1.5 hover:text-white transition no-print">
                <User size={14} /> {probe.prüfling} – Profil ansehen →
              </Link>
              <p className="text-indigo-200 mt-0.5 hidden print:flex items-center gap-1.5">
                <User size={14} /> {probe.prüfling}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2 text-indigo-700 text-sm font-medium">
          <Calendar size={15} />
          <span>{format(new Date(probe.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
        </div>
      </div>

      <Auswertebogen lehrprobeId={probe.id} lehrprobe={probe} />

      <div className="mt-6">
        <GespraechsnotizBlock lehrprobeId={probe.id} />
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => { await deleteLehrprobe(id); navigate('/'); }}
        itemName={probe.prüfling}
      />
    </div>
  );
}

export default LehrprobeDetail;
