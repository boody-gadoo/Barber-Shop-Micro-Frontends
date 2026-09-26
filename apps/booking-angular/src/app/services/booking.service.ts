import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { BookingStatus } from '@shared-types/core';
import {
  Barber,
  BookingConfirmation,
  BookingFormState,
  BookingRequest,
  BookingService as BookingServiceModel,
  CustomerDetails,
  TimeSlot,
} from '../models/booking.model';
import { MOCK_BARBERS } from '../data/mock-barbers';
import { MOCK_SERVICES } from '../data/mock-services';

/**
 * Booking service manages the multi-step booking form state and API calls
 */
@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private formState$ = new BehaviorSubject<BookingFormState>({
    step: 1,
  });

  constructor() {}

  /**
   * Get current form state
   */
  getFormState(): Observable<BookingFormState> {
    return this.formState$.asObservable();
  }

  /**
   * Get all available services
   */
  getServices(): Observable<BookingServiceModel[]> {
    return of(MOCK_SERVICES).pipe(delay(500));
  }

  /**
   * Get all barbers
   */
  getBarbers(): Observable<Barber[]> {
    return of(MOCK_BARBERS).pipe(delay(500));
  }

  /**
   * Get barbers filtered by service category
   */
  getBarbersByService(serviceId: string): Observable<Barber[]> {
    const service = MOCK_SERVICES.find((s) => s.id === serviceId);
    if (!service) {
      return throwError(() => new Error('Service not found'));
    }

    const filtered = MOCK_BARBERS.filter(
      (barber) => barber.specialty === service.category
    );
    return of(filtered).pipe(delay(500));
  }

  /**
   * Get available time slots for a barber
   */
  getAvailableSlots(barberId: string): Observable<TimeSlot[]> {
    const barber = MOCK_BARBERS.find((b) => b.id === barberId);
    if (!barber) {
      return throwError(() => new Error('Barber not found'));
    }

    const available = barber.availability.filter((slot) => slot.available);
    return of(available).pipe(delay(300));
  }

  /**
   * Update form state on service selection
   */
  selectService(service: BookingServiceModel): void {
    const current = this.formState$.value;
    this.formState$.next({
      ...current,
      step: 2,
      service,
      barber: undefined,
      selectedSlot: undefined,
    });
  }

  /**
   * Update form state on barber and time slot selection
   */
  selectBarberAndSlot(barber: Barber, slot: TimeSlot): void {
    const current = this.formState$.value;
    this.formState$.next({
      ...current,
      step: 3,
      barber,
      selectedSlot: slot,
    });
  }

  /**
   * Update form state on customer details submission
   */
  submitCustomerDetails(details: CustomerDetails): void {
    const current = this.formState$.value;
    this.formState$.next({
      ...current,
      step: 4,
      customerDetails: details,
    });
  }

  /**
   * Submit booking and get confirmation
   */
  submitBooking(bookingRequest: BookingRequest): Observable<BookingConfirmation> {
    // Simulate API call
    const confirmation: BookingConfirmation = {
      id: 'booking-' + Date.now(),
      status: BookingStatus.CONFIRMED,
      service: MOCK_SERVICES.find((s) => s.id === bookingRequest.serviceId)!,
      barber: MOCK_BARBERS.find((b) => b.id === bookingRequest.barberId)!,
      dateTime: bookingRequest.dateTime,
      customerDetails: bookingRequest.customerDetails,
      totalPrice: MOCK_SERVICES.find(
        (s) => s.id === bookingRequest.serviceId
      )?.price || 0,
      confirmationCode: 'HB-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    const current = this.formState$.value;
    this.formState$.next({
      ...current,
      confirmation,
    });

    return of(confirmation).pipe(delay(1000));
  }

  /**
   * Reset booking form to initial state
   */
  resetBooking(): void {
    this.formState$.next({
      step: 1,
    });
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    const current = this.formState$.value;
    if (current.step > 1) {
      this.formState$.next({
        ...current,
        step: current.step - 1,
      });
    }
  }
}
