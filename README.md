# Boilerp**AI**te

A production-ready boilerplate for building web apps fast. React Router v7 + better-auth + Drizzle + TailwindCSS.

## What's Included

- **Auth** — Login, register, sessions (better-auth)
- **Database** — PostgreSQL + Drizzle ORM with typed schema
- **Storage** — S3/MinIO utilities for file uploads
- **Styling** — TailwindCSS + shadcn/ui theme
- **Testing** — Vitest + Testing Library
- **Linting** — ESLint + Prettier configured
- **Docs** — Guidelines for React Router, UI, and code quality

## Quick Start

```bash
# Clone
git clone git@github.com:yvocilon/boilerplaite.git my-project
cd my-project

# Install & setup (interactive)
pnpm install
pnpm setup
```

The setup script will:
1. Ask for your project name
2. Create `.env` with generated secrets
3. Spin up PostgreSQL in Docker
4. Run database migrations
5. Initialize a fresh git repo

Then start building:

```bash
pnpm dev
```

## Adding UI Components

The boilerplate uses [shadcn/ui](https://ui.shadcn.com). Add components as needed:

```bash
npx shadcn@latest add button card input label dialog
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm setup` | Interactive project setup |
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm spinup:db` | Start PostgreSQL container |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests |

## Project Structure

```
app/
├── components/        # UI components
├── lib/
│   ├── auth.ts        # Auth config
│   ├── db/schema.ts   # Database schema
│   └── storage/       # S3 utilities
├── routes/
│   ├── home.tsx       # Landing page
│   ├── login.tsx      # Login
│   └── register.tsx   # Registration
└── app.css            # Tailwind + theme
```

## Database

Your PostgreSQL container is named `{projectname}-db`. Manage it with:

```bash
docker start my-project-db   # Start
docker stop my-project-db    # Stop
```

## Documentation

- `CLAUDE.md` — Quick reference for AI assistants
- `TECHNICAL.md` — Architecture and data model
- `REACT_ROUTER_GUIDELINES.md` — Loader/action patterns
- `UI_GUIDELINES.md` — Design rules
- `CODE_QUALITY.md` — Testing and linting

## License

MIT
