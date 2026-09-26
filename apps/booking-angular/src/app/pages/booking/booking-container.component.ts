import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { BookingFormState } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';

/**
 * Main booking container that orchestrates multi-step form
 */
@Component({
  selector: 'app-booking-container',
  template: `
    <div *ngIf="formState$ | async as state">
      <div class="booking-header">
        <h1>Book Your Appointment</h1>
        <p>Step {{ state.step }} of 4</p>
      </div>

      <app-booking-progress [step]="state.step"></app-booking-progress>

      <div class="booking-form">
        <app-service-selection
          *ngIf="state.step === 1"
          [formState]="state"
        ></app-service-selection>

        <app-barber-datetime-selection
          *ngIf="state.step === 2"
          [formState]="state"
        ></app-barber-datetime-selection>

        <app-customer-details-form
          *ngIf="state.step === 3"
          [formState]="state"
        ></app-customer-details-form>

        <app-confirmation-page
          *ngIf="state.step === 4"
          [formState]="state"
        ></app-confirmation-page>
      </div>
    </div>
  `,
})
export class BookingContainerComponent implements OnInit {
  formState$!: Observable<BookingFormState>;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.formState$ = this.bookingService.getFormState();
  }
}
