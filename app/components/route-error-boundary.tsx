import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { cn } from "@/lib/utils";

interface RouteErrorBoundaryProps {
  /** Where the "Go back" button should navigate to */
  backTo?: string;
  /** Label for the back button */
  backLabel?: string;
}

export function RouteErrorBoundary({
  backTo = "/",
  backLabel = "Go back",
}: RouteErrorBoundaryProps) {
  const error = useRouteError();

  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again.";
  let statusCode: number | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    switch (error.status) {
      case 404:
        title = "Not found";
        description =
          error.statusText || "The page you're looking for doesn't exist.";
        break;
      case 403:
        title = "Access denied";
        description =
          error.statusText || "You don't have permission to view this page.";
        break;
      case 401:
        title = "Unauthorized";
        description = error.statusText || "Please sign in to continue.";
        break;
      default:
        title = `Error ${error.status}`;
        description = error.statusText || description;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    description = error.message;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-balance">
            {statusCode && (
              <span className="text-muted-foreground mr-2">{statusCode}</span>
            )}
            {title}
          </h1>
          <p className="text-muted-foreground text-sm text-pretty">
            {description}
          </p>
        </div>
        {import.meta.env.DEV && error instanceof Error && error.stack && (
          <div className="mt-4">
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              <code>{error.stack}</code>
            </pre>
          </div>
        )}
        <div className="mt-6 flex gap-2">
          <Link
            to={backTo}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium",
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {backLabel}
          </Link>
          <button
            onClick={() => window.location.reload()}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90"
            )}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
