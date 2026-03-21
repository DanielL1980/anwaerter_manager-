import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLehrprobe } from '../lib/db';
import { ChevronLeft, User, Book, Calendar } from 'lucide-react';
import { format } from 'date-fns';

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
      <Link to="/" className="inline-flex items-center gap-2 text-blue-600 mb-6 hover:underline">
        <ChevronLeft size={20} />
        <span>Zurück zur Übersicht</span>
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">{probe.thema}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div className="flex items-center gap-3">
            <User size={20} className="text-gray-400" />
            <span>
              <span className="font-semibold">Prüfling:</span> {probe.prüfling}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-gray-400" />
            <span>
              <span className="font-semibold">Datum:</span> {format(new Date(probe.datum), 'dd.MM.yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* --- Der eigentliche Auswertebogen kommt als nächstes hier hin --- */}
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-xl font-bold text-center text-gray-400">
            Auswertung folgt...
        </h3>
      </div>
    </div>
  );
}

export default LehrprobeDetail;
