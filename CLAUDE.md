# Claude Code Project Reference

## What This Is

**BoilerpAIte** — A production-ready boilerplate for React Router v7 applications with authentication, database, and file storage.

## Key Documents

- `TECHNICAL.md` — Technical spec: data model, API routes, directory structure
- `UI_GUIDELINES.md` — UI/UX rules: design, animation, accessibility, component usage
- `REACT_ROUTER_GUIDELINES.md` — React Router v7 patterns: loaders, actions, forms
- `CODE_QUALITY.md` — Linting, testing, Playwright MCP verification

## Tech Stack

- React Router v7 (Framework Mode)
- TypeScript (strict)
- PostgreSQL + Drizzle ORM
- better-auth for authentication
- MinIO/S3 for file storage
- shadcn/ui + TailwindCSS

## Conventions

- Use shadcn components from `app/components/ui/`
- Routes follow React Router v7 flat file convention
- Database schema in `app/lib/db/schema.ts`
- Auth config in `app/lib/auth.ts`
- Auth client in `app/lib/auth.client.ts`
- Auth server helpers in `app/lib/auth.server.ts` (`requireSession`, `getSession`)
- Use `cn()` utility for class logic (clsx + tailwind-merge)

## Key Files

```
app/
├── components/
│   └── ui/            # shadcn components
├── lib/
│   ├── db/
│   │   ├── index.ts   # Drizzle client
│   │   └── schema.ts  # Database schema
│   ├── storage/
│   │   ├── index.ts   # MinIO S3 client
│   │   └── validation.ts # File type/size validation
│   ├── auth.ts        # better-auth server config
│   ├── auth.client.ts # better-auth client hooks
│   ├── auth.server.ts # Session helpers for loaders
│   └── utils.ts       # cn() and other utilities
├── routes/
│   ├── api.auth.$.ts  # Auth API handler
│   ├── api.health.ts  # Health check endpoint
│   ├── login.tsx      # Login page
│   ├── register.tsx   # Registration page
│   └── home.tsx       # Landing page
└── routes.ts          # Route definitions
```

## UI Rules (see UI_GUIDELINES.md for full list)

- No animations unless explicitly requested
- No gradients, no glow effects
- Use h-dvh not h-screen
- Use text-balance for headings, text-pretty for body
- Use tabular-nums for data
- AlertDialog for destructive actions
- Never rebuild keyboard/focus behavior by hand

## React Router Rules (see REACT_ROUTER_GUIDELINES.md for full list)

- Use `loader` for data fetching, NEVER useEffect
- Use `action` for mutations, NEVER fetch in handlers
- Use `<Form>` not `<form>`
- Use `useFetcher` for non-navigating mutations
- Use `useNavigation().state` for loading states, not useState
- Use `<Link>` for navigation, never `<a href>`
- Validate form data with Zod in actions
- **MUST export ErrorBoundary** for all routes (use `RouteErrorBoundary` component)

## Testing Rules (see CODE_QUALITY.md for full list)

- Co-locate tests with source files (`.test.ts` / `.test.tsx`)
- Test loaders and actions directly (high priority)
- Test business logic utilities (high priority)
- Test component behavior, not implementation details
- Don't test styling, static content, or framework internals
- **Use Playwright MCP** to visually verify UI changes after implementation

## Commands

```bash
# Development
pnpm dev          # Start dev server (http://localhost:5173)
pnpm build        # Production build
pnpm start        # Start production server

# Database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema directly (dev)
pnpm db:studio    # Open Drizzle Studio

# Quality
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm typecheck    # TypeScript check
pnpm test         # Run tests
pnpm test:watch   # Tests in watch mode
```

## Database

Start PostgreSQL with Docker:

```bash
docker run -d \
  --name webapp-shell-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=webapp_shell \
  -p 5432:5432 \
  postgres:16
```

## Deployment (Coolify + Nixpacks)

- **Platform**: Coolify (self-hosted PaaS)
- **Build**: Nixpacks (auto-detects Node.js)
- **Config**: `nixpacks.toml`

```toml
[phases.build]
cmds = ["pnpm run build"]

[start]
cmd = "pnpm run db:migrate && pnpm run start"
```

**Key points:**
- Migrations run automatically on every deploy (before server starts)
- Generate migrations locally with `pnpm db:generate` before pushing
- Push migrations to git so they're available in production

## Pre-Completion Checklist

**MUST complete before finishing any feature:**

```bash
pnpm lint       # No lint errors
pnpm typecheck  # No type errors
pnpm test       # All tests pass
```

**For new routes:** Register in `app/routes.ts` + export `ErrorBoundary`
**For new utilities:** Add co-located `.test.ts` file
**For UI changes:** Verify with Playwright MCP
**For DB schema changes:** Run `pnpm db:generate` and commit the migration file
