/**
 * Services & Offers API Contracts
 */

/**
 * Service DTO
 */
export interface Service {
  id: string;
  name: string; // e.g., "Classic Haircut", "Fade", "Beard Trim"
  description: string;
  price: number; // in EGP
  currency: 'EGP';
  duration: number; // in minutes
  category: ServiceCategory;
  image?: string; // URL
  isPopular: boolean;
  status: 'active' | 'inactive';
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

/**
 * Service categories
 */
export type ServiceCategory =
  | 'haircut'
  | 'beard-trim'
  | 'hair-beard'
  | 'hot-towel-shave'
  | 'kids-haircut'
  | 'styling'
  | 'other';

/**
 * Offer DTO
 */
export interface Offer {
  id: string;
  title: string; // e.g., "Summer Special"
  description: string;
  discount: number; // percentage (0-100) or fixed amount
  discountType: 'percentage' | 'fixed';
  applicableServices: string[]; // service IDs
  startDate: string; // ISO date
  endDate: string; // ISO date
  code?: string; // Promo code if applicable
  maxUsage?: number; // Null = unlimited
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

/**
 * Request: Get all services
 */
export interface GetServicesRequest {
  page?: number;
  pageSize?: number;
  category?: ServiceCategory;
  search?: string;
}

/**
 * Request: Get single service
 */
export interface GetServiceRequest {
  id: string;
}

/**
 * Request: Get all offers
 */
export interface GetOffersRequest {
  page?: number;
  pageSize?: number;
}

/**
 * Request: Get single offer
 */
export interface GetOfferRequest {
  id: string;
}

/**
 * Request: Check if offer is valid
 */
export interface ValidateOfferRequest {
  code: string;
}

/**
 * Response: Validated offer
 */
export interface ValidatedOffer extends Offer {
  isValid: boolean;
  reason?: string; // If invalid
}
