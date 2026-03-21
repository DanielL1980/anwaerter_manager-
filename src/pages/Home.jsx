import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLehrproben } from '../lib/db';
import NeueLehrprobeModal from '../components/NeueLehrprobeModal';
import { Plus, ChevronRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

function Home() {
  const [lehrproben, setLehrproben] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Funktion zum Laden der Daten aus der DB
  const loadLehrproben = async () => {
    // Sortiert nach Datum absteigend
    const data = await getLehrproben();
    setLehrproben(data.reverse());
    setIsModalOpen(false); // Modal nach Erfolg schließen
  };

  // Beim ersten Laden der Seite die Daten holen
  useEffect(() => {
    loadLehrproben();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lehrproben Übersicht</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow"
        >
          <Plus size={20} />
          <span>Neue Lehrprobe</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {lehrproben.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
             <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="font-semibold">Noch keine Lehrproben angelegt.</p>
            <p className="text-sm">Klicken Sie auf "Neue Lehrprobe", um zu beginnen.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {lehrproben.map((probe) => (
              <li key={probe.id}>
                <Link to={`/lehrprobe/${probe.id}`} className="block p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-700">{probe.prüfling}</p>
                      <p className="text-sm text-gray-600">{probe.thema}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-sm text-gray-500">
                        {format(new Date(probe.datum), 'dd.MM.yyyy')}
                       </span>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NeueLehrprobeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLehrprobeAdded={loadLehrproben}
      />
    </div>
  );
}

export default Home;
