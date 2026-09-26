import { useLanguage } from '../providers/LanguageProvider';

const galleryItems = [
  { id: 1, src: '/gallery-detail.jpg', label: 'Classic Cut', labelAr: 'قصة كلاسيكية' },
  { id: 2, src: '/gallery-interior.jpg', label: 'Interior', labelAr: 'الديكور الداخلي' },
  { id: 3, src: '/gallery-tools.jpg', label: 'Premium Tools', labelAr: 'أدوات فاخرة' },
  { id: 4, src: '/fade-haircut.jpg', label: 'Fade Cut', labelAr: 'قصة فيد' },
  { id: 5, src: '/beard-trim.jpg', label: 'Beard Trim', labelAr: 'تهذيب اللحية' },
  { id: 6, src: '/hot-towel.jpg', label: 'Hot Towel Shave', labelAr: 'حلاقة بالمنشفة الساخنة' },
  { id: 7, src: '/hair-and-beard.jpg', label: 'Hair & Beard', labelAr: 'شعر ولحية' },
  { id: 8, src: '/Grooming.jpg', label: 'Grooming', labelAr: 'العناية الشخصية' },
  { id: 9, src: '/styling.jpg', label: 'Styling', labelAr: 'التصفيف' },
];

export function GalleryPage(): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="page-gallery">
      {/* Hero */}
      <section className="page-hero" style={{ background: 'linear-gradient(135deg, #1a1614 0%, #29231f 100%)' }}>
        <div className="page-hero-content">
          <h1>{isArabic ? 'معرض الصور' : 'Gallery'}</h1>
          <p>{isArabic ? 'لقطات من أعمالنا وصالوننا' : 'Shots from our work and salon'}</p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section">
        <div className="gallery-grid">
          {galleryItems.map((item) => (
            <div key={item.id} className="gallery-item">
              <img src={item.src} alt={item.label} loading="lazy" />
              <div className="gallery-overlay">
                <span>{isArabic ? item.labelAr : item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
