import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/auth.server";

import type { Route } from "./+types/register";

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

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const returnTo = formData.get("returnTo") as string | null;
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = registerSchema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      if (issue.path[0]) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
    }
    return { errors: fieldErrors };
  }

  try {
    const response = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      asResponse: true,
    });

    if (!response.ok) {
      return {
        errors: {
          form: "Failed to create account. Email may already be in use.",
        },
      };
    }

    return redirect(returnTo ?? "/", {
      headers: response.headers,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return { errors: { form: "An unexpected error occurred." } };
  }
}

export function meta() {
  return [
    { title: "Sign Up" },
    { name: "description", content: "Create a new account" },
  ];
}

export default function RegisterPage({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors ?? {};
  const returnTo = loaderData?.returnTo;

  const loginLink = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card py-6 shadow-sm">
        <div className="px-6 text-center space-y-2">
          <h1 className="text-2xl font-semibold text-balance">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm text-pretty">
            Get started with your new account
          </p>
        </div>
        <Form method="post" className="mt-6">
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <div className="px-6 space-y-4">
            {errors.form && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {errors.form}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                required
                disabled={isSubmitting}
                className={cn(
                  "h-9 w-full rounded-md border bg-transparent px-3 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name}</p>
              )}
            </div>
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
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                className={cn(
                  "h-9 w-full rounded-md border bg-transparent px-3 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                className={cn(
                  "h-9 w-full rounded-md border bg-transparent px-3 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">
                  {errors.confirmPassword}
                </p>
              )}
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
            <p className="text-muted-foreground text-sm text-center">
              Already have an account?{" "}
              <Link to={loginLink} className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}
