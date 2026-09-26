import { Link } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';

interface NavLink {
  label: string;
  labelAr: string;
  path: string;
}

const navLinks: NavLink[] = [
  { label: 'Home', labelAr: 'الرئيسية', path: '/' },
  { label: 'Services', labelAr: 'الخدمات', path: '/services' },
  { label: 'Barbers', labelAr: 'الحلاقون', path: '/barbers' },
  { label: 'Offers', labelAr: 'العروض', path: '/offers' },
  { label: 'Gallery', labelAr: 'الصور', path: '/gallery' },
  { label: 'About', labelAr: 'من نحن', path: '/about' },
  { label: 'Contact', labelAr: 'اتصل بنا', path: '/contact' },
  { label: 'Booking', labelAr: 'احجز الآن', path: '/booking' },
];

export function Header(): JSX.Element {
  const { language, toggleLanguage } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <header className="header" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-ar">حلاقة البلد</span>
          <span className="logo-en">Helaqat El Balad</span>
        </Link>

        {/* Navigation */}
        <nav className="nav">
          <ul className="nav-list">
            {navLinks.map((link) => (
              <li key={link.path} className="nav-item">
                <Link to={link.path} className="nav-link">
                  {isArabic ? link.labelAr : link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {/* My Bookings */}
          <Link
            to="/my-bookings"
            className="header-icon-btn"
            aria-label={isArabic ? 'حجوزاتي' : 'My Bookings'}
            title={isArabic ? 'حجوزاتي' : 'My Bookings'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
          </Link>
          <button
            onClick={() => {
              const root = document.documentElement;
              const isDark = root.classList.contains('dark-theme');
              if (isDark) {
                root.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
              } else {
                root.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
              }
            }}
            className="theme-toggle"
            aria-label="Toggle Theme"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon-star"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>
          </button>
          <button
            onClick={toggleLanguage}
            className="lang-toggle"
            aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            {isArabic ? 'EN' : 'AR'}
          </button>
        </div>
      </div>
    </header>
  );
}
