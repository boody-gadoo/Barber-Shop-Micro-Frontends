/**
 * Shared Enums for Barber Shop
 */

/**
 * Booking status throughout lifecycle
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no-show',
}

/**
 * Service categories
 */
export enum ServiceCategory {
  HAIRCUT = 'haircut',
  BEARD_TRIM = 'beard-trim',
  HAIR_BEARD = 'hair-beard',
  HOT_TOWEL_SHAVE = 'hot-towel-shave',
  KIDS_HAIRCUT = 'kids-haircut',
  STYLING = 'styling',
  OTHER = 'other',
}

/**
 * Discount types for offers
 */
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

/**
 * Barber status
 */
export enum BarberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on-leave',
}

/**
 * Generic resource status
 */
export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

/**
 * Sort direction
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * HTTP method types (for API clients)
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Language/locale
 */
export enum Language {
  ENGLISH = 'en',
  ARABIC = 'ar',
}

/**
 * Text direction
 */
export enum TextDirection {
  LTR = 'ltr',
  RTL = 'rtl',
}
