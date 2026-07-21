import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password"];

const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/admin"],
  DOSEN: ["/dosen"],
  MAHASISWA: ["/mahasiswa"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    if (isLoggedIn && role) {
      const dashboardMap: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        DOSEN: "/dosen/dashboard",
        MAHASISWA: "/mahasiswa/dashboard",
      };
      return NextResponse.redirect(new URL(dashboardMap[role] ?? "/", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (role) {
    const allowedPrefixes = roleRoutes[role] ?? [];
    const hasAccess = allowedPrefixes.some((prefix) =>
      pathname.startsWith(prefix),
    );

    if (
      !hasAccess &&
      !pathname.startsWith("/api") &&
      pathname !== "/"
    ) {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};