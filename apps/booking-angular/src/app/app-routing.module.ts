import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'booking',
    loadChildren: () =>
      import('./pages/booking/booking.module').then((m) => m.BookingModule),
  },
  {
    path: '**',
    redirectTo: 'booking',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
