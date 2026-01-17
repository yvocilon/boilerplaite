import { Link, redirect } from "react-router";

import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth.server";

import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "Welcome" },
    { name: "description", content: "Welcome to the app" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);

  // If logged in, you might want to redirect to a dashboard
  // For now, we'll just show the home page with different content
  return { user: session?.user ?? null };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  if (user) {
    // Logged in view
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-balance">
            Welcome back, {user.name}!
          </h1>
          <p className="mt-4 text-muted-foreground text-pretty">
            You're signed in. Start building your app!
          </p>
          <form action="/api/auth/sign-out" method="post" className="mt-8">
            <button
              type="submit"
              className={cn(
                "h-9 px-4 rounded-md border text-sm font-medium",
                "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Logged out view
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
          Webapp Shell
        </h1>
        <p className="mt-6 text-lg text-muted-foreground text-pretty">
          A production-ready boilerplate with React Router v7, better-auth,
          Drizzle ORM, and TailwindCSS.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className={cn(
              "h-10 px-6 inline-flex items-center justify-center rounded-md text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className={cn(
              "h-10 px-6 inline-flex items-center justify-center rounded-md text-sm font-medium",
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
