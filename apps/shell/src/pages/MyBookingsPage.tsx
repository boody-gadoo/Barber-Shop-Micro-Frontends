import { useLanguage } from '../providers/LanguageProvider';
import { Link } from 'react-router-dom';

const mockBookings = [
  {
    id: 'BK-001',
    service: 'Classic Haircut',
    serviceAr: 'قصة كلاسيكية',
    barber: 'Ahmed El-Sayed',
    barberAr: 'أحمد السيد',
    date: '2026-10-01',
    time: '11:00 AM',
    status: 'confirmed',
    statusAr: 'مؤكد',
    price: 150,
    currency: 'EGP',
  },
  {
    id: 'BK-002',
    service: 'Beard Trim',
    serviceAr: 'تهذيب اللحية',
    barber: 'Mohamed Farouk',
    barberAr: 'محمد فاروق',
    date: '2026-09-28',
    time: '2:00 PM',
    status: 'completed',
    statusAr: 'مكتمل',
    price: 80,
    currency: 'EGP',
  },
];

const statusColors: Record<string, string> = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  completed: '#6b7280',
  cancelled: '#ef4444',
};

export function MyBookingsPage(): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="page-my-bookings">
      {/* Hero */}
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, #171412 0%, #29231f 100%)' }}>
        <div className="page-hero-content">
          <h1>{isArabic ? 'حجوزاتي' : 'My Bookings'}</h1>
          <p>{isArabic ? 'تتبع مواعيدك ومحفوظاتك' : 'Track your appointments and history'}</p>
        </div>
      </section>

      <section className="section">
        {mockBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: 64, marginBottom: 16 }}>📅</p>
            <h3>{isArabic ? 'لا توجد حجوزات بعد' : 'No bookings yet'}</h3>
            <p style={{ color: '#6f6861', marginBottom: 24 }}>
              {isArabic ? 'ابدأ بحجز أول موعد لك!' : 'Start by booking your first appointment!'}
            </p>
            <Link to="/booking" className="cta-button">
              {isArabic ? 'احجز الآن' : 'Book Now'}
            </Link>
          </div>
        ) : (
          <div className="my-bookings-list">
            {mockBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-header">
                  <span className="booking-id">{booking.id}</span>
                  <span
                    className="booking-status"
                    style={{ background: statusColors[booking.status] + '22', color: statusColors[booking.status] }}
                  >
                    {isArabic ? booking.statusAr : booking.status}
                  </span>
                </div>
                <div className="booking-card-body">
                  <div className="booking-row">
                    <span>✂️ {isArabic ? booking.serviceAr : booking.service}</span>
                    <strong>{booking.price} {booking.currency}</strong>
                  </div>
                  <div className="booking-row">
                    <span>👤 {isArabic ? booking.barberAr : booking.barber}</span>
                  </div>
                  <div className="booking-row">
                    <span>📅 {booking.date} — {booking.time}</span>
                  </div>
                </div>
                {booking.status === 'confirmed' && (
                  <div className="booking-card-actions">
                    <Link to="/booking" className="cta-button" style={{ fontSize: 13, padding: '8px 20px' }}>
                      {isArabic ? 'تعديل الحجز' : 'Modify'}
                    </Link>
                  </div>
                )}
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link to="/booking" className="cta-button">
                {isArabic ? '+ حجز جديد' : '+ New Booking'}
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
