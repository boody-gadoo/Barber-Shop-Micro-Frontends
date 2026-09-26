import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailsPage } from './pages/ServiceDetailsPage';
import { OffersPage } from './pages/OffersPage';

export default function App(): JSX.Element {
  return (
    <Router basename="/services">
      <Routes>
        <Route path="/" element={<ServicesPage />} />
        <Route path="/:id" element={<ServiceDetailsPage />} />
        <Route path="/offers" element={<OffersPage />} />
      </Routes>
    </Router>
  );
}
