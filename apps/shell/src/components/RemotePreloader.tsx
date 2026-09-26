import { useEffect, useState } from 'react';
import { preloadRemote, isRemoteLoaded, getRemoteError } from '../utils/mfe';
import { useLanguage } from '../providers/LanguageProvider';

interface RemotePreloaderProps {
  remotes: string[];
  onComplete?: (loadedRemotes: string[]) => void;
  onError?: (error: Error, remoteName: string) => void;
}

/**
 * Component that preloads multiple remotes in the background
 * Useful for improving perceived performance when navigating to MFEs
 */
export function RemotePreloader({
  remotes,
  onComplete,
  onError,
}: RemotePreloaderProps): JSX.Element | null {
  const [loaded, setLoaded] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  useEffect(() => {
    let isMounted = true;
    const loadedRemotes: string[] = [];

    const preload = async () => {
      for (const remoteName of remotes) {
        // Skip if already loaded
        if (isRemoteLoaded(remoteName)) {
          loadedRemotes.push(remoteName);
          continue;
        }

        try {
          await preloadRemote(remoteName);
          if (isMounted) {
            loadedRemotes.push(remoteName);
            setLoaded([...loadedRemotes]);
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error(`Failed to preload remote ${remoteName}:`, err);

          if (isMounted && onError) {
            onError(err, remoteName);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);

        if (onComplete) {
          onComplete(loadedRemotes);
        }
      }
    };

    preload();

    return () => {
      isMounted = false;
    };
  }, [remotes, onComplete, onError]);

  // This component doesn't render anything visible
  // It's purely for side effects (preloading)
  if (!isLoading && loaded.length === remotes.length) {
    return null;
  }

  // Optionally show debug info during development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        className="remote-preloader-debug"
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: isArabic ? 'auto' : '20px',
          right: isArabic ? '20px' : 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '200px',
          maxHeight: '150px',
          overflowY: 'auto',
        }}
      >
        <strong>MFE Preloader</strong>
        <div style={{ marginTop: '8px' }}>
          {remotes.map((remote) => (
            <div key={remote} style={{ marginBottom: '4px' }}>
              <span>
                {loaded.includes(remote) ? '✓' : '○'} {remote}
              </span>
              {getRemoteError(remote) && (
                <div style={{ color: '#ff6b6b', fontSize: '10px', marginTop: '2px' }}>
                  Error: {getRemoteError(remote)?.message}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
