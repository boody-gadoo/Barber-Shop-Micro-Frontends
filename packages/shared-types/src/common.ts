/**
 * Shared Common Types
 */

/**
 * Egyptian phone number format
 */
export type EgyptianPhone = string & { readonly __brand: 'EgyptianPhone' };

/**
 * Email type
 */
export type Email = string & { readonly __brand: 'Email' };

/**
 * ISO Date string (YYYY-MM-DD)
 */
export type ISODate = string & { readonly __brand: 'ISODate' };

/**
 * ISO DateTime string (ISO 8601)
 */
export type ISODateTime = string & { readonly __brand: 'ISODateTime' };

/**
 * Time string (HH:mm)
 */
export type TimeString = string & { readonly __brand: 'TimeString' };

/**
 * UUID
 */
export type UUID = string & { readonly __brand: 'UUID' };

/**
 * Branded number type for currency (EGP)
 */
export type PriceEGP = number & { readonly __brand: 'PriceEGP' };

/**
 * Generic result type for operations
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  ok: true;
  value: T;
}

export interface Failure<E> {
  ok: false;
  error: E;
}

/**
 * Helper to create a success result
 */
export const success = <T>(value: T): Success<T> => ({
  ok: true,
  value,
});

/**
 * Helper to create a failure result
 */
export const failure = <E>(error: E): Failure<E> => ({
  ok: false,
  error,
});

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Sort options
 */
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Common filter options
 */
export interface CommonFilters {
  page?: number;
  pageSize?: number;
  sort?: SortOption;
  search?: string;
}
