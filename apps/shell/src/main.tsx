import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { registerApplication, start } from 'single-spa';
import singleSpaReact from 'single-spa-react';
import App from './App';
import './index.css';

const remoteUrls = {
  services: import.meta.env.DEV
    ? 'http://localhost:3002/src/single-spa.tsx'
    : `${window.location.origin}/services/single-spa.js`,
  booking: import.meta.env.DEV
    ? 'http://localhost:3003/main.js'
    : `${window.location.origin}/booking/main.js`,
} as const;

const shellLifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: App,
  domElementGetter: () => {
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Root element not found');
    }
    return root;
  },
});

function getMountPoint(id: string): HTMLElement {
  const mountPoint = document.getElementById(id);
  if (!mountPoint) {
    throw new Error(`single-spa mount point "${id}" was not found`);
  }
  return mountPoint;
}

async function loadRemote(url: string): Promise<unknown> {
  return import(/* @vite-ignore */ url);
}

registerApplication({
  name: '@shell/app',
  app: () => Promise.resolve(shellLifecycles),
  activeWhen: () => true,
});

registerApplication({
  name: '@services-react/app',
  app: () => loadRemote(remoteUrls.services),
  activeWhen: ['/services'],
  customProps: {
    domElementGetter: () => getMountPoint('services-mount'),
  },
});

registerApplication({
  name: '@booking-angular/app',
  app: () => loadRemote(remoteUrls.booking),
  activeWhen: ['/booking'],
  customProps: {
    domElementGetter: () => getMountPoint('booking-mount'),
  },
});

start({ urlRerouteOnly: true });

