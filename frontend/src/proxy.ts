import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication (and optionally a specific role)
const PROTECTED: { pattern: RegExp; role?: "ADMIN" | "USER" }[] = [
  { pattern: /^\/dashboard\/user(\/|$)/, role: "USER" },
  { pattern: /^\/dashboard\/admin(\/|$)/, role: "ADMIN" },
  { pattern: /^\/profile\/user(\/|$)/, role: "USER" },
  { pattern: /^\/profile\/admin(\/|$)/, role: "ADMIN" },
];

// Routes that logged-in users should not revisit
const AUTH_ROUTES = ["/login", "/admin-register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("adyapan-token")?.value;
  const userRaw = request.cookies.get("adyapan-user")?.value;

  let role: string | null = null;
  if (userRaw) {
    try {
      role = (JSON.parse(decodeURIComponent(userRaw)) as { role?: string }).role ?? null;
    } catch {
      role = null;
    }
  }

  const isLoggedIn = Boolean(token && role);

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const dest = role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Check protected routes
  for (const route of PROTECTED) {
    if (route.pattern.test(pathname)) {
      // Not logged in → send to login
      if (!isLoggedIn) {
        const url = new URL("/login", request.url);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
      }

      // Wrong role → send to their own dashboard
      if (route.role && role !== route.role) {
        const dest = role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user";
        return NextResponse.redirect(new URL(dest, request.url));
      }

      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/login",
    "/admin-register",
  ],
};
