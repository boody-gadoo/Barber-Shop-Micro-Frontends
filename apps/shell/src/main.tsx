import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { registerApplication, start } from 'single-spa';
import singleSpaReact from 'single-spa-react';
import type { LifeCycles } from 'single-spa';
import App from './App';
import './index.css';

const remoteUrls = {
  services: '/__mfe/services/src/single-spa.tsx',
  booking: '/__mfe/booking/main.js',
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

type RemoteProps = {
  domElementGetter: () => HTMLElement;
};

async function loadRemote(url: string): Promise<LifeCycles<RemoteProps>> {
  const module = (await import(/* @vite-ignore */ url)) as Partial<LifeCycles<RemoteProps>>;

  if (!module.bootstrap || !module.mount || !module.unmount) {
    throw new Error(`Remote "${url}" does not expose single-spa lifecycles`);
  }

  return module as LifeCycles<RemoteProps>;
}

const remoteScripts = new Map<string, Promise<LifeCycles<RemoteProps>>>();

function loadRemoteScript(url: string, globalName: string): Promise<LifeCycles<RemoteProps>> {
  const existing = remoteScripts.get(url);
  if (existing) {
    return existing;
  }

  const promise = new Promise<LifeCycles<RemoteProps>>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      const module = (window as unknown as Record<string, Partial<LifeCycles<RemoteProps>>>)[
        globalName
      ];

      if (!module?.bootstrap || !module.mount || !module.unmount) {
        reject(new Error(`Remote "${url}" did not expose "${globalName}" lifecycles`));
        return;
      }

      resolve(module as LifeCycles<RemoteProps>);
    };
    script.onerror = () => reject(new Error(`Failed to load remote script "${url}"`));
    document.head.appendChild(script);
  });

  remoteScripts.set(url, promise);
  return promise;
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
  app: () => loadRemoteScript(remoteUrls.booking, 'booking-angular'),
  activeWhen: ['/booking'],
  customProps: {
    domElementGetter: () => getMountPoint('booking-mount'),
  },
});

start({ urlRerouteOnly: true });

