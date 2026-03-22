import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LehrprobeDetail from './pages/LehrprobeDetail';
import Einstellungen from './pages/Einstellungen'; // <-- NEU

function App() {
  return (
    <BrowserRouter basename="/anwaerter_manager-">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/lehrprobe/:id" element={<LehrprobeDetail />} />
          {/* NEUE ROUTE FÜR DIE EINSTELLUNGEN */}
          <Route path="/einstellungen" element={<Einstellungen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
