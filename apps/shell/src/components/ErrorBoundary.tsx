import React from 'react';


interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorBoundaryFallback error={this.state.error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}

interface ErrorBoundaryFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorBoundaryFallback({ error, onReset }: ErrorBoundaryFallbackProps): JSX.Element {
  // Use a hook wrapper since this is within an error boundary
  return <ErrorBoundaryFallbackContent error={error} onReset={onReset} />;
}

function ErrorBoundaryFallbackContent({
  error,
  onReset,
}: ErrorBoundaryFallbackProps): JSX.Element {
  // Cannot use useLanguage here because the provider might have crashed
  const isArabic = document.documentElement.dir === 'rtl';

  return (
    <div className="error-boundary-fallback" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="error-content">
        <h2>{isArabic ? 'حدث خطأ ما' : 'Something went wrong'}</h2>
        <p>{isArabic ? 'عذرا، حدث خطأ غير متوقع' : 'Sorry, an unexpected error occurred'}</p>
        {error && (
          <details className="error-details">
            <summary>{isArabic ? 'تفاصيل الخطأ' : 'Error details'}</summary>
            <pre>{error.toString()}</pre>
          </details>
        )}
        <button onClick={onReset} className="error-retry-button">
          {isArabic ? 'حاول مجددا' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
