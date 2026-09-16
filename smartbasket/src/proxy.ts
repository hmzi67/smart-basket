
import { NextRequest, NextResponse } from "next/server"
import { auth } from "./auth"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Allow public routes without authentication
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/api/auth"]
  if (publicRoutes.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const session = await auth()
  


  if (!session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.url)
    return NextResponse.redirect(loginUrl)
  }
  const role = session.user?.role

if (pathname.startsWith("/user") && role !== "user") {
  return NextResponse.redirect(new URL("/unauthorized", req.url))
}

if (pathname.startsWith("/delivery") && role !== "deliveryBoy") {
  return NextResponse.redirect(new URL("/unauthorized", req.url))
}

// shopkeepers manage the shared catalog through the same admin grocery pages;
// everything else under /admin (orders, users, the dashboard) stays admin-only
const catalogPages = ["/admin/add-grocery", "/admin/view-grocery"]
if (pathname.startsWith("/admin")) {
  const isCatalogPage = catalogPages.some((path) => (pathname === path || pathname === `${path}/`))
  const isAddPage = pathname === "/admin/add-grocery" || pathname === "/admin/add-grocery/"
  const allowed = (role === "admin" && !isAddPage) || (isCatalogPage && role === "shopkeeper")
  if (!allowed) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }
}

  return NextResponse.next()
}
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}