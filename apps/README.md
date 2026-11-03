# Application codebase

This directory contains the runnable Next.js application and its Convex
backend. Repository-level setup, development, and validation commands are
documented in the [root README](../README.md).

## Important paths

- `app/`: Next.js App Router pages, layouts, and route handlers.
- `components/`: application components plus vendored shadcn/ui and AI Elements
  source.
- `convex/`: deployment-independent Convex backend source and generated API
  types.
- `lib/site-config.ts`: centralized starter branding.
- `.env.sample`: browser-visible and CLI-managed environment variable names.

## Direct commands

These are equivalent to the root command facade:

```bash
npm ci
npm run convex:init
npm run dev
npm run check
```

`npm run convex:init` runs `convex dev --once`: it configures a development
project when needed and attempts the first sync. Prefer the root
`npm run setup` flow for a fresh copy because it configures the required
authentication environment variables and then performs the final development
sync.

`npm run dev` starts `convex dev` and launches Next.js through the Convex CLI.
Use `npm run dev:convex` and `npm run dev:web` in separate terminals when you
need independent logs.

Do not edit `convex/_generated/` manually. Keep it committed so TypeScript can
work before a new user selects a deployment; `convex dev` regenerates it after
project selection.

Authentication can use Google, email/password, or both. Google is recommended
but optional. Configure the public presentation flags in `.env.local` and the
matching backend flags in the selected Convex deployment. See
[`docs/04-authentication.md`](../docs/04-authentication.md).
