import { NgModule } from '@angular/core';
import { BookingModule } from './booking.module';

/**
 * Booking container module for Module Federation exposure
 */
@NgModule({
  imports: [BookingModule],
})
export class BookingContainerModule {}
