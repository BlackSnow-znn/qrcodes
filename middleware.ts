import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  const validToken = process.env.ADMIN_SECRET

  const isProtected =
    request.nextUrl.pathname.startsWith('/admin/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin/edit')

  if (isProtected && token !== validToken) {
    const loginUrl = new URL('/admin', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard', '/admin/dashboard/:path*', '/admin/edit/:path*'],
}
