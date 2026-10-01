import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

export async function GET(
  request: NextRequest
) {
  try {
    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: { project: true }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}
