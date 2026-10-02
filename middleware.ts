import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

const publicRoutes = ['/login', '/signup', '/']
const protectedRoutes = ['/projects', '/dashboard', '/analytics', '/team', '/settings', '/my-tasks']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('hostlink_auth')?.value

  // Check if the route needs protection
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  // If accessing a protected route without a token, redirect to login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, verify it
  if (token) {
    try {
      await jwtVerify(token, secret)
      // Token is valid, continue
    } catch (error) {
      // Token is invalid, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('hostlink_auth')
      return response
    }
  }

  // If already logged in and accessing login/signup, redirect to projects
  if ((pathname === '/login' || pathname === '/signup') && token) {
    try {
      await jwtVerify(token, secret)
      return NextResponse.redirect(new URL('/projects', request.url))
    } catch (error) {
      // Token invalid, allow access to login/signup
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|ca.pem|api/).*)',
  ],
}
