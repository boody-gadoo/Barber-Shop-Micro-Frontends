import { useLanguage } from '../providers/LanguageProvider';

export function AboutPage(): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="page-about">
      {/* Hero */}
      <section
        className="page-hero"
        style={{
          background: 'linear-gradient(135deg, rgba(23,20,18,0.85) 0%, rgba(41,35,31,0.9) 100%), url(/egyptian-barber.jpg) center/cover no-repeat',
        }}
      >
        <div className="page-hero-content">
          <h1>{isArabic ? 'قصتنا' : 'Our Story'}</h1>
          <p>{isArabic ? 'عراقة وأصالة منذ عام ٢٠١٠' : 'Tradition and authenticity since 2010'}</p>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <div className="about-grid">
          <div className="about-text">
            <h2>{isArabic ? 'من نحن' : 'Who We Are'}</h2>
            <p>
              {isArabic
                ? 'حلاقة البلد هي صالون حلاقة مصري أصيل أُسِّس في عام ٢٠١٠ بهدف تقديم تجربة حلاقة راقية تجمع بين الأساليب التقليدية المصرية والتقنيات الحديثة.'
                : 'Helaqat El Balad is an authentic Egyptian barber shop founded in 2010 with the goal of delivering a premium grooming experience that blends traditional Egyptian styles with modern techniques.'}
            </p>
            <p style={{ marginTop: 16 }}>
              {isArabic
                ? 'يضم فريقنا أمهر الحلاقين ذوي الخبرة الواسعة، الذين يحرصون على أن تغادر كل زيارة بأفضل مظهر ممكن.'
                : 'Our team consists of the most skilled barbers with extensive experience, ensuring you leave every visit looking your absolute best.'}
            </p>
          </div>
          <div className="about-img">
            <img src="/Interior.jpg" alt="Interior" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', height: 350 }} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#171412', color: '#f8f5f0', padding: '60px 24px' }}>
        <div className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="about-stats">
            {[
              { num: '14+', label: isArabic ? 'سنوات خبرة' : 'Years of Experience' },
              { num: '4', label: isArabic ? 'حلاقون محترفون' : 'Expert Barbers' },
              { num: '10K+', label: isArabic ? 'عميل سعيد' : 'Happy Customers' },
              { num: '4.9★', label: isArabic ? 'تقييم العملاء' : 'Customer Rating' },
            ].map((stat) => (
              <div key={stat.num} className="stat-item">
                <span className="stat-num">{stat.num}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
