import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.taskEvent.findMany({
      include: {
        user: true,
        task: true,
        project: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 })
  }
}
