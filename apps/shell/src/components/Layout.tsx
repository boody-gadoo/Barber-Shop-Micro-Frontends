import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout(): JSX.Element {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />
        <div id="services-mount" className="single-spa-mount" />
        <div id="booking-mount" className="single-spa-mount" />
      </main>
      <Footer />
    </div>
  );
}
