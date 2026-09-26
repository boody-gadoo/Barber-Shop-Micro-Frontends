# Replit run guide

## Start the linked single-spa app

```bash
pnpm install
pnpm dev
```

The `Start application` workflow runs all three frontend applications:

- Shell: port 5000 (the Replit preview)
- Services React remote: port 3002
- Booking Angular remote: port 3003

The shell proxies the remote assets through `/__mfe/services/*` and
`/__mfe/booking/*`, so browser navigation stays on the shell origin while
single-spa mounts each remote at its route.

## Verification

```bash
pnpm typecheck
NG_CLI_ANALYTICS=false pnpm build
```

The main routes are `/`, `/services`, and `/booking`.