import { Component } from '@angular/core';

/**
 * Root container component for Module Federation remote
 * Wraps the booking application
 */
@Component({
  selector: 'app-root',
  template: `
    <div class="booking-mfe">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .booking-mfe {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class ContainerComponent {}
