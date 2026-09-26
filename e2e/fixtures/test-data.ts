/**
 * Test data fixtures for E2E tests
 */

export const TEST_DATA = {
  // Service data
  services: {
    classic: {
      name: 'Classic Haircut',
      nameAr: 'قص شعر كلاسيكي',
      price: 50,
      duration: 30,
    },
    fade: {
      name: 'Fade Cut',
      nameAr: 'قص فيد',
      price: 60,
      duration: 30,
    },
    shave: {
      name: 'Beard Shave',
      nameAr: 'حلاقة لحية',
      price: 40,
      duration: 20,
    },
  },

  // Barber data
  barbers: {
    ahmed: {
      name: 'Ahmed Hassan',
      nameAr: 'أحمد حسن',
      rating: 4.8,
    },
    mohammed: {
      name: 'Mohammed Ali',
      nameAr: 'محمد علي',
      rating: 4.9,
    },
  },

  // Customer data
  customer: {
    firstName: 'Test',
    lastName: 'User',
    phone: '+20 123 456 7890',
    email: 'test@example.com',
    notes: 'Test booking note',
  },

  // URLs
  urls: {
    home: '/',
    services: '/services',
    booking: '/booking',
    gallery: '/gallery',
    contact: '/contact',
  },

  // Selectors
  selectors: {
    // Navigation
    logo: 'a.logo',
    navLink: (label: string) => `a.nav-link:has-text("${label}")`,
    langToggle: 'button.lang-toggle',

    // Services
    serviceCard: 'div.service-card',
    servicePrice: 'span.price',
    bookButton: 'button:has-text("Book")',

    // Booking form
    formStep: (step: number) => `div.booking-step-${step}`,
    serviceSelection: 'div.service-selection',
    barberSelection: 'div.barber-selection',
    customerForm: 'form:has-text("First Name")',
    confirmButton: 'button:has-text("Confirm")',

    // Loading & Error
    spinner: 'div.loading-spinner',
    errorMessage: 'div.remote-error',
    retryButton: 'button:has-text("Retry")',
  },

  // Timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },
};

export const LANGUAGES = {
  EN: 'en',
  AR: 'ar',
};
