import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAuswertungseintrag, deleteAuswertungseintrag } from '../lib/db';
import Auswertebogen from '../components/Auswertebogen';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import GespraechsnotizBlock from '../components/GespraechsnotizBlock';
import GesetzesLinks from '../components/GesetzesLinks';
import FahrtNotizblock from '../components/FahrtNotizblock';
import TheorieNotizblock from '../components/TheorieNotizblock';
import Stoppuhr from '../components/Stoppuhr';
import Teilen from '../components/Teilen';
import GlobaleNotiz from '../components/GlobaleNotiz';
import { ChevronLeft, Calendar, Trash2, User, GraduationCap, Car } from 'lucide-react';
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

function AuswertungDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eintrag, setEintrag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const laden = async () => {
      setLoading(true);
      const data = await getAuswertungseintrag(id);
      setEintrag(data);
      setLoading(false);
    };
    laden();
  }, [id]);

  if (loading) return <div className="text-center p-12 text-slate-500">Lade Auswertebogen...</div>;
  if (!eintrag) return (
    <div className="text-center p-12">
      <h2 className="text-xl font-bold mb-4">Auswertung nicht gefunden</h2>
      <Link to="/" className="text-indigo-600 hover:underline">Zurück zur Übersicht</Link>
    </div>
  );

  const farbe = getAvatarColor(eintrag.prüfling);
  const initialen = getInitials(eintrag.prüfling);
  const istFahrstunde = eintrag.typ === 'fahrstunde';
  const titelTyp = istFahrstunde ? 'Auswertebogen Fahrstunden' : 'Auswertebogen Theoretischer Unterricht';

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <Link to="/" className="btn btn-secondary"><ChevronLeft size={18} /><span>Übersicht</span></Link>
        <div className="flex gap-2">
          <Teilen probe={eintrag} />
          <button onClick={() => setIsDeleteModalOpen(true)} className="btn bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-400 shadow-sm">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden mb-6 print-container info-box">
        <div className={`bg-gradient-to-r ${istFahrstunde ? 'from-blue-600 to-cyan-600' : 'from-indigo-600 to-blue-600'} px-6 py-6 text-white`}>
          <div className="flex items-center gap-5">
            <div className={`bg-gradient-to-br ${farbe} rounded-2xl w-16 h-16 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/30`}>
              <span className="text-white font-bold text-xl">{initialen}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {istFahrstunde ? <Car size={16} className="text-blue-200" /> : <GraduationCap size={16} className="text-indigo-200" />}
                <span className="text-white/70 text-sm font-medium">{titelTyp}</span>
              </div>
              <h1 className="text-2xl font-bold">{eintrag.thema}</h1>
              <Link to={`/anwaerter/${encodeURIComponent(eintrag.prüfling)}`}
                className="text-white/70 mt-0.5 flex items-center gap-1.5 hover:text-white transition no-print text-sm">
                <User size={14} /> {eintrag.prüfling} – Profil ansehen →
              </Link>
            </div>
          </div>
        </div>
        <div className={`px-6 py-3 ${istFahrstunde ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'} border-t flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium ${istFahrstunde ? 'text-blue-700' : 'text-indigo-700'}`}>
          <span className="flex items-center gap-1.5"><Calendar size={14} />{format(new Date(eintrag.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
          {eintrag.zeitVon && eintrag.zeitBis && (
            <span>🕐 Geplant: {eintrag.zeitVon}–{eintrag.zeitBis} Uhr ({(parseInt(eintrag.zeitBis.split(':')[0])*60+parseInt(eintrag.zeitBis.split(':')[1]))-(parseInt(eintrag.zeitVon.split(':')[0])*60+parseInt(eintrag.zeitVon.split(':')[1]))} Min.)</span>
          )}
          {eintrag.zeitTatsaechlichVon && eintrag.zeitTatsaechlichBis && (
            <span>⏱ Tatsächlich: {eintrag.zeitTatsaechlichVon}–{eintrag.zeitTatsaechlichBis} Uhr</span>
          )}
          {eintrag.ausbildungswoche && <span>· Woche {eintrag.ausbildungswoche}</span>}
          {eintrag.ausbildungsstunde && <span>· Stunde {eintrag.ausbildungsstunde}</span>}
        </div>
      </div>

      <Auswertebogen eintragId={eintrag.id} eintrag={eintrag} />

      <div className="mt-6 space-y-6">
        <GesetzesLinks thema={eintrag.thema} />
        {istFahrstunde && <FahrtNotizblock eintragId={eintrag.id} />}
        <GespraechsnotizBlock eintragId={eintrag.id} />
      </div>

      {!istFahrstunde && <TheorieNotizblock eintragId={eintrag.id} />}

      <GlobaleNotiz eintragId={eintrag.id} />

      <Stoppuhr eintragId={eintrag.id} probe={eintrag} />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => { await deleteAuswertungseintrag(id); navigate('/'); }}
        itemName={eintrag.prüfling}
      />
    </div>
  );
}

export default AuswertungDetail;
