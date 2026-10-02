import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'
import { generateLinkingToken } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate linking token
    const { token, expiresAt } = await generateLinkingToken(userId)

    // Construct the Telegram start link
    const botUsername = 'hostlink_notify_bot'
    const telegramLink = `https://t.me/${botUsername}?start=${token}`

    return NextResponse.json({
      telegramLink,
      tokenExpiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('[telegram/link] Error generating token:', error)
    return NextResponse.json(
      { error: 'Failed to generate linking token' },
      { status: 500 }
    )
  }
}
