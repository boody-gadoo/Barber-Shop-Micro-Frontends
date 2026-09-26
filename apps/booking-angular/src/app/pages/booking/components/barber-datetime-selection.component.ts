import { Component, Input, OnInit } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Barber, BookingFormState, TimeSlot } from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';

/**
 * Step 2: Barber and date/time selection
 */
@Component({
  selector: 'app-barber-datetime-selection',
  template: `
    <div class="barber-selection">
      <h2>Select Barber & Time</h2>

      <div class="barbers-grid">
        <button
          *ngFor="let barber of barbers$ | async"
          (click)="selectBarber(barber)"
          [class.selected]="selectedBarber?.id === barber.id"
          class="barber-card"
          type="button"
        >
          <div class="barber-header">
            <img [src]="barber.imageUrl" [alt]="barber.name" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />
            <div style="flex: 1; margin-left: 12px; text-align: left;">
              <h3>{{ barber.name }}</h3>
              <p class="arabic" style="margin: 0;">{{ barber.nameAr }}</p>
            </div>
            <span class="rating">★ {{ barber.rating }}</span>
          </div>
          <p class="specialty" style="margin-top: 12px;">{{ barber.specialty }}</p>
        </button>
      </div>

      <div *ngIf="selectedBarber" class="time-slots">
        <h3>Available Times</h3>
        <div class="slots-grid">
          <button
            *ngFor="let slot of availableSlots$ | async"
            (click)="selectTimeSlot(slot)"
            [class.selected]="selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime"
            class="time-slot"
            type="button"
          >
            <span class="date">{{ formatDate(slot.date) }}</span>
            <span class="time">{{ slot.startTime }} - {{ slot.endTime }}</span>
          </button>
        </div>
      </div>

      <div class="actions">
        <button (click)="previousStep()" class="btn-secondary" type="button">
          Back
        </button>
        <button
          (click)="nextStep()"
          [disabled]="!selectedBarber || !selectedSlot"
          class="btn-primary"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .barber-selection {
        padding: 24px;
      }

      h2,
      h3 {
        margin-bottom: 16px;
      }

      .barbers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 32px;
      }

      .barber-card {
        padding: 16px;
        border: 2px solid #e8ddd4;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;

        &.selected {
          border-color: #d4645c;
          background-color: #fef5f3;
        }

        &:hover {
          border-color: #d4645c;
        }
      }

      .barber-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .barber-header h3 {
        margin: 0;
        font-size: 16px;
      }

      .rating {
        font-size: 14px;
        color: #d4645c;
        font-weight: 600;
      }

      .arabic {
        font-family: 'Cairo', sans-serif;
        font-size: 14px;
        color: #6f6861;
        margin: 4px 0;
      }

      .specialty {
        font-size: 12px;
        color: #8b7d76;
      }

      .time-slots {
        margin-bottom: 32px;
      }

      .slots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 8px;
      }

      .time-slot {
        padding: 12px;
        border: 1px solid #e8ddd4;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        gap: 4px;

        &.selected {
          border-color: #d4645c;
          background-color: #fef5f3;
        }

        &:hover:not(:disabled) {
          border-color: #d4645c;
        }
      }

      .date {
        font-size: 12px;
        color: #8b7d76;
      }

      .time {
        font-size: 14px;
        font-weight: 600;
        color: #211e1b;
      }

      .actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 32px;
      }

      .btn-primary,
      .btn-secondary {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .btn-primary {
        background-color: #d4645c;
        color: white;

        &:hover:not(:disabled) {
          background-color: #c15048;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-secondary {
        background-color: #e8ddd4;
        color: #211e1b;

        &:hover {
          background-color: #dcd0c8;
        }
      }

      @media (max-width: 768px) {
        .barbers-grid {
          grid-template-columns: 1fr;
        }

        .slots-grid {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }

        .actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class BarberDateTimeSelectionComponent implements OnInit {
  @Input() formState!: BookingFormState;

  private barberSubject = new BehaviorSubject<string | null>(null);
  barbers$!: Observable<Barber[]>;
  availableSlots$!: Observable<TimeSlot[]>;

  selectedBarber: Barber | null = null;
  selectedSlot: TimeSlot | null = null;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.barbers$ = this.bookingService.getBarbersByService(
      this.formState.service?.id || ''
    );

    this.availableSlots$ = this.barberSubject.pipe(
      switchMap((barberId) => {
        if (!barberId) {
          return new Observable<TimeSlot[]>((observer) => observer.next([]));
        }
        return this.bookingService.getAvailableSlots(barberId);
      })
    );
  }

  selectBarber(barber: Barber): void {
    this.selectedBarber = barber;
    this.selectedSlot = null;
    this.barberSubject.next(barber.id);
  }

  selectTimeSlot(slot: TimeSlot): void {
    this.selectedSlot = slot;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  nextStep(): void {
    if (this.selectedBarber && this.selectedSlot) {
      this.bookingService.selectBarberAndSlot(
        this.selectedBarber,
        this.selectedSlot
      );
    }
  }

  previousStep(): void {
    this.bookingService.previousStep();
  }
}
