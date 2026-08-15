import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/** Routes reachable without a session. Everything else requires one. */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Refreshes the auth cookie on every request and gates the protected routes.
 *
 * Two rules that are easy to get wrong and expensive to debug:
 *  1. Always return the `supabaseResponse` object built here (or copy its
 *     cookies onto whatever you return instead). Returning a fresh
 *     NextResponse drops the refreshed session and logs the user out at random.
 *  2. Use getUser(), not getSession(). getSession() reads the cookie without
 *     verifying it, so it will happily trust a forged one.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    // An API route must answer with a status the caller can act on. Redirecting
    // a fetch() to /login returns 200 + an HTML page, which client code parses
    // as a successful response and then fails on in a confusing place.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "cache-control": "no-store" } },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Send them back where they were headed once they sign in. Only a relative
    // in-app path — never echo an absolute URL into this, or it becomes an open
    // redirect that lets a phishing link bounce off our own domain.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
