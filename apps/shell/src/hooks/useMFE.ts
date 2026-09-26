import React, { useState, useEffect } from 'react';
import { getRemoteComponent, LoadOptions } from '../utils/mfe';

/**
 * Hook for loading MFE components
 */
export function useMFE(remoteName: string, modulePath: string, options?: LoadOptions) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        setIsLoading(true);
        const Comp = await getRemoteComponent(remoteName, modulePath, options);

        if (isMounted) {
          setComponent(() => Comp);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setComponent(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [remoteName, modulePath, options]);

  return { Component, error, isLoading };
}

/**
 * Hook to preload multiple remotes
 */
export function usePreloadRemotes(remoteNames: string[]) {
  const [loaded, setLoaded] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  useEffect(() => {
    let isMounted = true;
    const dynamicImport = async () => {
      const { preloadRemote } = await import('../utils/mfe');

      for (const remoteName of remoteNames) {
        try {
          await preloadRemote(remoteName);
          if (isMounted) {
            setLoaded((prev) => [...new Set([...prev, remoteName])]);
          }
        } catch (err) {
          if (isMounted) {
            setErrors((prev) => ({
              ...prev,
              [remoteName]: err instanceof Error ? err : new Error(String(err)),
            }));
          }
        }
      }
    };

    dynamicImport();

    return () => {
      isMounted = false;
    };
  }, [remoteNames]);

  return { loaded, errors, isLoading: loaded.length < remoteNames.length };
}
