import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { BookingFormState, BookingRequest } from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';

/**
 * Step 4: Booking confirmation page
 */
@Component({
  selector: 'app-confirmation-page',
  template: `
    <div class="confirmation-page">
      <div *ngIf="!isSubmitting && formState.confirmation" class="success-content">
        <div class="success-icon">✓</div>
        <h2>Booking Confirmed!</h2>

        <div class="confirmation-details">
          <div class="detail-section">
            <h3>Confirmation Code</h3>
            <p class="confirmation-code">{{ formState.confirmation.confirmationCode }}</p>
          </div>

          <div class="detail-section">
            <h3>Service</h3>
            <p>{{ formState.confirmation.service.name }}</p>
            <p class="arabic">{{ formState.confirmation.service.nameAr }}</p>
          </div>

          <div class="detail-section">
            <h3>Barber</h3>
            <p>{{ formState.confirmation.barber.name }}</p>
            <p class="arabic">{{ formState.confirmation.barber.nameAr }}</p>
          </div>

          <div class="detail-section">
            <h3>Date & Time</h3>
            <p>{{ formatDateTime(formState.confirmation.dateTime) }}</p>
          </div>

          <div class="detail-section">
            <h3>Customer Name</h3>
            <p>
              {{ formState.confirmation.customerDetails.firstName }}
              {{ formState.confirmation.customerDetails.lastName }}
            </p>
          </div>

          <div class="detail-section">
            <h3>Price</h3>
            <p class="price">{{ formState.confirmation.totalPrice }} EGP</p>
          </div>
        </div>

        <div class="actions">
          <button (click)="newBooking()" class="btn-primary" type="button">
            Make Another Booking
          </button>
        </div>
      </div>

      <div *ngIf="isSubmitting" class="submitting">
        <div class="spinner"></div>
        <p>Processing your booking...</p>
      </div>
    </div>
  `,
  styles: [
    `
      .confirmation-page {
        padding: 24px;
        max-width: 600px;
        margin: 0 auto;
      }

      .success-content {
        text-align: center;
      }

      .success-icon {
        font-size: 64px;
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        border-radius: 50%;
        background-color: #4caf50;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: scaleIn 0.6s ease-out;
      }

      @keyframes scaleIn {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      h2 {
        color: #4caf50;
        margin-bottom: 32px;
      }

      .confirmation-details {
        background-color: #fef5f3;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 32px;
        text-align: left;
      }

      .detail-section {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e8ddd4;

        &:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
      }

      .detail-section h3 {
        font-size: 12px;
        text-transform: uppercase;
        color: #8b7d76;
        margin-bottom: 8px;
        font-weight: 600;
      }

      .detail-section p {
        font-size: 16px;
        color: #211e1b;
      }

      .arabic {
        font-family: 'Cairo', sans-serif;
        font-size: 14px;
        color: #6f6861;
        margin-top: 4px;
      }

      .confirmation-code {
        font-size: 20px;
        font-weight: 700;
        color: #d4645c;
        font-family: 'Courier New', monospace;
      }

      .price {
        font-size: 18px;
        font-weight: 700;
        color: #d4645c;
      }

      .actions {
        display: flex;
        justify-content: center;
        gap: 12px;
      }

      .btn-primary {
        padding: 12px 32px;
        background-color: #d4645c;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;

        &:hover {
          background-color: #c15048;
        }
      }

      .submitting {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 24px;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e8ddd4;
        border-top-color: #d4645c;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 640px) {
        .confirmation-page {
          max-width: 100%;
        }

        .actions {
          flex-direction: column;
        }

        .btn-primary {
          width: 100%;
        }
      }
    `,
  ],
})
export class ConfirmationPageComponent implements OnInit {
  @Input() formState!: BookingFormState;

  isSubmitting = false;

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If we haven't submitted yet, do it now
    if (!this.formState.confirmation && this.canSubmit()) {
      this.submitBooking();
    }
  }

  canSubmit(): boolean {
    return (
      !!this.formState.service &&
      !!this.formState.barber &&
      !!this.formState.selectedSlot &&
      !!this.formState.customerDetails
    );
  }

  submitBooking(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.isSubmitting = true;

    const bookingRequest: BookingRequest = {
      serviceId: this.formState.service!.id,
      barberId: this.formState.barber!.id,
      dateTime: `${this.formState.selectedSlot!.date}T${this.formState.selectedSlot!.startTime}`,
      customerDetails: this.formState.customerDetails!,
    };

    this.bookingService.submitBooking(bookingRequest).subscribe({
      next: () => {
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Booking submission failed:', err);
        this.isSubmitting = false;
      },
    });
  }

  formatDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  newBooking(): void {
    this.bookingService.resetBooking();
    this.router.navigate(['/booking']);
  }
}
