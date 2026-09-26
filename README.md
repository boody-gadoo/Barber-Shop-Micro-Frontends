# حلاقة البلد — Helaqat El Balad

**Modern Egyptian Barber Shop Platform — Production-Ready Micro Frontend Architecture**

> A comprehensive lab demonstrating professional-grade Micro Frontend architecture, complete with business-capability boundaries, independent deployment, Module Federation, and team-based development workflows.

---

## 🎯 Project Overview

**Helaqat El Balad** is a modern barber shop platform designed to demonstrate production-ready Micro Frontend architecture. It combines:

- ✨ **Modern Egyptian Brand Identity** — Culturally authentic, premium aesthetic
- 🏗️ **Micro Frontend Architecture** — Business-capability boundaries, independent deployment
- ⚙️ **Module Federation** — Runtime composition, zero build-time coupling
- 🚀 **Multi-Framework** — Angular (complex state) + React (content-heavy UI)
- 📱 **Mobile-First** — Responsive, RTL-aware, fully accessible
- 🧪 **Production-Ready** — Type-safe, tested, documented, secure

---

## 📚 What This Project Demonstrates

### Architecture & Patterns

- ✅ **Micro Frontends** — Business-capability ownership, independent teams
- ✅ **Module Federation** — Webpack 5 runtime composition
- ✅ **Monorepo Architecture** — Nx + pnpm workspace orchestration
- ✅ **Domain-Driven Design** — Clear business boundaries
- ✅ **Error Isolation** — Remote failures don't crash the shell
- ✅ **Independent Deployment** — Teams deploy without coordination

### Technology & Quality

- ✅ **TypeScript Strict Mode** — Type safety across MFE boundaries
- ✅ **Design Tokens** — Framework-neutral brand system
- ✅ **API Contracts** — Clear backend integration specs
- ✅ **Code Quality** — ESLint, Prettier, automated formatting
- ✅ **Git Workflow** — Conventional commits, PR-based development
- ✅ **CI/CD** — GitHub Actions validation

### Future (Roadmap)

- 🟡 **Testing** — Unit, integration, and E2E (Playwright)
- 🟡 **Accessibility** — WCAG 2.2 AA compliance
- 🟡 **SEO** — Semantic HTML, meta tags, structured data
- 🟡 **Performance** — Bundle analysis, lazy loading
- 🟡 **Security** — Dependency scanning, CSP, XSS prevention

---

## 🏗️ Repository Structure

```
Frontends/
├── packages/                      # Shared libraries
│   ├── design-tokens/             # Egyptian brand colors, typography, spacing
│   ├── api-contracts/             # Backend API TypeScript interfaces
│   ├── shared-types/              # Enums, common types
│   └── shared-utils/              # Utilities (future)
├── apps/                          # Micro Frontend applications
│   ├── shell/                     # Host (React) — Phase 2
│   ├── booking-angular/           # Remote (Angular) — Phase 4
│   └── services-react/            # Remote (React) — Phase 3
├── mock-api/                      # Mock backend (MSW) — Phase 8
├── e2e/                           # Playwright tests — Phase 10
├── docs/                          # Architecture documentation
│   ├── architecture/              # ADRs, design docs
│   ├── decisions/                 # Architecture Decision Records
│   └── testing/                   # Testing strategy (future)
├── .github/
│   ├── workflows/                 # GitHub Actions CI
│   ├── CODEOWNERS                 # Team ownership
│   └── pull_request_template.md   # PR template
└── Configuration
    ├── package.json               # Root dependencies
    ├── pnpm-workspace.yaml        # Monorepo workspace
    ├── nx.json                    # Nx configuration
    ├── tsconfig.base.json         # TypeScript base config
    ├── .eslintrc.json             # ESLint configuration
    ├── .prettierrc.json           # Prettier formatting
    └── .nvmrc                     # Node.js version
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.11.1 (see `.nvmrc`)
- **pnpm**: 9.0.0 (`npm install -g pnpm@9.0.0`)

### Installation

```bash
# Install dependencies
pnpm install

# Verify installation
pnpm typecheck
pnpm lint
```

### Development (Phase 2+)

```bash
# Start development servers for all apps
pnpm dev

# Or run individual apps (to be implemented)
pnpm -F @shell/app dev
pnpm -F @booking-angular/app dev
pnpm -F @services-react/app dev
```

### Build

```bash
# Build all applications
pnpm build

# Build specific application
pnpm -F @shell/app build
```

### Code Quality

```bash
# Lint all files
pnpm lint

# Auto-fix lint issues
pnpm lint --fix

# Format all files
pnpm format

# Type check
pnpm typecheck
```

---

## 📋 Business Capabilities

The application is organized around **business capabilities**, not technical layers:

### 1. Shell / Host
**Owner**: Platform Team  
**Technology**: React + TypeScript  
**Responsibility**: Global layout, routing, MFE composition, error boundaries

### 2. Booking MFE
**Owner**: Booking Team  
**Technology**: Angular + TypeScript  
**Responsibility**: Service selection, barber selection, date/time selection, booking confirmation

### 3. Services & Offers MFE
**Owner**: Services Team  
**Technology**: React + TypeScript  
**Responsibility**: Services listing, offer details, pricing, availability

---

## 🔗 Architecture & Decisions

### Key Documents

1. **[ADR-001: Micro Frontends](docs/decisions/ADR-001-micro-frontends.md)**
   - Why we chose Micro Frontends
   - Alternatives considered and rejected
   - Consequences and success criteria

2. **[Micro Frontends Architecture](docs/architecture/01-micro-frontends.md)**
   - Concepts and principles
   - Business-capability model
   - Communication patterns
   - Trade-offs and risks

3. **[Module Federation Implementation](docs/architecture/02-module-federation.md)**
   - Technical implementation details
   - Host/Remote configuration
   - Deployment model
   - Error handling and fallbacks

4. **[Repository Audit](docs/architecture/00-current-state.md)**
   - Current state assessment
   - Technology choices
   - Architectural overview

### Design Tokens

Egyptian brand identity:
- **Primary**: Deep brown (`#171412`) — Premium, sophisticated
- **Accent**: Warm terracotta (`#B66A3C`) — Egyptian aesthetic
- **Sand**: Warm beige (`#E7D8C5`) — Desert aesthetic
- **Background**: Off-white (`#F8F5F0`) — Clean, modern

See [`packages/design-tokens/src/colors.ts`](packages/design-tokens/src/colors.ts)

### API Contracts

Backend integration is type-safe via TypeScript contracts:
- **Services** — Listing, details, categories
- **Booking** — Creation, updates, cancellation, status
- **Barbers** — Profile, availability, working hours
- **Offers** — Discounts, promo codes, validity

See [`packages/api-contracts/src/`](packages/api-contracts/src/)

---

## 🧩 Micro Frontend Communication

### Preferred Patterns

1. **URL Parameters** (Preferred)
   ```
   /services/booking?serviceId=fade
   Booking MFE reads serviceId from URL
   ```

2. **Shared API Layer** (Secondary)
   ```
   Both MFEs fetch from same /api/services endpoint
   State synchronized via backend
   ```

3. **Custom Events** (Rare)
   ```
   Services MFE emits: window.dispatchEvent(new CustomEvent('service-selected'))
   Shell listens and routes to Booking
   ```

### Anti-Patterns

❌ **Never** import components between MFEs:
```typescript
// WRONG
import { BookingForm } from 'booking-angular'

// RIGHT
// Shell routes to booking-angular remote's exposed Container
```

---

## 🛡️ Error Isolation

Each MFE can fail independently without crashing the Shell:

```typescript
// If booking-angular fails to load:
// ✅ Shell continues working
// ✅ Services MFE still accessible
// ✅ User sees: "Booking is temporarily unavailable"
// ✅ Can retry loading

// Result: Graceful degradation, not total failure
```

---

## 📱 Responsive Design

Mobile-first approach with tested breakpoints:

- **Mobile**: 320px, 360px, 390px
- **Tablet**: 768px, 1024px
- **Desktop**: 1280px, 1440px
- **Wide**: 1536px+

All layouts tested and validated for:
- Responsive typography
- Touch-friendly interactions
- Navigation redesign per viewport
- Image optimization
- RTL behavior

---

## 🌍 RTL & Arabic Support

First-class Arabic support with Arabic as primary language:

- ✅ Arabic content throughout
- ✅ RTL layout with logical CSS properties
- ✅ Proper spacing and alignment for RTL
- ✅ Accessible navigation and forms
- ✅ English fallback support

---

## 🔐 Security Considerations

- ✅ No secrets in code (use `.env.example`)
- ✅ Dependency scanning for vulnerabilities
- ✅ XSS prevention via framework defaults
- ✅ Remote loading security
- ✅ Content Security Policy planning
- ⚠️ Full security audit: Phase 10+

---

## 🎓 Team Workflow

### Git Workflow

```
main (protected)
  ↓
git checkout -b feature/feature-name
  ↓
implement feature
  ↓
pnpm lint && pnpm typecheck && pnpm build
  ↓
git commit (conventional commits)
  ↓
git push -u origin feature/feature-name
  ↓
Create Pull Request (CI validates)
  ↓
Code review + feedback
  ↓
Merge (squash recommended)
  ↓
git checkout main && git pull --ff-only
```

### Conventional Commits

```
feat: add booking service
fix: handle unavailable slot
refactor: isolate API client
docs: document module federation
test: add booking flow coverage
chore: update dependencies
ci: add frontend validation workflow
```

### Branch Naming

```
feature/shell-layout
fix/remote-loading-error
docs/architecture-decisions
test/booking-e2e
refactor/api-client
chore/dependency-update
```

---

## 📊 Development Phases

### Phase 0: Audit ✅
Repository audit, architecture documentation, ADRs

### Phase 1: Foundation (Current)
Workspace setup, design tokens, API contracts, CI baseline

### Phase 2: Shell
Host application, Module Federation host config, layout

### Phase 3: Services MFE
React remote, services listing, Module Federation remote config

### Phase 4: Booking MFE
Angular remote, booking flow, Module Federation remote config

### Phase 5: Integration
Connect remotes, test communication, error scenarios

### Phase 6-15: Testing, Security, Accessibility, SEO, Performance, CI/CD finalization

---

## 🧪 Testing Strategy

### Unit Tests
- Business logic validators
- Utility functions
- Component state management

### Integration Tests
- API client + mock layer
- Feature workflows
- MFE communication

### E2E Tests
- Full user journeys
- Cross-MFE scenarios
- Error handling

### Test Framework
- **Unit**: Vitest
- **E2E**: Playwright

---

## 📈 Performance Goals

- ⚡ **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- 📦 **Bundle Size**: Monitor per MFE, < 250KB gzipped per remote
- 🚀 **Lazy Loading**: Load remotes on-demand
- 🖼️ **Images**: WebP/AVIF, responsive, lazy-loaded

---

## ♿ Accessibility

WCAG 2.2 AA compliance:

- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ Visible focus indicators
- ✅ Accessible labels and alt text
- ✅ Sufficient color contrast
- ✅ Reduced motion support
- ✅ RTL/LTR correctness
- ⚠️ Full audit: Phase 11+

---

## 🔍 SEO

- ✅ Semantic HTML structure
- ✅ Unique page titles and meta descriptions
- ✅ Open Graph tags
- ✅ Robots.txt and sitemap
- ⚠️ Structured data: Phase 12+

---

## 🤝 Contributing

1. **Check out latest main**
   ```bash
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Implement feature with quality checks**
   ```bash
   pnpm lint && pnpm typecheck && pnpm build
   ```

4. **Commit with conventional format**
   ```bash
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push -u origin feature/your-feature
   ```

6. **Review and merge**
   - Wait for CI to pass ✅
   - Address review feedback
   - Merge via squash merge

---

## 📝 License

MIT

---

## 👤 Author

**Zakria Hossam**  
GitHub: [@zakriahossam212-blip](https://github.com/zakriahossam212-blip)

---

## 📞 Questions?

See:
- [`docs/architecture/`](docs/architecture/) — Architecture documentation
- [`docs/decisions/`](docs/decisions/) — Decision records
- [`PHASE-1-PLAN.md`](PHASE-1-PLAN.md) — Implementation roadmap

---

## ✨ Key Technologies

- **Build**: Nx, Webpack 5, Module Federation
- **Languages**: TypeScript (strict), JavaScript
- **Frameworks**: React 18, Angular 17
- **Styling**: Tailwind CSS + Design Tokens
- **Testing**: Vitest, Playwright
- **Code Quality**: ESLint, Prettier, TypeScript
- **CI/CD**: GitHub Actions
- **Package Management**: pnpm

---

**Status**: 🟡 Phase 1 — Foundation (in progress)  
**Next**: Phase 2 — Shell Application

