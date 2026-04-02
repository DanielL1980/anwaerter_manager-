import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import Layout from './components/Layout';
import Start from './pages/Start';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LehrprobeDetail from './pages/LehrprobeDetail';
import AnwaerterProfil from './pages/AnwaerterProfil';
import Einstellungen from './pages/Einstellungen';
import Login from './components/Login';
import InviteHandler from './components/InviteHandler';
import BewerberHome from './pages/BewerberHome';
import BewerberDetail from './pages/BewerberDetail';

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

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

  if (!user) return <Login />;

  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/invite/:token" element={<InviteHandler />} />
        <Route path="/" element={<Layout user={user} onSignOut={() => signOut(auth)} />}>
          <Route index element={<Start />} />
          <Route path="/anwaerter" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lehrprobe/:id" element={<LehrprobeDetail />} />
          <Route path="/anwaerter/:name" element={<AnwaerterProfil />} />
          <Route path="/einstellungen" element={<Einstellungen />} />
          <Route path="/bewerber" element={<BewerberHome />} />
          <Route path="/bewerber/:id" element={<BewerberDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
