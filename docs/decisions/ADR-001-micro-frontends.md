# ADR-001: Adopt Micro Frontends for Business-Capability Composition

**Date**: September 26, 2026  
**Status**: Accepted  
**Authors**: Frontend Architecture Team  
**Reviewers**: Engineering Leadership

## Context

The Barber Shop platform (`حلاقة البلد` / Helaqat El Balad) is a modern Egyptian barber shop product requiring:

1. **Multiple Independent Features**
   - Booking system (service/barber/date/time selection)
   - Services & Offers catalog
   - Barber management (future)
   - Reviews & gallery (future)
   - Customer bookings (future)

2. **Multi-Framework Requirements**
   - **Angular** preferred for complex state management (Booking)
   - **React** preferred for content-heavy UI (Services)
   - Both need to coexist in one application

3. **Team Autonomy**
   - Different teams own different capabilities
   - Teams need independent deployment authority
   - Teams should not block each other's releases

4. **Scalability**
   - Add new features without touching existing code
   - Support multiple teams working in parallel
   - Reduce merge conflicts and coordination overhead

5. **User Experience**
   - Seamless integrated experience (not multiple SPA-like switches)
   - Consistent visual design and interactions
   - Shared navigation and layout
   - Single authentication/session

## Problem

A traditional monolithic frontend architecture would:

- ❌ Force all code into one framework (Angular or React)
- ❌ Create build-time coupling between features
- ❌ Require entire application rebuild for any change
- ❌ Block one team while another team deploys
- ❌ Make failure in one feature crash entire application
- ❌ Increase merge conflicts as codebase grows
- ❌ Create unclear ownership of features

## Decision

**We will adopt Micro Frontends with business-capability boundaries as our architectural pattern.**

### What This Means

1. **Business-Capability Ownership**
   - Booking MFE: Owned by Booking Team
   - Services MFE: Owned by Services Team
   - Shell/Host: Owned by Platform Team

2. **Independent Technology Choices**
   - Booking: Angular + TypeScript
   - Services: React + TypeScript
   - Shared: Framework-neutral design tokens + utilities

3. **Runtime Composition via Module Federation**
   - Shell loads remotes at runtime
   - Each MFE builds independently
   - Deploys independently
   - No build-time coupling

4. **Minimal Shared Code**
   - Only design tokens and types
   - No shared business logic
   - No shared feature state
   - API contracts are the integration point

5. **Explicit Communication**
   - Preferred: URL parameters
   - Secondary: Shared API layer
   - Avoid: Direct component imports

### Architecture

```
Shell (Host) — TypeScript + React for layout
├── Services MFE (React) — Services & Offers catalog
└── Booking MFE (Angular) — Booking flow

Shared:
├── Design Tokens (framework-neutral)
├── API Contracts (types)
├── Utilities (pure functions)
└── Mock API (MSW)
```

## Alternatives Considered

### Alternative 1: Single Monolithic React/Angular App
**Pros**: 
- Simpler build setup
- Easier debugging
- No version negotiation

**Cons**:
- ❌ Can't use both Angular and React
- ❌ One framework slower for features
- ❌ Entire app deploys for one change
- ❌ Merge conflicts at scale
- ❌ No failure isolation

**Decision**: Rejected — doesn't meet multi-framework requirement

### Alternative 2: Separate Full SPAs (Multiple Routes)
**Pros**:
- Maximum independence
- Easy to deploy separately
- Can use different frameworks

**Cons**:
- ❌ User experiences multiple apps, not one app
- ❌ No shared layout/navigation
- ❌ Poor UX (full page reloads)
- ❌ Hard to share session/auth
- ❌ Each app has own header/footer

**Decision**: Rejected — doesn't meet UX requirement

### Alternative 3: iframes (Old-School Isolation)
**Pros**:
- Maximum isolation (each app in sandbox)
- Easy to add/remove features

**Cons**:
- ❌ Poor UX (frame borders, clunky)
- ❌ Communication hard (postMessage)
- ❌ Can't share layout elegantly
- ❌ Performance overhead
- ❌ Accessibility complexity

**Decision**: Rejected — outdated approach

### Alternative 4: Web Components + Dynamic Imports (DIY)
**Pros**:
- Framework-agnostic containers
- Pure web standards

**Cons**:
- ❌ No built-in dependency sharing
- ❌ Duplicated dependencies in each MFE
- ❌ Bundle size explodes
- ❌ More complex to implement than Module Federation
- ❌ No version negotiation

**Decision**: Rejected — Module Federation handles this better

## Consequences

### Positive Consequences ✅

1. **Team Autonomy**
   - Each team owns their MFE end-to-end
   - Deploy without coordinating with other teams
   - Choose Angular or React per feature

2. **Independent Deployment**
   - Services team deploys new services → booking not affected
   - Booking team deploys new flow → services not affected
   - Zero coordination needed

3. **Technology Flexibility**
   - Complex form state → Angular + RxJS
   - Content-heavy UI → React Hooks
   - Right tool for each job

4. **Failure Isolation**
   - Services remote fails → Shell still works
   - Booking remote fails → Services still accessible
   - Graceful degradation, not full crash

5. **Scalability**
   - Easy to add 4th, 5th MFE later
   - Teams grow independently
   - New features don't touch existing code

6. **Clear Ownership**
   - Who owns Booking? → Booking Team
   - Who owns Services? → Services Team
   - No ambiguity

### Negative Consequences ⚠️

1. **Increased Complexity**
   - Module Federation configuration
   - Build and deployment orchestration
   - Version negotiation at runtime
   - More moving parts to understand

2. **Bundle Size Management**
   - Must coordinate shared dependencies carefully
   - Version mismatches cause duplication
   - Requires tooling and monitoring

3. **Debugging Difficulty**
   - Error trace spans multiple build artifacts
   - Remote loading failures harder to diagnose
   - DevTools show multiple sources

4. **Testing Complexity**
   - Unit tests per MFE (simple)
   - Integration tests across MFEs (harder)
   - E2E tests needed to verify interaction
   - More test environments to manage

5. **Learning Curve**
   - Team must understand Module Federation
   - Deployment model different from monolith
   - Debugging patterns different

### Neutral Consequences ⚖️

1. **More Repositories or Monorepo**
   - We chose monorepo with Nx
   - Still separate build artifacts per MFE
   - Separate deployments possible

2. **More Configuration Files**
   - webpack/Vite config per MFE
   - Module Federation per MFE
   - More to maintain but clearer

## Implementation Strategy

### Phase 1: Foundation (This Sprint)
- [ ] Establish workspace (pnpm + Nx)
- [ ] Configure TypeScript
- [ ] Set up design tokens package
- [ ] Create API contracts
- [ ] Configure ESLint + Prettier
- [ ] GitHub Actions baseline

### Phase 2: Shell
- [ ] Create Shell/Host application
- [ ] Configure Module Federation (host mode)
- [ ] Implement layout and routing skeleton
- [ ] Set up error boundaries

### Phase 3: Services MFE
- [ ] Create React application
- [ ] Configure Module Federation (remote mode)
- [ ] Implement services listing and details
- [ ] Connect to Shell

### Phase 4: Booking MFE
- [ ] Create Angular application
- [ ] Configure Module Federation (remote mode)
- [ ] Implement booking flow
- [ ] Connect to Shell

### Phase 5: Integration & Testing
- [ ] Test MFE communication
- [ ] Test failure scenarios
- [ ] E2E tests
- [ ] Performance optimization

### Phase 6: Production Readiness
- [ ] Security review
- [ ] Accessibility audit
- [ ] SEO implementation
- [ ] Deployment pipeline

## Success Criteria

### Build-Time
- [ ] Each MFE builds independently
- [ ] Shell builds without including MFE code
- [ ] No circular dependencies
- [ ] Incremental builds work

### Runtime
- [ ] Shell displays and is interactive
- [ ] Services MFE loads and displays
- [ ] Booking MFE loads and displays
- [ ] MFE failure doesn't crash Shell
- [ ] Shared dependencies loaded once

### Deployment
- [ ] Services MFE deployable independently
- [ ] Booking MFE deployable independently
- [ ] Shell deployable independently
- [ ] No downtime during updates
- [ ] Rollback possible

### Organizational
- [ ] Teams understand boundaries
- [ ] Teams can work in parallel
- [ ] Deployment coordination minimal
- [ ] Changes don't affect other teams

## Follow-Up Decisions

This decision requires follow-ups:

1. **ADR-002**: Module Federation implementation details
2. **ADR-003**: Nx + pnpm workspace configuration
3. **ADR-004**: Design tokens package structure
4. **ADR-005**: API contract strategy
5. **ADR-006**: MSW mock API setup
6. **ADR-007**: Error isolation and boundaries
7. **ADR-008**: MFE communication patterns
8. **ADR-009**: State management strategy

## References

- [Martin Fowler: Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
- [Cam Jackson: Micro Frontends](https://micro-frontends.org/)
- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Thoughtworks Technology Radar](https://www.thoughtworks.com/radar)

