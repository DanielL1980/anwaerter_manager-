import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LehrprobeDetail from './pages/LehrprobeDetail';
import Einstellungen from './pages/Einstellungen';

function App() {
  return (
    <BrowserRouter basename="/anwaerter_manager-">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lehrprobe/:id" element={<LehrprobeDetail />} />
          <Route path="/einstellungen" element={<Einstellungen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
