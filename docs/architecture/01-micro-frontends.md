# Micro Frontends Architecture — Concepts & Principles

**Reference**: ADR-001-micro-frontends.md  
**Status**: Approved  
**Version**: 1.0

## What Are Micro Frontends?

Micro Frontends are an architectural pattern for building front-end applications by decomposing them into smaller, semi-independent **business capabilities** that work together. Each capability is owned by a **small team** and can be developed, tested, and deployed **independently**.

### Definition

> A micro frontend is a view in a front-end application that is owned by one team. It is independently deliverable. — Cam Jackson, Thoughtworks

### Key Properties

1. **Business-Capability Ownership**: Each micro frontend aligns with a business function, not a technical layer
2. **Independence**: Teams can work in parallel with minimal coordination
3. **Technology Agnostic**: Each MFE can use different frameworks (Angular, React, Vue, Svelte)
4. **Loose Coupling**: Minimal shared code and explicit contracts
5. **Autonomous Deployment**: One team can deploy without affecting others

## Why Micro Frontends Exist

### Problems They Solve

#### 1. **Monolithic Frontend Challenges**
- **Single Technology Lock-in**: Entire team bound to one framework
- **Scaling Pain**: Large teams stepping on each other
- **Deployment Bottleneck**: One bug blocks all deployments
- **Slow Feature Velocity**: Cross-team dependencies slow releases

#### 2. **Team Organization**
- Different teams have different expertise
- Teams want autonomy over their technical choices
- Teams need independent deployment authority
- Teams should not block each other

#### 3. **Code Boundary Problems**
- Monolithic SPA code grows unchecked
- Shared business logic becomes tangled
- It becomes unclear who owns what feature
- Testing dependencies increase

### What Micro Frontends Enable

1. **Team Autonomy**: Teams own features from UI to API contracts
2. **Independent Deployment**: No release coordination needed
3. **Technology Flexibility**: Use the right tool for each feature
4. **Failure Isolation**: One MFE failure doesn't crash the entire app
5. **Parallel Development**: Reduced merge conflicts and coordination
6. **Clear Ownership**: Who owns what is explicit
7. **Testability**: Features tested independently
8. **Scalability**: Easier to add new capabilities

## When to Use Micro Frontends

✅ **Good Fit**

- Multiple teams maintaining different features
- Teams need independent deployment cycles
- Features use significantly different technologies
- Features have different performance requirements
- Teams are geographically distributed
- Features are genuinely independent
- Failure in one feature should not crash others
- You need to scale development to many teams

❌ **Not a Good Fit**

- Fewer than 3-4 teams (overhead > benefit)
- Tiny application (a few pages)
- Heavy cross-feature dependencies
- Shared state across all MFEs
- All teams use identical tech stack anyway
- Performance is extremely critical
- Application is not expected to grow

## Micro Frontends ≠ Microservices

### Key Differences

| Aspect | Micro Frontends | Microservices |
|--------|-----------------|---------------|
| **Scope** | UI layer composition | Full application services |
| **Team** | Frontend team | Backend service team |
| **Communication** | URL, events, shared API | HTTP/gRPC APIs, message queues |
| **Technology** | JavaScript frameworks | Any backend language |
| **Database** | Shared initially | Ideally separate |
| **Deployment** | JavaScript bundle | Container/service |
| **Coupling** | Tight browser coupling | Network coupling |
| **Complexity** | Moderate | High |

### Micro Frontends + Microservices

The **best practice** is using both together:

```
Frontend Architecture       Backend Architecture
├── Micro Frontends   <--  ├── Microservices
├── Module Federation <--  ├── API Gateway
├── Shared Design System    ├── Service Mesh
└── Runtime Composition     └── Independent Deployment
```

Each backend microservice is owned by the same team that owns the corresponding frontend MFE. This creates **true business-capability ownership**.

## Business Capabilities Model

The Barber Shop Micro Frontend project is organized around **business capabilities**, not technical layers:

### Capability: Booking
**Owner**: Booking Team  
**Responsibilities**:
- Service selection UI
- Barber selection UI
- Date selection UI
- Time slot selection UI
- Customer details collection
- Booking confirmation
- Booking state management
- Booking creation API client
- Booking validation

**Implementation**: Angular remote MFE

---

### Capability: Services & Offers
**Owner**: Services Team  
**Responsibilities**:
- Services list UI
- Service details UI
- Offers list UI
- Offer details UI
- Price display
- Service filtering
- Services API client

**Implementation**: React remote MFE

---

### Capability: Shell / Host
**Owner**: Platform Team  
**Responsibilities**:
- Global application layout
- Navigation/routing composition
- MFE loading and error boundaries
- Global header/footer
- Authentication UI state
- Theme/language switching
- Telemetry entry point
- Error isolation

**Non-Responsibilities**:
- Booking business logic
- Services business logic
- API calls specific to features

---

### Future Capabilities (Not Phase 1)
- Barbers (listing, profiles)
- Reviews (listing, details)
- Gallery (images)
- Admin (management UI)
- Customer Bookings (history, management)

## Communication Between MFEs

### Hierarchy (Preferred Order)

1. **URL / Route State** (Preferred)
   - Service ID in URL: `/book?serviceId=fade`
   - Booking ID in URL: `/bookings/123`
   - Minimal coupling, bookmarkable

2. **API** (Implicit)
   - Both MFEs fetch shared data
   - No direct coupling
   - State synchronized via server

3. **Custom Events** (Rare)
   - Browser events for cross-MFE signaling
   - Use only when necessary
   - Document explicitly

4. **Shared State** (Last Resort)
   - Only for genuinely global state
   - Authentication, theme, language
   - Explicit store with clear ownership

### Anti-Pattern: Direct Imports

❌ **Never Do This**:
```javascript
// services-react
import { getServiceId } from 'booking-angular'

// booking-angular
import { ServiceDetails } from 'services-react'
```

This creates:
- Direct build-time coupling
- Technology lock-in
- Breaks independent deployment
- Defeats the purpose of MFEs

## Independent Deployment

### Definition

Each MFE can be deployed **without coordinating with other teams**.

### Requirements

1. **Versioned Remote Entry Point**
   ```text
   /services-remote.js       (v1.0.0)
   /booking-remote.js        (v2.1.0)
   ```

2. **Backwards-Compatible APIs**
   - New API versions don't break old consumers
   - Old versions remain available briefly

3. **No Hard Version Dependencies**
   - Shell doesn't hard-require `booking-remote@2.1.0`
   - Shell loads whatever version is deployed
   - Version negotiation happens at runtime

4. **Feature Flags / Graceful Degradation**
   - New features fail gracefully in old shells
   - Old shells don't crash with new remotes

### Deployment Flow Example

**Scenario**: Services team deploys new version

```text
1. Services team updates React remote
2. Tests pass, code reviews approved
3. Build: services-remote.js@2.0.0
4. Deploy to CDN: /remotes/services-react/2.0.0/index.js
5. Shell's module federation config updated to point to v2.0.0
6. Shell rebuilds (just shell, not remotes)
7. Users get new services remote
8. Zero downtime, no booking-angular redeploy needed
```

**Result**:
- Booking team unaffected
- Booking remote not redeployed
- Services remote independent
- Clear version management

## Error Isolation

### Principle

If one MFE crashes, the application must continue working.

### Implementation

1. **Error Boundaries**
   - React: ErrorBoundary component
   - Angular: ErrorHandler service + try/catch

2. **Remote Loading Fallback**
   ```javascript
   try {
     await loadRemote('services-react')
   } catch (error) {
     showFallback('Services currently unavailable')
   }
   ```

3. **User-Friendly Messages**
   - Not: "Failed to load chunk X"
   - But: "Services section is temporarily unavailable"

4. **Retry Logic**
   - Transient failures: automatic retry
   - Persistent failures: manual retry button

## Testing Implications

### Unit Tests (Per MFE)
- Test feature business logic
- Mock API client
- No integration with other MFEs

### Integration Tests (Per MFE)
- Test API client + MSW
- Test feature flows
- Verify state management

### E2E Tests (Full System)
- Test across MFEs
- Test routing/navigation
- Test error scenarios
- Test independent remotes failing

### MFE in Isolation
- Each remote has its own dev/test environment
- Can be tested standalone
- Verifies contract with shell

## Shared Concerns

### What CAN Be Shared

1. **Design Tokens** (Colors, typography, spacing)
   - Framework-neutral
   - Apply equally to all UIs

2. **Type Definitions** (DTOs, API contracts)
   - Ensures consistency
   - Minimal coupling

3. **Utilities** (Date formatting, validation rules)
   - Pure functions
   - No framework-specific code

4. **API Contracts** (Request/response shapes)
   - Define expected backend API
   - Ensure MSW matches

### What SHOULD NOT Be Shared

1. **Business Logic**
   - Each MFE should own its logic
   - No cross-MFE state management

2. **Framework Components**
   - React Button ≠ Angular Button
   - Different implementations OK (same appearance)

3. **Feature State**
   - Booking state belongs to booking MFE
   - Services state belongs to services MFE
   - No shared Redux store

4. **Feature Routes**
   - Each MFE owns its routes
   - Shell just composes them

## Trade-offs & Risks

### Benefits
- ✅ Team autonomy and velocity
- ✅ Independent deployment
- ✅ Technology flexibility
- ✅ Failure isolation
- ✅ Easier scaling to multiple teams

### Trade-offs
- ⚖️ **Increased Complexity**: Build, deployment, coordination
- ⚖️ **Bundle Size**: Less opportunity for tree-shaking
- ⚖️ **Shared Dependencies**: Version conflicts, duplicated code
- ⚖️ **Testing Complexity**: Integration testing across boundaries
- ⚖️ **Debugging**: Errors span multiple applications

### Risks to Mitigate
- **Risk**: Teams create their own design systems
  - **Mitigation**: Shared design tokens package (read-only)

- **Risk**: MFEs tightly couple to each other
  - **Mitigation**: Clear contracts, strict boundaries, code review

- **Risk**: Shared state becomes a God Store
  - **Mitigation**: Explicit ownership, architecture review

- **Risk**: Remote loading fails silently
  - **Mitigation**: Error boundaries, loading states, retry logic

- **Risk**: Bundle size explodes
  - **Mitigation**: Dependency analysis, shared dependency negotiation

## When This Project Is Successful

### Architecture Goals
- [ ] Clear business-capability boundaries
- [ ] Independent team ownership
- [ ] No "God Shell"
- [ ] No shared business logic
- [ ] Minimal shared dependencies

### Technical Goals
- [ ] Each remote deployable independently
- [ ] Shell continues working if remote fails
- [ ] Shell continues working if API fails
- [ ] Easy to add new MFEs

### Organizational Goals
- [ ] Teams understand why each boundary exists
- [ ] Teams can develop in parallel
- [ ] Deployment coordination minimal
- [ ] Changes don't affect other teams

### Quality Goals
- [ ] Comprehensive test coverage
- [ ] Type-safe across MFE boundaries
- [ ] Accessible to all users
- [ ] Performs well
- [ ] SEO-friendly where appropriate
- [ ] Secure

---

## References

- Cam Jackson: [Micro Frontend Architecture](https://micro-frontends.org/)
- Thoughtworks Technology Radar: Micro Frontends
- Martin Fowler: [Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
- Module Federation: [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)

