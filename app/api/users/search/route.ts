import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/users/search?q=query&projectId=optional
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim() || ''
    const projectId = searchParams.get('projectId')

    if (!query) {
      return NextResponse.json([])
    }

    // Search users by name or email (case-insensitive via contains)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        color: true,
        role: true
      },
      take: 8
    })

    // If projectId is provided, exclude users who are already members
    if (projectId) {
      const memberships = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true }
      })
      const memberIds = new Set(memberships.map(m => m.userId))
      const filtered = users.filter(u => !memberIds.has(u.id))
      return NextResponse.json(filtered)
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}