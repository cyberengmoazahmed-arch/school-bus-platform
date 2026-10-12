import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";
import { ROLE_HOME, type Role } from "@/lib/enums";

const SESSION_COOKIE = "saferide_session";

const roleRoutes: Record<string, Role> = {
  "/parent": "PARENT",
  "/driver": "DRIVER",
  "/school": "SCHOOL_ADMIN",
  "/admin": "SUPER_ADMIN",
  "/support": "SUPPORT",
};

const authRoutes = ["/login", "/register", "/verify-phone"];

async function currentRole(request: NextRequest): Promise<Role | null> {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  return session?.role ?? null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // Signed-in users skip the landing & auth pages.
  if (pathname === "/" || authRoutes.includes(pathname)) {
    if (pathname !== "/verify-phone") {
      const role = await currentRole(request);
      if (role) {
        url.pathname = ROLE_HOME[role];
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // Role-gated areas. Unknown paths simply pass through and are enforced
  // server-side (defense in depth) so new pages are never accidentally public.
  for (const [prefix, role] of Object.entries(roleRoutes)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const current = await currentRole(request);
      if (!current) {
        url.pathname = "/login";
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
      }
      if (current !== role) {
        url.pathname = ROLE_HOME[current];
        return NextResponse.redirect(url);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/(parent|driver|school|admin|support)/:path*", "/login", "/register", "/verify-phone"],
};