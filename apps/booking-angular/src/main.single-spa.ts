import { NgZone } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import {
  getSingleSpaExtraProviders,
  singleSpaAngular,
} from 'single-spa-angular';
import { AppModule } from './app/app.module';

const lifecycles = singleSpaAngular({
  bootstrapFunction: () =>
    platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(AppModule, {
      preserveWhitespaces: false,
    }),
  template: '<app-root />',
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;