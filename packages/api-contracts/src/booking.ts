/**
 * Booking API Contracts
 */

/**
 * Booking status throughout lifecycle
 */
export type BookingStatus =
  | 'pending' // Created but not confirmed
  | 'confirmed' // Confirmed by user
  | 'cancelled' // Cancelled by user or barber
  | 'completed' // Service completed
  | 'no-show'; // Customer didn't show up

/**
 * Booking DTO
 */
export interface Booking {
  id: string;
  serviceId: string;
  barberId: string;
  customerId: string;
  customerName: string;
  customerPhone: string; // Egyptian format: +20XXXXXXXXX
  customerEmail?: string;
  bookingDate: string; // ISO date (YYYY-MM-DD)
  bookingTime: string; // HH:mm format (24-hour)
  status: BookingStatus;
  notes?: string;
  totalPrice: number; // in EGP
  appliedOffer?: string; // Offer ID if applied
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
}

/**
 * Availability slot
 */
export interface AvailabilitySlot {
  barberId: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // HH:mm format
  available: boolean;
  duration: number; // in minutes
}

/**
 * Request: Get available slots for barber and date
 */
export interface GetAvailabilityRequest {
  barberId: string;
  date: string; // ISO date
  serviceId?: string; // Optional: filter by service duration
}

/**
 * Response: Available slots
 */
export interface GetAvailabilityResponse {
  barberId: string;
  date: string;
  slots: AvailabilitySlot[];
}

/**
 * Request: Create booking
 */
export interface CreateBookingRequest {
  serviceId: string;
  barberId: string;
  bookingDate: string; // ISO date
  bookingTime: string; // HH:mm
  customerName: string;
  customerPhone: string; // +20XXXXXXXXX
  customerEmail?: string;
  notes?: string;
  appliedOfferCode?: string; // Promo code if applicable
}

/**
 * Response: Booking created
 */
export interface CreateBookingResponse {
  booking: Booking;
  bookingConfirmationUrl?: string;
}

/**
 * Request: Update booking
 */
export interface UpdateBookingRequest {
  bookingId: string;
  bookingDate?: string;
  bookingTime?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  status?: BookingStatus;
}

/**
 * Request: Cancel booking
 */
export interface CancelBookingRequest {
  bookingId: string;
  reason?: string;
}

/**
 * Request: Get booking details
 */
export interface GetBookingRequest {
  bookingId: string;
}

/**
 * Request: Get customer bookings
 */
export interface GetCustomerBookingsRequest {
  phone: string; // Customer phone
  email?: string; // Optional customer email
  status?: BookingStatus; // Filter by status
}

/**
 * Response: Customer bookings
 */
export interface GetCustomerBookingsResponse {
  bookings: Booking[];
  total: number;
}
