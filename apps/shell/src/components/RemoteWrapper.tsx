import React, { Suspense, useState } from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import { getRemoteComponent } from '../utils/mfe';

interface RemoteWrapperProps {
  remote: string;
  module: string;
  fallback?: React.ReactNode;
}

export function RemoteWrapper({
  remote,
  module,
  fallback,
}: RemoteWrapperProps): JSX.Element {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  React.useEffect(() => {
    let mounted = true;

    const loadRemoteComponent = async (): Promise<void> => {
      try {
        const Comp = await getRemoteComponent(remote, module);
        if (mounted) {
          setComponent(() => Comp);
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error(`Failed to load remote ${remote}/${module}:`, error);
          setError(error);
        }
      }
    };

    loadRemoteComponent();

    return () => {
      mounted = false;
    };
  }, [remote, module]);

  if (error) {
    return (
      <div
        className="remote-error"
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{
          padding: '24px',
          backgroundColor: '#fff5f3',
          borderRadius: '8px',
          border: '1px solid #e8ddd4',
        }}
      >
        <h3 style={{ color: '#d4645c', marginBottom: '8px' }}>
          {isArabic ? 'خطأ في التحميل' : 'Failed to load'}
        </h3>
        <p style={{ color: '#6f6861', marginBottom: '16px' }}>
          {isArabic
            ? `فشل تحميل ${remote}`
            : `Failed to load ${remote}`}
        </p>
        <details
          className="error-details"
          style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '4px',
            border: '1px solid #e8ddd4',
          }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            {isArabic ? 'التفاصيل' : 'Details'}
          </summary>
          <pre
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#6f6861',
              overflow: 'auto',
            }}
          >
            {error.message}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#d4645c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {isArabic ? 'إعادة محاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!Component) {
    const defaultFallback: JSX.Element = (
      <div
        className="remote-loading"
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e8ddd4',
            borderTopColor: '#d4645c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        />
        <p style={{ color: '#6f6861' }}>
          {isArabic ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </div>
    );
    
    if (fallback && typeof fallback === 'object') {
      return fallback as JSX.Element;
    }
    return defaultFallback;
  }

  const defaultSpinner: JSX.Element = (
    <div
      className="remote-loading"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
      }}
    >
      <div
        className="loading-spinner"
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e8ddd4',
          borderTopColor: '#d4645c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }}
      />
      <p style={{ color: '#6f6861' }}>
        {isArabic ? 'جاري التحميل...' : 'Loading...'}
      </p>
    </div>
  );

  const fallbackElement = fallback && typeof fallback === 'object' ? (fallback as JSX.Element) : defaultSpinner;

  return (
    <Suspense fallback={fallbackElement}>
      <div className="remote-container">
        <Component />
      </div>
    </Suspense>
  );
}

