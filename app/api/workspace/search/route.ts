import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim() || ''

    if (!query) {
      return NextResponse.json([])
    }

    // Search tasks by title and description (MySQL doesn't support mode: 'insensitive')
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } }
        ]
      },
      include: { project: true },
      take: 50
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
