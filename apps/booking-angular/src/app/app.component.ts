import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="booking-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: [],
})
export class AppComponent {
  title = 'booking-angular';
}
