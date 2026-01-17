import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/auth.server";

import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");

  // If already logged in, redirect to returnTo or home
  if (session) {
    throw redirect(returnTo ?? "/");
  }

  return { returnTo };
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const returnTo = formData.get("returnTo") as string | null;
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // Call the auth API directly to get full response with headers
  const response = await auth.api.signInEmail({
    body: {
      email: data.email,
      password: data.password,
    },
    asResponse: true,
  });

  if (!response.ok) {
    return { error: "Invalid email or password" };
  }

  // Forward the auth cookies and redirect
  return redirect(returnTo ?? "/", {
    headers: response.headers,
  });
}

export function meta() {
  return [
    { title: "Login" },
    { name: "description", content: "Sign in to your account" },
  ];
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const returnTo = loaderData?.returnTo;

  const registerLink = returnTo
    ? `/register?returnTo=${encodeURIComponent(returnTo)}`
    : "/register";

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card py-6 shadow-sm">
        <div className="px-6 text-center space-y-2">
          <h1 className="text-2xl font-semibold text-balance">Welcome back</h1>
          <p className="text-muted-foreground text-sm text-pretty">
            Sign in to your account to continue
          </p>
        </div>
        <Form method="post" className="mt-6">
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <div className="px-6 space-y-4">
            {actionData?.error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {actionData.error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={isSubmitting}
                className={cn(
                  "h-9 w-full rounded-md border bg-transparent px-3 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className={cn(
                  "h-9 w-full rounded-md border bg-transparent px-3 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>
          </div>
          <div className="mt-6 px-6 flex flex-col gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "h-9 w-full rounded-md bg-primary text-primary-foreground text-sm font-medium",
                "hover:bg-primary/90",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            <p className="text-muted-foreground text-sm text-center">
              Don't have an account?{" "}
              <Link to={registerLink} className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}
