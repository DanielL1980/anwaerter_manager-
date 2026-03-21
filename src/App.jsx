import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LehrprobeDetail from './pages/LehrprobeDetail'; // <-- NEU

function App() {
  return (
    <BrowserRouter basename="/anwaerter_manager-">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* NEUE ROUTE FÜR DIE DETAILSEITE */}
          <Route path="/lehrprobe/:id" element={<LehrprobeDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
