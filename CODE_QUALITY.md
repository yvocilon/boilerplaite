# Code Quality Guidelines

## Linting & Formatting

### Tools

- **ESLint** — Code linting
- **Prettier** — Code formatting
- **TypeScript** — Type checking (strict mode)

### ESLint Rules

```javascript
// Key rules to enforce
{
  // TypeScript
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "@typescript-eslint/consistent-type-imports": "error",

  // React
  "react/prop-types": "off", // TypeScript handles this
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",

  // Import order
  "import/order": ["error", {
    "groups": ["builtin", "external", "internal", "parent", "sibling"],
    "newlines-between": "always"
  }],

  // General
  "no-console": ["warn", { "allow": ["warn", "error"] }],
  "prefer-const": "error",
  "no-var": "error"
}
```

### Import Order

```typescript
// 1. Node built-ins (if any)
import { readFile } from "fs";

// 2. External packages
import { eq } from "drizzle-orm";
import { useLoaderData } from "react-router";

// 3. Internal aliases (@/)
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

// 4. Parent imports
import { Layout } from "../layout";

// 5. Sibling imports
import { Card } from "./card";

// 6. Types (at the end, with type keyword)
import type { User } from "@/lib/db/schema";
```

### Prettier Config

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Testing

### Tools

- **Vitest** — Unit/integration test runner
- **Testing Library** — Component testing
- **Playwright MCP** — Visual verification of changes (run via Claude Code)

### Playwright Verification (via MCP)

After implementing UI changes, use Playwright MCP to verify:

- Navigate to the relevant page
- Take snapshots to verify layout and content
- Test user flows (click buttons, fill forms, etc.)
- Check for console errors

### What to Test

| Test                     | Priority | Example                                   |
| ------------------------ | -------- | ----------------------------------------- |
| Loaders (data fetching)  | High     | Returns correct data, throws on not found |
| Actions (mutations)      | High     | Validates input, creates/updates records  |
| Business logic utilities | High     | Data transformations, calculations        |
| Component behavior       | Medium   | User interactions, conditional rendering  |
| Form validation          | Medium   | Error states, submit handling             |

### What NOT to Test

- Styling / CSS classes
- Third-party library internals (shadcn, better-auth)
- Static content / copy
- Implementation details (internal state, private methods)
- React Router's navigation (trust the framework)

### Testing Loaders

```typescript
// example.test.ts
import { describe, it, expect } from "vitest";
import { loader } from "./example";

describe("example loader", () => {
  it("returns data when found", async () => {
    const response = await loader({
      params: { id: "123" },
      request: new Request("http://test.com/example/123"),
      context: {},
    });

    expect(response.data).toBeDefined();
  });

  it("throws 404 when not found", async () => {
    await expect(
      loader({
        params: { id: "nonexistent" },
        request: new Request("http://test.com/example/nonexistent"),
        context: {},
      })
    ).rejects.toThrow();
  });
});
```

### Testing Actions

```typescript
// example.test.ts
import { describe, it, expect } from "vitest";
import { action } from "./example";

describe("example action", () => {
  it("creates record with valid data", async () => {
    const formData = new FormData();
    formData.set("name", "Test");

    const response = await action({
      request: new Request("http://test.com/example", {
        method: "POST",
        body: formData,
      }),
      params: {},
      context: {},
    });

    // Action should redirect on success
    expect(response.status).toBe(302);
  });

  it("returns errors with invalid data", async () => {
    const formData = new FormData();
    formData.set("name", ""); // Invalid: empty

    const response = await action({
      request: new Request("http://test.com/example", {
        method: "POST",
        body: formData,
      }),
      params: {},
      context: {},
    });

    expect(response.errors).toBeDefined();
  });
});
```

### Test File Naming

```
// Co-locate tests with source files
app/
├── routes/
│   ├── example.tsx
│   └── example.test.ts    # Loader/action tests
├── components/
│   ├── card.tsx
│   └── card.test.tsx      # Component tests
└── lib/
    ├── utils.ts
    └── utils.test.ts      # Utility tests
```

---

## Commands

```bash
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix auto-fixable issues
pnpm format        # Run Prettier
pnpm format:check  # Check formatting without fixing
pnpm typecheck     # Run TypeScript compiler
pnpm test          # Run tests
pnpm test:watch    # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
```

---

## Pre-commit Checks

Run before every commit:

1. `pnpm typecheck` — No type errors
2. `pnpm lint` — No lint errors
3. `pnpm test` — All tests pass

---

## Coverage Expectations

| Area                 | Minimum | Target |
| -------------------- | ------- | ------ |
| Loaders/Actions      | 80%     | 90%    |
| Business logic utils | 90%     | 100%   |
| Components           | 60%     | 80%    |
| Overall              | 70%     | 80%    |

SHOULD NOT chase 100% coverage — focus on behavior, not lines.
