import { Component, Input } from '@angular/core';

interface Step {
  number: number;
  label: string;
}

/**
 * Progress indicator for multi-step form
 */
@Component({
  selector: 'app-booking-progress',
  template: `
    <div class="booking-progress">
      <div
        *ngFor="let stepItem of steps"
        [class.active]="stepItem.number <= step"
        [class.completed]="stepItem.number < step"
        class="progress-step"
      >
        <div class="step-number">{{ stepItem.number }}</div>
        <div class="step-label">{{ stepItem.label }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .booking-progress {
        display: flex;
        justify-content: space-between;
        margin-bottom: 40px;
        gap: 16px;
      }

      .progress-step {
        flex: 1;
        text-align: center;
        opacity: 0.5;
        transition: opacity 0.3s ease;
      }

      .progress-step.active,
      .progress-step.completed {
        opacity: 1;
      }

      .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #f0e8e0;
        color: #211e1b;
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 16px;
      }

      .progress-step.active .step-number {
        background-color: #d4645c;
        color: white;
      }

      .progress-step.completed .step-number {
        background-color: #4caf50;
        color: white;
      }

      .step-label {
        font-size: 14px;
        color: #6f6861;
      }

      @media (max-width: 640px) {
        .step-label {
          display: none;
        }

        .step-number {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }
      }
    `,
  ],
})
export class BookingProgressComponent {
  @Input() step = 1;

  steps: Step[] = [
    { number: 1, label: 'Service' },
    { number: 2, label: 'Barber & Time' },
    { number: 3, label: 'Details' },
    { number: 4, label: 'Confirmation' },
  ];
}
