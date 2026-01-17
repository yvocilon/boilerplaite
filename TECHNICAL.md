# Technical Specification

## Tech Stack

- **Framework**: React Router v7 (Framework Mode)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Auth**: better-auth
- **Storage**: MinIO (S3-compatible, for file uploads)
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS
- **Animation**: motion/react (when needed), tw-animate-css
- **Utilities**: clsx + tailwind-merge (via cn helper)
- **Validation**: Zod
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier

---

## Data Model

### Core Tables (better-auth)

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│    user     │       │   session   │       │   account    │
├─────────────┤       ├─────────────┤       ├──────────────┤
│ id          │──────<│ userId      │       │ id           │
│ email       │       │ token       │       │ userId       │>──┐
│ name        │       │ expiresAt   │       │ providerId   │   │
│ image       │       │ ipAddress   │       │ accountId    │   │
│ createdAt   │       │ userAgent   │       │ ...          │   │
│ updatedAt   │       └─────────────┘       └──────────────┘   │
└─────────────┘                                                │
      │                                                        │
      └────────────────────────────────────────────────────────┘
```

### Additional Tables

```
┌─────────────────┐
│   verification  │  (email verification)
├─────────────────┤
│ id              │
│ identifier      │
│ value           │
│ expiresAt       │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

---

## Database Schema (Drizzle)

The schema includes better-auth tables plus any app-specific tables you add:

```typescript
// app/lib/db/schema.ts

// better-auth tables
export const user = pgTable("user", { ... });
export const session = pgTable("session", { ... });
export const account = pgTable("account", { ... });
export const verification = pgTable("verification", { ... });

// Add your app-specific tables here
```

---

## API Routes

### Authentication (via better-auth)

| Method | Path               | Description         |
| ------ | ------------------ | ------------------- |
| POST   | /api/auth/sign-up  | Create account      |
| POST   | /api/auth/sign-in  | Login               |
| POST   | /api/auth/sign-out | Logout              |
| GET    | /api/auth/session  | Get current session |

### Health

| Method | Path        | Description       |
| ------ | ----------- | ----------------- |
| GET    | /api/health | Health check      |

---

## Page Routes

```
/                               → Landing page (home.tsx)
/login                          → Login page
/register                       → Registration page
```

---

## Directory Structure

```
app/
├── components/
│   ├── ui/                     # shadcn components
│   └── route-error-boundary.tsx
│
├── routes/
│   ├── home.tsx                # Landing page
│   ├── login.tsx               # Login page
│   ├── register.tsx            # Registration page
│   ├── api.auth.$.ts           # Auth API handler
│   └── api.health.ts           # Health check
│
├── lib/
│   ├── db/
│   │   ├── index.ts            # Drizzle client
│   │   └── schema.ts           # Database schema
│   ├── storage/
│   │   ├── index.ts            # MinIO S3 client
│   │   └── validation.ts       # File validation
│   ├── auth.ts                 # better-auth config
│   ├── auth.client.ts          # Client auth hooks
│   ├── auth.server.ts          # Server auth helpers
│   └── utils.ts                # Utilities (cn, etc.)
│
├── app.css                     # Global styles + Tailwind
├── root.tsx                    # Root layout
└── routes.ts                   # Route definitions
```

---

## Security Notes

- Session cookies: HttpOnly, Secure, SameSite=Lax
- CSRF protection via better-auth
- Input validation with Zod
- SQL injection prevented by Drizzle

---

## MinIO Storage Configuration

### Development

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v minio_data:/data \
  minio/minio server /data --console-address ":9001"
```

Environment variables (`.env`):
```
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads
```

### Production

Configure your S3-compatible storage:
```
MINIO_ENDPOINT=https://s3.yourdomain.com
MINIO_ACCESS_KEY=<your-access-key>
MINIO_SECRET_KEY=<your-secret-key>
MINIO_BUCKET=uploads
```
