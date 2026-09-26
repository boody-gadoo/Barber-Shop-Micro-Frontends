import { BookingStatus, ServiceCategory } from '@shared-types/core';

/**
 * Barber professional profile
 */
export interface Barber {
  id: string;
  name: string;
  nameAr: string;
  specialty: ServiceCategory;
  rating: number;
  imageUrl: string;
  availability: TimeSlot[];
}

/**
 * Available time slot
 */
export interface TimeSlot {
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  available: boolean;
}

/**
 * Service with pricing
 */
export interface BookingService {
  id: string;
  name: string;
  nameAr: string;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  description: string;
}

/**
 * Customer information for booking
 */
export interface CustomerDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes?: string;
}

/**
 * Complete booking information
 */
export interface BookingRequest {
  serviceId: string;
  barberId: string;
  dateTime: string; // ISO datetime string
  customerDetails: CustomerDetails;
}

/**
 * Booking confirmation response
 */
export interface BookingConfirmation {
  id: string;
  status: BookingStatus;
  service: BookingService;
  barber: Barber;
  dateTime: string;
  customerDetails: CustomerDetails;
  totalPrice: number;
  confirmationCode: string;
}

/**
 * Multi-step form state
 */
export interface BookingFormState {
  step: number; // 1: service, 2: barber/datetime, 3: customer details, 4: confirmation
  service?: BookingService;
  barber?: Barber;
  selectedSlot?: TimeSlot;
  customerDetails?: CustomerDetails;
  confirmation?: BookingConfirmation;
}
