import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getCurrentUserFromCookies()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, color: true, createdAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ error: 'Failed to get current user' }, { status: 500 })
  }
}