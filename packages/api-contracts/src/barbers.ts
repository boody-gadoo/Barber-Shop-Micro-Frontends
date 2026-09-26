/**
 * Barbers API Contracts
 */

/**
 * Barber DTO
 */
export interface Barber {
  id: string;
  name: string;
  bio?: string;
  specialties: string[]; // e.g., ["fades", "beard-trim", "styling"]
  experience: number; // Years of experience
  rating: number; // 1-5 stars
  reviewCount: number;
  image?: string; // Profile image URL
  status: 'active' | 'inactive' | 'on-leave';
  workingHours?: WorkingHours;
  createdAt: string;
  updatedAt: string;
}

/**
 * Working hours for a barber
 */
export interface WorkingHours {
  monday?: { start: string; end: string }; // HH:mm format
  tuesday?: { start: string; end: string };
  wednesday?: { start: string; end: string };
  thursday?: { start: string; end: string };
  friday?: { start: string; end: string };
  saturday?: { start: string; end: string };
  sunday?: { start: string; end: string };
}

/**
 * Request: Get all barbers
 */
export interface GetBarbersRequest {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'on-leave';
  search?: string;
}

/**
 * Request: Get single barber
 */
export interface GetBarberRequest {
  id: string;
}

/**
 * Request: Get barber availability
 */
export interface GetBarberAvailabilityRequest {
  barberId: string;
  fromDate: string; // ISO date
  toDate: string; // ISO date
}

/**
 * Response: Barber availability
 */
export interface BarberAvailability {
  barberId: string;
  date: string; // ISO date
  availableSlots: string[]; // Array of HH:mm times
  bookedSlots: string[]; // Array of HH:mm times
}
