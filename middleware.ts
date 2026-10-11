import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require admin authentication
const PROTECTED_ROUTES = ["/admin-dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for auth token in cookie or header
  // Since we use localStorage (client-side), the middleware can only check
  // for a cookie. We'll set a cookie alongside localStorage in the frontend.
  const token = request.cookies.get("bottelpay_token")?.value;

  if (!token) {
    // Redirect to the hidden admin login page
    const loginUrl = new URL("/admin-secret-login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — allow access (actual role validation happens client-side
  // and server-side via API calls)
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-dashboard/:path*"],
};
