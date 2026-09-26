import { Link } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';

export function NotFoundPage(): JSX.Element {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>{isArabic ? 'الصفحة غير موجودة' : 'Page Not Found'}</h2>
        <p>
          {isArabic
            ? 'عذرا، الصفحة التي تبحث عنها غير موجودة'
            : 'Sorry, the page you are looking for does not exist'}
        </p>
        <Link to="/" className="cta-button">
          {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    </div>
  );
}
