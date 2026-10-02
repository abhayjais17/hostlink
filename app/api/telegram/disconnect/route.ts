import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'
import { disconnectTelegram } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Disconnect Telegram
    await disconnectTelegram(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[telegram/disconnect] Error disconnecting:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Telegram' },
      { status: 500 }
    )
  }
}
