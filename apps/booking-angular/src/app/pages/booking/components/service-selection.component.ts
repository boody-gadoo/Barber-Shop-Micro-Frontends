import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { BookingFormState, BookingService as BookingServiceModel } from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';

/**
 * Step 1: Service selection
 */
@Component({
  selector: 'app-service-selection',
  template: `
    <div class="service-selection">
      <h2>Select a Service</h2>

      <div class="services-grid">
        <button
          *ngFor="let service of services$ | async"
          (click)="selectService(service)"
          class="service-card"
          type="button"
        >
          <h3>{{ service.name }}</h3>
          <p class="arabic">{{ service.nameAr }}</p>
          <p class="description">{{ service.description }}</p>
          <div class="service-meta">
            <span class="duration">{{ service.durationMinutes }} min</span>
            <span class="price">{{ service.price }} EGP</span>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .service-selection {
        padding: 24px;
      }

      h2 {
        margin-bottom: 24px;
      }

      .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .service-card {
        padding: 20px;
        border: 2px solid #e8ddd4;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;

        &:hover {
          border-color: #d4645c;
          box-shadow: 0 4px 12px rgba(212, 100, 92, 0.1);
        }

        &:active {
          transform: scale(0.98);
        }
      }

      h3 {
        font-size: 18px;
        margin-bottom: 4px;
        color: #211e1b;
      }

      .arabic {
        font-size: 16px;
        color: #6f6861;
        margin-bottom: 8px;
        font-family: 'Cairo', sans-serif;
      }

      .description {
        font-size: 14px;
        color: #8b7d76;
        margin-bottom: 16px;
        line-height: 1.4;
      }

      .service-meta {
        display: flex;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px solid #e8ddd4;
        font-size: 14px;
        font-weight: 600;
      }

      .duration {
        color: #6f6861;
      }

      .price {
        color: #d4645c;
      }

      @media (max-width: 768px) {
        .services-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ServiceSelectionComponent implements OnInit {
  @Input() formState!: BookingFormState;

  services$!: Observable<BookingServiceModel[]>;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.services$ = this.bookingService.getServices();
  }

  selectService(service: BookingServiceModel): void {
    this.bookingService.selectService(service);
  }
}
