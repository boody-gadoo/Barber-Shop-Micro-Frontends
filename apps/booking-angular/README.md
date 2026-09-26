# Booking Angular MFE

Angular 17 micro frontend for barber appointment booking.

## Module Federation

This is a **remote** application that exports the booking flow as a Module Federation module. It's designed to be loaded by the Shell host at runtime.

### Exposed Modules

- **`./Container`** - Root container component for the booking MFE
- **`./ContainerModule`** - Container module (includes routing)
- **`./BookingModule`** - Feature module with booking workflow

### Building

```bash
# Development server (with Module Federation)
npm run dev

# Production build
npm run build

# Watch mode
npm run watch
```

### Environment Variables

None required for standalone operation. When loaded by the Shell host, the host provides shared dependencies via Module Federation.

### Architecture

The booking flow is a multi-step form:

1. **Service Selection** - User selects a barber service
2. **Barber & Date/Time** - Filtered barbers by service, select date/time
3. **Customer Details** - Enter customer information
4. **Confirmation** - Review and confirm booking

### State Management

Uses RxJS `BehaviorSubject` for form state management. Each component subscribes to form state changes via Observable streams.

### Shared Dependencies

Module Federation shares:
- Angular core libraries (animations, common, compiler, core, forms, platform-browser, router)
- RxJS
- Design tokens, API contracts, shared types

### Port

Runs on **port 3003** during development.

### TypeScript

Strict mode enabled with path aliases for shared packages:
- `@design-tokens/*` → `packages/design-tokens/src/*`
- `@api-contracts/*` → `packages/api-contracts/src/*`
- `@shared-types/*` → `packages/shared-types/src/*`

### Styling

CSS-only, responsive design with RTL support. Tailwind tokens imported from design-tokens package.

### Accessibility

- WCAG AA compliant semantic HTML
- Keyboard navigation support
- Form validation with error messaging
- Proper ARIA labels and structure
