import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { BookingRoutingModule } from './booking-routing.module';
import { BookingContainerComponent } from './booking-container.component';
import { ServiceSelectionComponent } from './components/service-selection.component';
import { BarberDateTimeSelectionComponent } from './components/barber-datetime-selection.component';
import { CustomerDetailsFormComponent } from './components/customer-details-form.component';
import { ConfirmationPageComponent } from './components/confirmation-page.component';
import { BookingProgressComponent } from './components/booking-progress.component';

@NgModule({
  declarations: [
    BookingContainerComponent,
    ServiceSelectionComponent,
    BarberDateTimeSelectionComponent,
    CustomerDetailsFormComponent,
    ConfirmationPageComponent,
    BookingProgressComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule, BookingRoutingModule],
})
export class BookingModule {}
