import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLehrproben } from '../lib/db';
import NeueLehrprobeModal from '../components/NeueLehrprobeModal';
import { Plus, ChevronRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

function Home() {
  const [lehrproben, setLehrproben] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadLehrproben = async () => {
    const data = await getLehrproben();
    setLehrproben(data.reverse());
    setIsModalOpen(false);
  };

  useEffect(() => {
    loadLehrproben();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Lehrproben</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          // SIEHE HIER: Wir nutzen jetzt unsere neuen Button-Klassen!
          className="btn btn-primary"
        >
          <Plus size={20} />
          <span>Neue Lehrprobe</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {lehrproben.length === 0 ? (
          <div className="text-center p-12 text-slate-500">
             <BookOpen size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="font-semibold">Noch keine Lehrproben angelegt.</p>
            <p className="text-sm mt-1">Klicken Sie auf "Neue Lehrprobe", um zu beginnen.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {lehrproben.map((probe) => (
              <li key={probe.id}>
                {/* Weicherer Hover-Effekt und besseres Padding */}
                <Link to={`/lehrprobe/${probe.id}`} className="block p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-700 text-lg">{probe.prüfling}</p>
                      <p className="text-sm text-slate-600 mt-1">{probe.thema}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-sm text-slate-500 font-medium">
                        {format(new Date(probe.datum), 'dd.MM.yyyy')}
                       </span>
                      <ChevronRight size={20} className="text-slate-400" />
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
