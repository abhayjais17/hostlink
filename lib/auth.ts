import { jwtVerify, SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

const AUTH_COOKIE_NAME = 'hostlink_auth'

export interface JWTPayload {
  userId: string
  iat?: number
  exp?: number
}

// Sign a JWT token for a user
export async function signSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
  return token
}

// Verify and decode a JWT token
export async function verifySession(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, secret)
    return {
      userId: verified.payload.userId as string,
      iat: verified.payload.iat,
      exp: verified.payload.exp
    }
  } catch (error) {
    return null
  }
}

// Get current user from cookies (for use in route handlers / server components)
export async function getCurrentUserFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verifySession(token)
  return payload?.userId || null
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })
}

// Clear auth cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

// Hash a password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Compare a password with its hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
