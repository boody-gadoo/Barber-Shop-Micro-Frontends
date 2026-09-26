import { Link } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';

const barbers = [
  {
    id: 1,
    name: 'Ahmed El-Sayed',
    nameAr: 'أحمد السيد',
    title: 'Master Barber',
    titleAr: 'حلاق أستاذ',
    experience: '12 years',
    experienceAr: '12 سنة',
    speciality: 'Classic cuts & Hot towel shave',
    specialityAr: 'قصات كلاسيكية وحلاقة بالمنشفة الساخنة',
    avatar: '/portrait1.jpg',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Mohamed Farouk',
    nameAr: 'محمد فاروق',
    title: 'Senior Barber',
    titleAr: 'حلاق كبير',
    experience: '8 years',
    experienceAr: '8 سنوات',
    speciality: 'Fades & Modern Styles',
    specialityAr: 'تدرج وأساليب حديثة',
    avatar: '/portrait2.jpg',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Karim Nasser',
    nameAr: 'كريم ناصر',
    title: 'Barber',
    titleAr: 'حلاق',
    experience: '5 years',
    experienceAr: '5 سنوات',
    speciality: 'Beard grooming & Styling',
    specialityAr: 'العناية باللحية والتصفيف',
    avatar: '/portrait3.jpg',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Omar Khalil',
    nameAr: 'عمر خليل',
    title: 'Barber',
    titleAr: 'حلاق',
    experience: '4 years',
    experienceAr: '4 سنوات',
    speciality: "Kids cuts & Men's grooming",
    specialityAr: 'قصات أطفال وعناية بالرجال',
    avatar: '/portrait4.jpg',
    rating: 4.8,
  },
];

export function BarbersPage(): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="page-barbers">
      {/* Hero */}
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, #171412 0%, #29231f 100%)' }}>
        <div className="page-hero-content">
          <h1>{isArabic ? 'حلاقونا' : 'Our Barbers'}</h1>
          <p>{isArabic ? 'فريق من أفضل الحلاقين المحترفين' : 'A team of the finest professional barbers'}</p>
        </div>
      </section>

      {/* Barbers Grid */}
      <section className="section">
        <div className="barbers-grid">
          {barbers.map((barber) => (
            <div key={barber.id} className="barber-profile-card">
              <div className="barber-profile-img">
                <img src={barber.avatar} alt={barber.name} loading="lazy" />
              </div>
              <div className="barber-profile-body">
                <div className="barber-rating">
                  {'★'.repeat(Math.round(barber.rating))}
                  <span> {barber.rating}</span>
                </div>
                <h3>{isArabic ? barber.nameAr : barber.name}</h3>
                <p className="barber-title">{isArabic ? barber.titleAr : barber.title}</p>
                <p className="barber-exp">{isArabic ? `خبرة: ${barber.experienceAr}` : `Experience: ${barber.experience}`}</p>
                <p className="barber-spec">{isArabic ? barber.specialityAr : barber.speciality}</p>
                <Link to="/booking" className="cta-button" style={{ display: 'block', textAlign: 'center', marginTop: '16px' }}>
                  {isArabic ? 'احجز معه' : 'Book with him'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
