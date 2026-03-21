import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLehrprobe } from '../lib/db';
import Auswertebogen from '../components/Auswertebogen';
import { ChevronLeft, User, Calendar, Printer } from 'lucide-react'; // Printer-Icon importieren
import { format } from 'date-fns';
import '../print.css'; // <-- HIER WIRD DIE DRUCK-CSS-DATEI IMPORTIERT

function LehrprobeDetail() {
  const { id } = useParams();
  const [probe, setProbe] = useState(null);
  const [loading, setLoading] = useState(true);

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
        {/* NEUER DRUCKEN-BUTTON */}
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={20} />
          <span>Drucken / PDF</span>
        </button>
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
    </div>
  );
}

export default LehrprobeDetail;
