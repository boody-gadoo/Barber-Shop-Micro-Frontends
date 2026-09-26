import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ContainerComponent } from './container.component';

/**
 * Container module exported for Module Federation
 */
@NgModule({
  declarations: [ContainerComponent],
  imports: [CommonModule, RouterModule],
  exports: [ContainerComponent],
})
export class ContainerModule {}
