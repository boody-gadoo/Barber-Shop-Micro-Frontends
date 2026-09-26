import { Component } from '@angular/core';

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
