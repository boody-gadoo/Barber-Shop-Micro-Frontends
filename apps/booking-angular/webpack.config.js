const path = require('path');
const { withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'booking',
  filename: 'remoteEntry.js',
  exposes: {
    './Container': './apps/booking-angular/src/app/container.component.ts',
  },

  shared: {
    '@angular/core': { singleton: true },
    '@angular/common': { singleton: true },
    '@angular/router': { singleton: true },
    'rxjs': { singleton: true },
    'tslib': { singleton: true },
  },
});
