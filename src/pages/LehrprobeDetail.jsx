import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLehrprobe, deleteLehrprobe } from '../lib/db'; // deleteLehrprobe importieren
import Auswertebogen from '../components/Auswertebogen';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'; // Modal importieren
import { ChevronLeft, User, Calendar, Printer, Trash2 } from 'lucide-react'; // Trash2-Icon importieren
import { format } from 'date-fns';
import '../print.css';

function LehrprobeDetail() {
  const { id } = useParams();
  const navigate = useNavigate(); // Hook für die Weiterleitung nach dem Löschen
  const [probe, setProbe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State für das Modal

  useEffect(() => {
    const fetchProbe = async () => {
      setLoading(true);
      const data = await getLehrprobe(id);
      setProbe(data);
      setLoading(false);
    };
    fetchProbe();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };
  
  // Funktion zum Löschen
  const handleDelete = async () => {
    await deleteLehrprobe(id);
    navigate('/'); // Nach dem Löschen zur Startseite zurückkehren
  };

  if (loading) {
    return <div className="text-center p-12">Lade Lehrprobe...</div>;
  }

  if (!probe) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold mb-4">Lehrprobe nicht gefunden</h2>
        <Link to="/" className="text-blue-600 hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 no-print">
        <Link to="/" className="btn btn-secondary">
          <ChevronLeft size={20} />
          <span>Zurück zur Übersicht</span>
        </Link>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={20} />
            <span>Drucken / PDF</span>
          </button>
          {/* NEUER LÖSCHEN-BUTTON */}
          <button onClick={() => setIsDeleteModalOpen(true)} className="btn bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8 print-container info-box">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">{probe.thema}</h1>
        <p className="text-lg text-slate-600 mb-4">Lehrprobe von <span className="font-semibold text-slate-800">{probe.prüfling}</span></p>
        
        <div className="flex items-center gap-4 text-slate-500 text-sm border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{format(new Date(probe.datum), 'dd. MMMM yyyy')}</span>
            </div>
        </div>
      </div>

      <Auswertebogen lehrprobeId={probe.id} />
      
      {/* Das Modal wird hier eingebunden und gesteuert */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={probe.prüfling}
      />
    </div>
  );
}

export default LehrprobeDetail;
