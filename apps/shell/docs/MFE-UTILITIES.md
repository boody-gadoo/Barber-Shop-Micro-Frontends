# Module Federation Utilities Guide

Comprehensive utilities for loading and managing remote micro frontends in the Shell host application.

## Core Utilities (`src/utils/mfe.ts`)

### `loadRemote(remoteName, options?)`

Load a remote entry script dynamically with retry logic and timeout handling.

**Parameters:**
- `remoteName` (string) — Remote name from config ('services' | 'booking')
- `options` (LoadOptions, optional)
  - `timeout` (number, default: 30000) — Script load timeout in ms
  - `retries` (number, default: 3) — Number of retry attempts
  - `cache` (boolean, default: true) — Use cached remotes

**Returns:** Promise<void>

**Example:**
```typescript
// Load with defaults
await loadRemote('services');

// Load with custom options
await loadRemote('booking', {
  timeout: 60000,
  retries: 5,
  cache: true,
});
```

**Error Handling:**
```typescript
try {
  await loadRemote('services');
} catch (error) {
  console.error('Failed to load services remote:', error.message);
}
```

### `getRemoteComponent(remoteName, componentPath, options?)`

Load and cache a component from a remote scope.

**Parameters:**
- `remoteName` (string) — Remote name ('services' | 'booking')
- `componentPath` (string) — Component export path (e.g., './Container')
- `options` (LoadOptions, optional) — Same as loadRemote

**Returns:** Promise<React.ComponentType>

**Example:**
```typescript
const ServicesComponent = await getRemoteComponent('services', './Container');

// In a React component
const [Component, setComponent] = useState(null);

useEffect(() => {
  (async () => {
    const Comp = await getRemoteComponent('services', './Container');
    setComponent(() => Comp);
  })();
}, []);

if (!Component) return <div>Loading...</div>;
return <Component />;
```

### `listRemotes()`

Get all configured remote configurations.

**Returns:** RemoteConfig[]

**Example:**
```typescript
const allRemotes = listRemotes();
// [
//   { name: 'services', url: '...', scope: 'services' },
//   { name: 'booking', url: '...', scope: 'booking' }
// ]
```

### `preloadRemote(remoteName)`

Preload a remote before it's needed (fire-and-forget).

**Parameters:**
- `remoteName` (string) — Remote name to preload

**Returns:** Promise<void>

**Example:**
```typescript
// Preload in background when app loads
useEffect(() => {
  preloadRemote('services');
  preloadRemote('booking');
}, []);
```

### `isRemoteLoaded(remoteName)`

Check if a remote is already loaded.

**Parameters:**
- `remoteName` (string) — Remote name

**Returns:** boolean

**Example:**
```typescript
if (isRemoteLoaded('services')) {
  // Remote is ready, load component immediately
} else {
  // Remote not loaded yet
}
```

### `getRemoteError(remoteName)`

Get any error from loading a remote (useful for debugging).

**Parameters:**
- `remoteName` (string) — Remote name

**Returns:** Error | null

**Example:**
```typescript
const error = getRemoteError('services');
if (error) {
  console.error('Services remote error:', error.message);
}
```

### `getCacheStats()`

Get debugging information about loaded remotes and components.

**Returns:** Object with cache statistics

**Example:**
```typescript
const stats = getCacheStats();
console.log(stats);
// {
//   totalRemotes: 2,
//   loadedRemotes: 1,
//   totalModules: 3,
//   cache: { ... }
// }
```

### `clearCache()`

Clear all cached remotes and components (development/testing only).

**Example:**
```typescript
clearCache();
// All cached remotes cleared, will reload on next access
```

---

## React Hooks

### `useMFE(remoteName, modulePath, options?)`

Hook for loading a remote component.

**Parameters:**
- `remoteName` (string) — Remote name
- `modulePath` (string) — Component path
- `options` (LoadOptions, optional) — Load options

**Returns:**
```typescript
{
  Component: React.ComponentType | null,
  error: Error | null,
  isLoading: boolean
}
```

**Example:**
```typescript
function MyComponent() {
  const { Component, error, isLoading } = useMFE(
    'services',
    './Container'
  );

  if (isLoading) return <div>Loading services...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <Component />;
}
```

### `usePreloadRemotes(remoteNames)`

Hook to preload multiple remotes.

**Parameters:**
- `remoteNames` (string[]) — Array of remote names

**Returns:**
```typescript
{
  loaded: string[],
  errors: Record<string, Error>,
  isLoading: boolean
}
```

**Example:**
```typescript
function App() {
  const { loaded, errors, isLoading } = usePreloadRemotes([
    'services',
    'booking',
  ]);

  return (
    <div>
      {isLoading && <div>Preloading...</div>}
      {Object.entries(errors).map(([remote, error]) => (
        <div key={remote}>Error loading {remote}: {error.message}</div>
      ))}
      {/* App content */}
    </div>
  );
}
```

---

## Components

### `<RemoteWrapper remote="name" module="./Path" />`

Component that handles loading and rendering a remote component with error handling and loading states.

**Props:**
- `remote` (string) — Remote name
- `module` (string) — Module path to load
- `fallback` (ReactNode, optional) — Custom loading/error fallback

**Example:**
```tsx
<Route
  path="/services"
  element={<RemoteWrapper remote="services" module="./Container" />}
/>
```

### `<RemotePreloader remotes={['services', 'booking']} />`

Component that preloads remotes in the background.

**Props:**
- `remotes` (string[]) — Array of remote names to preload
- `onComplete` (function, optional) — Callback when all loaded
- `onError` (function, optional) — Callback on load error

**Example:**
```tsx
function App() {
  return (
    <div>
      <RemotePreloader
        remotes={['services', 'booking']}
        onComplete={(loaded) => console.log('Preloaded:', loaded)}
        onError={(err, remote) => console.error(`Failed: ${remote}`, err)}
      />
      {/* Rest of app */}
    </div>
  );
}
```

---

## Usage Patterns

### Pattern 1: Route-Based Loading

Load MFEs when user navigates to a route.

```typescript
<Routes>
  <Route
    path="/services"
    element={<RemoteWrapper remote="services" module="./Container" />}
  />
  <Route
    path="/booking"
    element={<RemoteWrapper remote="booking" module="./Container" />}
  />
</Routes>
```

### Pattern 2: Preload on App Start

Preload remotes when app initializes for faster navigation.

```typescript
function App() {
  useEffect(() => {
    preloadRemote('services');
    preloadRemote('booking');
  }, []);

  return <Routes>{/* ... */}</Routes>;
}
```

### Pattern 3: Conditional Loading

Load remotes only when needed based on feature flags or user role.

```typescript
function Dashboard() {
  const { isPremium } = useUser();

  useEffect(() => {
    if (isPremium) {
      preloadRemote('booking');
    }
  }, [isPremium]);

  return isPremium ? (
    <RemoteWrapper remote="booking" module="./Container" />
  ) : (
    <div>Premium feature</div>
  );
}
```

### Pattern 4: Error Recovery

Handle load failures gracefully with retry logic.

```typescript
async function loadWithFallback() {
  try {
    const Component = await getRemoteComponent('services', './Container');
    return Component;
  } catch (error) {
    console.error('Failed to load services:', error);
    // Load fallback local component
    return LocalServicesComponent;
  }
}
```

---

## Debugging

### Enable Debug Logging

RemotePreloader shows debug info in development mode:

```typescript
<RemotePreloader remotes={['services', 'booking']} />
// Shows status in bottom-left corner during development
```

### Inspect Cache

View what's loaded in the browser console:

```typescript
// In browser console
window.__mfeCache = getCacheStats();
console.log(window.__mfeCache);
```

### Clear Cache Between Tests

```typescript
beforeEach(() => {
  clearCache();
});
```

---

## Performance Tips

1. **Preload critical remotes** during app initialization
2. **Use lazy loading** for optional remotes
3. **Enable caching** (default) to avoid reloads
4. **Set appropriate timeouts** for slow networks
5. **Batch preload** related remotes together
6. **Monitor cache size** with `getCacheStats()`

---

## Configuration

Remote URLs and scopes configured in `mfe.ts`:

```typescript
const remotes: Record<string, RemoteConfig> = {
  services: {
    name: 'services',
    url: 'http://localhost:3002/remoteEntry.js',
    scope: 'services',
  },
  booking: {
    name: 'booking',
    url: 'http://localhost:3003/remoteEntry.js',
    scope: 'booking',
  },
};
```

Update these URLs when deploying to different environments.

---

## Error Types

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `Remote not found` | Invalid remote name | Check remote name is correct |
| `Script load timeout` | Remote server slow/down | Increase timeout or check server |
| `Remote scope not available` | Script loaded but init failed | Check remote exports correctly |
| `Component not found` | Wrong module path | Verify export path in remote |
| `Failed after N attempts` | Network issues | Check connectivity, retry |

---

## Production Checklist

- [ ] Configure remote URLs for production environment
- [ ] Set appropriate timeouts for network conditions
- [ ] Implement error logging/monitoring
- [ ] Test failover scenarios
- [ ] Monitor shared dependency versions
- [ ] Cache and CDN strategy for remote entries
- [ ] Error boundaries around all RemoteWrappers
- [ ] Performance budgets for remote chunks
