import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("api/health", "routes/api.health.ts"),
] satisfies RouteConfig;
