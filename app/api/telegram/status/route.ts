import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'
import { getTelegramStatus } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Telegram connection status
    const status = await getTelegramStatus(userId)

    return NextResponse.json(status)
  } catch (error) {
    console.error('[telegram/status] Error getting status:', error)
    return NextResponse.json(
      { error: 'Failed to get Telegram status' },
      { status: 500 }
    )
  }
}
