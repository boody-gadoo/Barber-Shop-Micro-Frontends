/**
 * Module Federation utilities for loading remote applications
 * Production-grade MFE loader with caching, error handling, and lifecycle management
 */

export interface RemoteConfig {
  name: string;
  url: string;
  scope: string;
}

export interface RemoteCache {
  [remoteName: string]: {
    loaded: boolean;
    modules: Record<string, React.ComponentType>;
    error?: Error;
    lastLoadTime?: number;
  };
}

export interface LoadOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

// Remote configurations
const remotes: Record<string, RemoteConfig> = {
  services: {
    name: 'services',
    url: 'http://localhost:3002/assets/remoteEntry.js',
    scope: 'services',
  },
  booking: {
    name: 'booking',
    url: 'http://localhost:3003/remoteEntry.js',
    scope: 'booking',
  },
};

// Global cache for loaded remotes and components
const cache: RemoteCache = {};

// Track loading promises to prevent duplicate requests
const loadingPromises: Record<string, Promise<void>> = {};

/**
 * Load a remote entry script dynamically with retry logic
 */
export async function loadRemote(
  remoteName: string,
  options: LoadOptions = {}
): Promise<void> {
  const { timeout = 30000, retries = 3, cache: useCache = true } = options;
  const remote = remotes[remoteName];

  if (!remote) {
    throw new Error(`Remote "${remoteName}" not found in configuration`);
  }

  // Return cached remote if already loaded
  if (useCache && cache[remoteName]?.loaded) {
    return;
  }

  // Check if already loading to prevent duplicate requests
  if (remoteName in loadingPromises) {
    return loadingPromises[remoteName];
  }

  // Create loading promise
  const loadPromise = (async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Check if already loaded in window
        if (window[remote.scope as keyof Window]) {
          if (!cache[remoteName]) {
            cache[remoteName] = { loaded: true, modules: {}, lastLoadTime: Date.now() };
          }
          delete loadingPromises[remoteName];
          return;
        }

        // Load the remote entry script
        await loadRemoteScript(remote.url, timeout);

        // Verify scope is available
        if (!window[remote.scope as keyof Window]) {
          throw new Error(`Remote scope "${remote.scope}" not available after loading`);
        }

        // Cache the loaded remote
        if (!cache[remoteName]) {
          cache[remoteName] = { loaded: true, modules: {}, lastLoadTime: Date.now() };
        } else {
          cache[remoteName].loaded = true;
          cache[remoteName].lastLoadTime = Date.now();
        }

        delete loadingPromises[remoteName];
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Log retry attempt
        if (attempt < retries - 1) {
          console.warn(
            `Failed to load remote ${remoteName} (attempt ${attempt + 1}/${retries}):`,
            lastError.message
          );
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    cache[remoteName] = {
      loaded: false,
      modules: {},
      error: lastError || new Error('Unknown error'),
    };
    delete loadingPromises[remoteName];
    throw lastError || new Error(`Failed to load remote ${remoteName} after ${retries} attempts`);
  })();

  loadingPromises[remoteName] = loadPromise;
  return loadPromise;
}

/**
 * Load a remote entry script with timeout
 */
function loadRemoteScript(url: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;

    const timeoutId = setTimeout(() => {
      reject(new Error(`Script load timeout for ${url}`));
    }, timeout);

    script.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load script: ${url}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Get a component from a remote scope with caching
 */
export async function getRemoteComponent(
  remoteName: string,
  componentPath: string,
  options: LoadOptions = {}
): Promise<React.ComponentType> {
  const { cache: useCache = true, ...loadOptions } = options;
  const remote = remotes[remoteName];

  if (!remote) {
    throw new Error(`Remote "${remoteName}" not found in configuration`);
  }

  // Check component cache
  if (useCache && cache[remoteName]?.modules?.[componentPath]) {
    return cache[remoteName].modules[componentPath];
  }

  // Load the remote if not already loaded
  await loadRemote(remoteName, { ...loadOptions, cache: useCache });

  try {
    // Access the remote scope
    const remoteScope = window[remote.scope as keyof Window] as any;
    if (!remoteScope) {
      throw new Error(`Remote scope not found: ${remote.scope}`);
    }

    // Initialize the container if not already done
    if (!remoteScope.__initialized) {
      const shareScope = (window as any).__webpack_share_scopes__?.default || {};
      await remoteScope.init(shareScope);
      remoteScope.__initialized = true;
    }

    // Get the module factory
    const factory = await remoteScope.get(componentPath);
    const Component = factory.default || factory;

    // Validate it's a React component or object
    if (!Component) {
      throw new Error(`Component not found at ${componentPath}`);
    }

    // Cache the component
    if (!cache[remoteName]) {
      cache[remoteName] = { loaded: true, modules: {} };
    }
    cache[remoteName].modules[componentPath] = Component;

    return Component;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw new Error(
      `Failed to get component ${componentPath} from remote ${remoteName}: ${err.message}`
    );
  }
}

/**
 * Get remote configuration
 */
export function getRemoteConfig(remoteName: string): RemoteConfig {
  const remote = remotes[remoteName];
  if (!remote) {
    throw new Error(`Remote "${remoteName}" not found in configuration`);
  }
  return remote;
}

/**
 * List all configured remotes
 */
export function listRemotes(): RemoteConfig[] {
  return Object.values(remotes);
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  totalRemotes: number;
  loadedRemotes: number;
  totalModules: number;
  cache: RemoteCache;
} {
  const loadedRemotes = Object.values(cache).filter((c) => c.loaded).length;
  const totalModules = Object.values(cache).reduce(
    (acc, c) => acc + Object.keys(c.modules).length,
    0
  );

  return {
    totalRemotes: Object.keys(remotes).length,
    loadedRemotes,
    totalModules,
    cache,
  };
}

/**
 * Clear cache (useful for development/testing)
 */
export function clearCache(): void {
  Object.keys(cache).forEach((key) => {
    delete cache[key];
  });
  Object.keys(loadingPromises).forEach((key) => {
    delete loadingPromises[key];
  });
  console.log('MFE cache cleared');
}

/**
 * Preload a remote (load before needed for faster UI)
 */
export async function preloadRemote(remoteName: string): Promise<void> {
  try {
    await loadRemote(remoteName, { cache: true });
    console.log(`Preloaded remote: ${remoteName}`);
  } catch (error) {
    console.warn(
      `Failed to preload remote ${remoteName}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Check if a remote is loaded
 */
export function isRemoteLoaded(remoteName: string): boolean {
  return !!cache[remoteName]?.loaded;
}

/**
 * Get remote load error (if any)
 */
export function getRemoteError(remoteName: string): Error | null {
  return cache[remoteName]?.error || null;
}

/**
 * Create a preload hook for React components (use inside useEffect)
 */
export function useRemotePreload(remoteNames: string[]): {
  loaded: string[];
  loading: boolean;
  error: Error | null;
} {
  const [loaded, setLoaded] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(remoteNames.length > 0);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const preload = async () => {
      const loadedRemotes: string[] = [];
      let lastError: Error | null = null;

      for (const remoteName of remoteNames) {
        try {
          await preloadRemote(remoteName);
          loadedRemotes.push(remoteName);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      setLoaded(loadedRemotes);
      setError(lastError);
      setLoading(false);
    };

    preload();
  }, [remoteNames]);

  return { loaded, loading, error };
}

// Import React for useRemotePreload hook
import React from 'react';
