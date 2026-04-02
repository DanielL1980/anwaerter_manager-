import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LehrprobeDetail from './pages/LehrprobeDetail';
import AnwaerterProfil from './pages/AnwaerterProfil';
import Einstellungen from './pages/Einstellungen';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(undefined); // undefined = lädt noch

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  // Ladebildschirm
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // Nicht angemeldet
  if (!user) return <Login />;

  return (
    <BrowserRouter basename="/anwaerter_manager-">
      <Routes>
        <Route path="/" element={<Layout user={user} onSignOut={() => signOut(auth)} />}>
          <Route index element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lehrprobe/:id" element={<LehrprobeDetail />} />
          <Route path="/anwaerter/:name" element={<AnwaerterProfil />} />
          <Route path="/einstellungen" element={<Einstellungen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
