# Module Federation — Implementation Details

**Reference**: ADR-002-module-federation.md  
**Status**: Approved  
**Version**: 1.0

## What Is Module Federation?

Module Federation is a **Webpack feature** that enables a JavaScript application to **dynamically load code from another application at runtime**.

It is:
- An **implementation mechanism** for Micro Frontends
- A way to share JavaScript modules across application boundaries
- A build-time + runtime system
- NOT the definition of Micro Frontends itself

### Key Distinction

```text
Micro Frontends (Architecture)
    ↓
Module Federation (Implementation)
    ↓
Webpack 5+
```

You could implement Micro Frontends with:
- Module Federation (Webpack)
- iframes (old-school)
- Web Components + dynamic imports
- Multiple SPAs at different routes

We chose **Module Federation** because it:
- ✅ Enables true runtime composition
- ✅ Shares code/dependencies efficiently
- ✅ Supports versioning
- ✅ Provides good DX
- ✅ Industry standard

## Core Concepts

### 1. Host Application

**Definition**: The main application that loads other applications.

**Responsibilities**:
- Loads the initial HTML
- Manages global layout/shell
- Loads remote entries dynamically
- Handles remote loading errors
- Provides shared dependencies

**In Our Project**: `shell` is the Host

```javascript
// shell/webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        services: 'services@/remotes/services-react.js',
        booking: 'booking@/remotes/booking-angular.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
}
```

### 2. Remote Applications

**Definition**: Applications loaded dynamically by the Host.

**Responsibilities**:
- Export modules via `exposes`
- Consume shared dependencies
- Handle loading errors
- Are loaded on-demand or at startup

**In Our Project**: `booking-angular` and `services-react` are Remotes

```javascript
// services-react/webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'services',
      exposes: {
        './ServicesContainer': './src/ServicesContainer.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
}
```

### 3. Remote Entry Point

**Definition**: The JavaScript file that Module Federation generates. It's the entry point for loading a remote.

**Generated at build time**:
```text
services-react/
├── dist/
│   ├── remoteEntry.js        ← The remote entry
│   ├── main.js               ← Other chunks
│   └── styles.css
```

**Deployed to a static server**:
```text
https://cdn.example.com/remotes/services-react/remoteEntry.js
```

**Loaded by the Host**:
```javascript
const { mount } = await import('services/ServicesContainer')
```

### 4. Exposes

**Definition**: Modules that a remote makes available to other applications.

```javascript
// services-react/webpack.config.js
exposes: {
  './Container': './src/Container.tsx',      // Main component
  './types': './src/types/index.ts',         // Types
  './utils': './src/utils/index.ts',         // Utilities
}
```

**Usage in Host**:
```javascript
// shell/src/pages/Services.tsx
const { default: ServicesContainer } = await import('services/Container')
```

### 5. Consumes

**Definition**: Modules that a remote depends on (usually implicit in shared dependencies).

```javascript
// booking-angular/webpack.config.js
shared: {
  'react': { eager: false, singleton: true },
  'react-dom': { eager: false, singleton: true },
  '@angular/common': { singleton: true },
}
```

The remote **consumes** these modules from the Host, not bundling them locally.

### 6. Shared Dependencies

**Definition**: Code that multiple applications use but only needs to be loaded once.

```javascript
// Host
shared: {
  'react': { singleton: true, requiredVersion: '^18.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  '@angular/common': { singleton: true },
}

// Remote
shared: {
  'react': { singleton: true },
  '@angular/common': { singleton: true },
}
```

**Benefits**:
- ✅ Smaller bundle sizes
- ✅ Shared memory
- ✅ One copy of library loaded

**Risks**:
- ⚠️ Version conflicts
- ⚠️ Runtime errors if incompatible versions

### 7. Runtime Loading

**Definition**: The Host loads remotes at runtime, not build time.

```javascript
// shell/src/remotes.ts
const loadRemote = async (name: string) => {
  try {
    const container = window[name]
    await container.init(__webpack_share_scopes__.default)
    const factory = await container.get(moduleName)
    return factory()
  } catch (error) {
    console.error(`Failed to load ${name}:`, error)
    throw error
  }
}
```

**Why runtime loading?**
- ✅ Remotes can be deployed independently
- ✅ Host doesn't need to rebuild when remote updates
- ✅ Can switch remote URLs without rebuilding host
- ✅ Can disable remotes via configuration

### 8. Version Negotiation

**Definition**: At runtime, Module Federation negotiates which version of a shared dependency to use.

```javascript
// Host has React 18.0.0
// Remote requires React 18.2.0

// Runtime negotiation:
// - Host says: "I have React 18.0.0"
// - Remote checks: "Can I use 18.0.0?" (semver check)
// - If yes: Use Host's version
// - If no: Remote provides its own

// Result: No duplication, version conflict resolved
```

### Singleton Pattern

Used for libraries that should only load once globally:

```javascript
shared: {
  'react': {
    singleton: true,        // Only one version loads
    requiredVersion: '^18', // Accept versions matching ^18
    strictVersion: false,   // Don't require exact match
    eager: false,           // Host doesn't eagerly load
  }
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│          Shell (Host)                   │
│                                         │
│  - Loads remotes dynamically            │
│  - Manages layout                       │
│  - Routes to remotes                    │
│                                         │
│  Shared Dependencies:                   │
│  - React 18.x                          │
│  - React Router                        │
│  - Tailwind CSS                        │
│  - Design Tokens                       │
└──────────┬────────────────┬─────────────┘
           │                │
     (dynamic)        (dynamic)
           │                │
      ┌────▼──────────┐  ┌──▼────────────┐
      │  Services     │  │  Booking      │
      │  React Remote │  │  Angular Rem. │
      │               │  │               │
      │ Exposes:      │  │ Exposes:      │
      │ - Container   │  │ - Container   │
      │ - utils       │  │ - utils       │
      │               │  │               │
      │ Shared:       │  │ Shared:       │
      │ - React       │  │ - React       │
      │ - Tokens      │  │ - Angular     │
      │ - Routing     │  │ - Tokens      │
      └───────────────┘  └───────────────┘
```

## Configuration Example

### Host (Shell) Configuration

```javascript
// webpack.config.js
const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      
      // What this app exposes
      exposes: {
        './Layout': './src/Layout.tsx',
      },
      
      // What this app loads from other apps
      remotes: {
        services: 'services@http://localhost:3002/remoteEntry.js',
        booking: 'booking@http://localhost:3003/remoteEntry.js',
      },
      
      // What this app provides to remotes
      shared: {
        'react': { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true },
        '@design-tokens/core': { singleton: true },
      },
    }),
  ],
}
```

### Remote (Services) Configuration

```javascript
// services-react/webpack.config.js
const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'services',
      
      // What this remote exposes
      exposes: {
        './Container': './src/Container.tsx',
        './utils': './src/utils/index.ts',
      },
      
      // This remote doesn't load other remotes (in phase 1)
      remotes: {},
      
      // Shared dependencies with Host
      shared: {
        'react': { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
        '@design-tokens/core': { singleton: true },
      },
    }),
  ],
}
```

### Remote (Booking) Configuration

```javascript
// booking-angular/webpack.config.js
const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'booking',
      
      // What this remote exposes
      exposes: {
        './Container': './src/app/Container.ts',
      },
      
      // Shared dependencies
      shared: {
        '@angular/common': { singleton: true },
        '@angular/core': { singleton: true },
        'rxjs': { singleton: true },
        '@design-tokens/core': { singleton: true },
      },
    }),
  ],
}
```

## Runtime Loading Pattern

```typescript
// shell/src/services/RemoteLoader.ts
export interface RemoteConfig {
  name: string
  url: string
  componentPath: string
  fallbackComponent: React.ComponentType
}

export async function loadRemoteComponent(
  config: RemoteConfig
): Promise<React.ComponentType> {
  try {
    // 1. Ensure Module Federation container is initialized
    const container = window[config.name]
    if (!container) {
      throw new Error(`Remote ${config.name} not found`)
    }

    // 2. Initialize shared scopes
    await container.init(__webpack_share_scopes__.default)

    // 3. Load the component factory
    const factory = await container.get(config.componentPath)
    
    // 4. Create component from factory
    return factory.default || factory()
  } catch (error) {
    console.error(`Failed to load remote ${config.name}:`, error)
    return config.fallbackComponent
  }
}
```

## Deployment Model

### Development

```text
Host runs on: http://localhost:3000
Services remote runs on: http://localhost:3002
Booking remote runs on: http://localhost:3003

Host's Module Federation config points to:
  services: http://localhost:3002/remoteEntry.js
  booking: http://localhost:3003/remoteEntry.js
```

### Production

```text
Host deployed to: https://example.com/
Services remote deployed to: https://cdn.example.com/remotes/services-react/v1.2.0/remoteEntry.js
Booking remote deployed to: https://cdn.example.com/remotes/booking-angular/v2.3.0/remoteEntry.js

Host's Module Federation config points to:
  services: https://cdn.example.com/remotes/services-react/v1.2.0/remoteEntry.js
  booking: https://cdn.example.com/remotes/booking-angular/v2.3.0/remoteEntry.js
```

### Independent Remote Deployment

```text
Scenario: Services team releases new version

1. Services team develops feature
2. Tests pass, PR approved
3. Build: services-react/dist/remoteEntry.js (v1.2.0 → v1.3.0)
4. Deploy to CDN: /remotes/services-react/v1.3.0/remoteEntry.js
5. Update Host's federation config to point to v1.3.0
6. Rebuild Host (just host, not entire monorepo)
7. Deploy Host to https://example.com
8. Users get new services feature
9. Booking remote unaffected, no rebuild needed
```

**Result**: 
- Services deployed independently ✅
- Booking not affected ✅
- Host rebuilt (fast, just config change) ✅
- Users get new version ✅
- No booking downtime ✅

## Version Negotiation Example

### Scenario: Version Mismatch Handled

```javascript
// Host has React 18.0.0
// Services remote built for React 18.2.0

// federation config
shared: {
  'react': {
    singleton: true,
    requiredVersion: '^18.0.0',  // Accepts 18.x
    strictVersion: false,        // Not strict
  }
}

// Runtime:
// Host: "I have react@18.0.0"
// Remote checks: "Is 18.0.0 compatible with ^18.0.0?" → YES
// Remote uses Host's React 18.0.0
// Result: No duplicate code loaded ✅
```

## Fallback & Error Handling

### Remote Loading Error

```typescript
// shell/src/components/RemoteWrapper.tsx
export interface RemoteWrapperProps {
  config: RemoteConfig
}

export function RemoteWrapper({ config }: RemoteWrapperProps) {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    loadRemoteComponent(config)
      .then(setComponent)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [config])

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <ErrorState
        title={`${config.name} is temporarily unavailable`}
        description={`We're working on getting this back online.`}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!Component) {
    return <ComponentNotFound name={config.name} />
  }

  return <Component />
}
```

## Shared Dependencies Strategy

### What Gets Shared?

1. **Essential Libraries** (must be singleton)
   ```text
   - react/react-dom
   - @angular/core
   - rxjs (if both use it)
   ```

2. **Design System**
   ```text
   - @design-tokens/core (colors, typography)
   - Tailwind CSS (same config)
   ```

3. **Utilities** (if truly shared)
   ```text
   - date-fns (date formatting)
   - lodash (common utils)
   ```

### What Does NOT Get Shared?

❌ **No Business Logic**
```text
- Booking service state
- Services filtering logic
- Custom hooks with business logic
```

❌ **No Framework-Specific Code**
```text
- React Hooks (unless genuinely framework-neutral)
- Angular Services mixed with React
```

## Trade-offs

### Benefits
- ✅ No code duplication
- ✅ Smaller bundle sizes
- ✅ Shared memory
- ✅ Independent deployment
- ✅ Runtime flexibility

### Trade-offs
- ⚖️ Complex webpack configuration
- ⚖️ Version negotiation complexity
- ⚖️ Debugging harder (code from different sources)
- ⚖️ Build-time complexity
- ⚖️ Network latency for loading remotes

### Risks
- ⚠️ Version conflicts at runtime
- ⚠️ Remote fails to load
- ⚠️ API versioning breaks
- ⚠️ Duplicate dependencies anyway (if not configured correctly)

## When This Implementation Is Successful

### Build-Time
- [ ] Host builds without including remote code
- [ ] Each remote builds independently
- [ ] No circular dependencies
- [ ] Shared dependencies optimized

### Runtime
- [ ] Host loads and displays
- [ ] Remotes load on-demand without delay
- [ ] Shared dependencies loaded only once
- [ ] Version negotiation succeeds

### Deployment
- [ ] Each remote deployable independently
- [ ] Host doesn't rebuild when remote updates
- [ ] No downtime during remote updates
- [ ] Rollback possible

### Debugging
- [ ] Errors trace back to source
- [ ] Development experience is smooth
- [ ] DevTools show correct files

---

## References

- [Webpack Module Federation Documentation](https://webpack.js.org/concepts/module-federation/)
- [Nx Module Federation Guide](https://nx.dev/concepts/module-federation)
- Zack Jackson: [Webpack Module Federation](https://module-federation.io/)

