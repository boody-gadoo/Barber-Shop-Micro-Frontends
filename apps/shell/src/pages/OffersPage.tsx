import { useLanguage } from '../providers/LanguageProvider';

const offers = [
  {
    id: 1,
    title: 'First Visit Discount',
    titleAr: 'خصم الزيارة الأولى',
    description: 'Get 30% off on your first visit to our shop!',
    descriptionAr: 'احصل على خصم 30% في زيارتك الأولى لصالوننا!',
    discount: '30%',
    code: 'FIRST30',
    valid: 'Valid all year',
    validAr: 'صالح طوال العام',
    color: '#fef3c7',
    border: '#fcd34d',
    textColor: '#92400e',
  },
  {
    id: 2,
    title: 'Weekend Special',
    titleAr: 'عرض نهاية الأسبوع',
    description: 'Book any service on weekends and get a free beard trim.',
    descriptionAr: 'احجز أي خدمة في نهاية الأسبوع واحصل على تهذيب لحية مجاني.',
    discount: 'FREE',
    code: 'WEEKEND',
    valid: 'Every Friday & Saturday',
    validAr: 'كل جمعة وسبت',
    color: '#f0fdf4',
    border: '#86efac',
    textColor: '#166534',
  },
  {
    id: 3,
    title: 'Student Offer',
    titleAr: 'عرض الطلاب',
    description: 'Show your student ID and get 20% off any service.',
    descriptionAr: 'أظهر بطاقتك الطلابية واحصل على خصم 20% على أي خدمة.',
    discount: '20%',
    code: 'STUDENT20',
    valid: 'Ongoing',
    validAr: 'مستمر',
    color: '#eff6ff',
    border: '#93c5fd',
    textColor: '#1e40af',
  },
];

export function OffersPage(): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="page-offers">
      {/* Hero */}
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, #b66a3c 0%, #c97f4f 100%)' }}>
        <div className="page-hero-content">
          <h1>{isArabic ? '🎉 عروضنا الحصرية' : '🎉 Exclusive Offers'}</h1>
          <p>{isArabic ? 'استفد من أفضل الصفقات والعروض' : 'Take advantage of our best deals'}</p>
        </div>
      </section>

      <section className="section">
        <div className="offers-grid-page">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="offer-card-page"
              style={{ background: offer.color, border: `2px solid ${offer.border}` }}
            >
              <div className="offer-discount-badge" style={{ color: offer.textColor }}>
                {offer.discount} OFF
              </div>
              <h3 style={{ color: offer.textColor }}>{isArabic ? offer.titleAr : offer.title}</h3>
              <p style={{ color: offer.textColor, opacity: 0.85 }}>
                {isArabic ? offer.descriptionAr : offer.description}
              </p>
              <div className="offer-code-box">
                <span>{isArabic ? 'الكود:' : 'Code:'}</span>
                <strong>{offer.code}</strong>
              </div>
              <p className="offer-validity" style={{ color: offer.textColor, opacity: 0.7 }}>
                {isArabic ? offer.validAr : offer.valid}
              </p>
              <a href="/booking" className="cta-button" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                {isArabic ? 'احجز الآن' : 'Book Now'}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
