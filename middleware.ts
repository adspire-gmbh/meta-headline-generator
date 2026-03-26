import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")?.value;
  const expectedToken = process.env.APP_PASSWORD;

  if (authToken && expectedToken && authToken === expectedToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /api/auth
     * - /_next (static files)
     * - /favicon.ico, /icons, /images
     */
    "/((?!login|api/auth|_next|favicon\\.ico|.*\\.svg|.*\\.png).*)",
  ],
};
