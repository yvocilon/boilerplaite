# React Router v7 Guidelines

## Data Loading

- MUST use `loader` functions for data fetching, NEVER useEffect
- MUST use `clientLoader` only when server loader is not possible (e.g., local storage)
- SHOULD co-locate loader and component in the same route file
- MUST use `useLoaderData()` to access loader data in components
- NEVER fetch in components — data comes from loaders

```typescript
// Good
export async function loader({ params }: Route.LoaderArgs) {
  const data = await db.query.items.findFirst({
    where: eq(items.id, params.id)
  });
  if (!data) throw new Response("Not Found", { status: 404 });
  return { data };
}

export default function ItemPage() {
  const { data } = useLoaderData<typeof loader>();
  return <div>{data.name}</div>;
}

// Bad — never do this
export default function ItemPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/item').then(r => r.json()).then(setData);
  }, []);
}
```

## Data Mutations

- MUST use `action` functions for mutations, NEVER fetch/axios in handlers
- MUST use `<Form>` component for mutations, not `<form>`
- SHOULD use `useFetcher` for mutations that don't navigate
- MUST return `redirect()` from actions that should navigate after success
- SHOULD return data from actions for inline updates

```typescript
// Good — action with Form
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  await db.insert(items).values({ title });
  return redirect("/items");
}

export default function NewItem() {
  return (
    <Form method="post">
      <input name="title" />
      <button type="submit">Create</button>
    </Form>
  );
}

// Good — fetcher for non-navigating mutation
export default function ItemCard({ item }) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" action={`/items/${item.id}/delete`}>
      <button>Delete</button>
    </fetcher.Form>
  );
}
```

## Route File Conventions

- File name becomes URL path: `items.$id.tsx` → `/items/:id`
- Use `.` for path segments, `$` for dynamic params
- `_index.tsx` is the index route for a parent
- `_layout.tsx` prefix for pathless layout routes
- Use parentheses for route groups: `(auth)/login.tsx`

```
routes/
├── _index.tsx              # /
├── login.tsx               # /login
├── items._index.tsx        # /items
├── items.new.tsx           # /items/new
├── items.$id.tsx           # /items/:id (layout)
├── items.$id._index.tsx    # /items/:id (content)
├── items.$id.settings.tsx  # /items/:id/settings
```

## Layouts and Nesting

- Parent routes render `<Outlet />` for child content
- SHOULD use layout routes for shared UI (sidebar, header)
- Data from parent loaders is NOT automatically available to children
- MUST pass data via context or re-fetch in child if needed

```typescript
// items.$id.tsx — layout route
export async function loader({ params }: Route.LoaderArgs) {
  const item = await getItem(params.id);
  return { item };
}

export default function ItemLayout() {
  const { item } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>{item.name}</h1>
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
```

## Error Handling

- MUST export `ErrorBoundary` for route-level error handling
- SHOULD throw `Response` objects for expected errors (404, 403)
- Use `isRouteErrorResponse()` to check for Response errors
- Unexpected errors should bubble to root error boundary

```typescript
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }

  return <div>Something went wrong</div>;
}
```

## Pending & Loading States

- MUST use `useNavigation()` for global navigation state
- MUST use `fetcher.state` for fetcher-specific state
- SHOULD show pending UI during navigation/submission
- NEVER use separate loading state variables

```typescript
export default function NewItem() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <input name="title" disabled={isSubmitting} />
      <button disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </button>
    </Form>
  );
}
```

## Type Safety

- MUST type loader/action args with `Route.LoaderArgs` and `Route.ActionArgs`
- MUST use `useLoaderData<typeof loader>()` for type inference
- SHOULD use Zod for form data validation in actions

```typescript
import { z } from "zod";

const ItemSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = ItemSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await db.insert(items).values(result.data);
  return redirect("/items");
}
```

## Navigation

- MUST use `<Link>` for navigation, never `<a href>`
- MUST use `<NavLink>` for navigation with active states
- SHOULD use `useNavigate()` only for programmatic navigation (after actions, events)
- NEVER use `useNavigate()` as a substitute for `<Link>`

```typescript
// Good
<Link to="/items">Items</Link>
<NavLink to="/items" className={({ isActive }) => isActive ? "active" : ""}>

// Good — programmatic after event
const navigate = useNavigate();
function handleSuccess() {
  navigate("/dashboard");
}

// Bad — should be a Link
<button onClick={() => navigate("/items")}>Go to Items</button>
```

## Revalidation

- Loaders automatically revalidate after actions
- SHOULD use `shouldRevalidate` to optimize when needed
- MUST NOT manually refetch data that loaders provide

## Search Params

- MUST use `useSearchParams()` for URL search parameters
- SHOULD use `<Form method="get">` for search/filter forms
- NEVER store filter state in React state if it should be URL-based

```typescript
export default function ItemList() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "all";

  return (
    <Form method="get">
      <select name="status" defaultValue={status}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
      <button type="submit">Filter</button>
    </Form>
  );
}
```

## Common Mistakes to Avoid

- NEVER use `useEffect` for data fetching
- NEVER use `useState` for data that comes from loaders
- NEVER use `fetch()` in event handlers for mutations — use `useFetcher`
- NEVER use `<form>` — always use `<Form>` from react-router
- NEVER redirect with `useNavigate()` in loaders/actions — use `redirect()`
- NEVER handle loading state with `useState` — use `navigation.state`
