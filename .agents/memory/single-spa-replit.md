---
name: Single-spa Replit setup
description: Environment-specific constraints for running the React and Angular single-spa remotes behind the Replit shell preview.
---

Angular CLI 17 requires `serve.options.allowedHosts` to be an array, and the Angular single-spa bundle is UMD rather than an ES module. The shell must load the shared `zone.js` runtime and inject the Angular bundle as a script, then read its global lifecycle object. Vite remotes should be accessed through shell-origin proxy paths so browser requests do not depend on localhost or separate preview ports.

**Why:** The default imported configuration started the React shell but left both remote routes blank or unreachable in the Replit preview.

**How to apply:** Keep the shell on the webview port, proxy dedicated remote asset prefixes to the remote dev servers, use `import()` for the React lifecycle module, and use a cached script loader for the Angular UMD lifecycle.