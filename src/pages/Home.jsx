import { ClipboardList } from 'lucide-react';

function Home() {
  return (
    <div className="text-center py-12">
      <ClipboardList size={64} className="mx-auto text-blue-600 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Willkommen</h2>
      <p className="text-gray-600 mb-8">
        Digitaler Auswertebogen für Lehrproben im theoretischen Unterricht
      </p>
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
        <p className="text-green-600 font-semibold text-lg">
          ✓ Setup erfolgreich!
        </p>
        <p className="text-gray-500 mt-2">
          Die App ist bereit für den nächsten Schritt.
        </p>
      </div>
    </div>
  );
}

export default Home;
