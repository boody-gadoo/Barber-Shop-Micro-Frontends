import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { LanguageProvider } from './providers/LanguageProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { RemotePreloader } from './components/RemotePreloader';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { BookingPage } from './pages/BookingPage';
import { BarbersPage } from './pages/BarbersPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { OffersPage } from './pages/OffersPage';
import { AboutPage } from './pages/AboutPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { logger } from './utils/logger';
import { preloadRemote } from './utils/mfe';

function AppContent(): JSX.Element {
  useEffect(() => {
    try {
      preloadRemote('services').catch((error) => {
        logger.warn('Failed to preload services remote:', error);
      });
      preloadRemote('booking').catch((error) => {
        logger.warn('Failed to preload booking remote:', error);
      });
    } catch (error) {
      logger.error('Error preloading remotes:', error);
    }
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="barbers" element={<BarbersPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="my-bookings" element={<MyBookingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App(): JSX.Element {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('App error boundary caught an error', { error, errorInfo });
      }}
    >
      <ThemeProvider>
        <LanguageProvider>
          <RemotePreloader
            remotes={['services', 'booking']}
            onComplete={(loaded) => {
              logger.info('Remotes preloaded:', loaded);
            }}
            onError={(error, remote) => {
              logger.warn(`Failed to preload ${remote}:`, error);
            }}
          />
          <Router>
            <AppContent />
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
