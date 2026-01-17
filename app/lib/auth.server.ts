import { redirect } from "react-router";

import { auth, type Session } from "./auth";

export async function getSession(request: Request): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

export async function requireSession(request: Request): Promise<Session> {
  const session = await getSession(request);
  if (!session) {
    throw redirect("/login");
  }
  return session;
}

export async function requireNoSession(request: Request): Promise<void> {
  const session = await getSession(request);
  if (session) {
    // Redirect to your app's main page after login
    throw redirect("/");
  }
}
