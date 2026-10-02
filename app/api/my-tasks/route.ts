import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

export async function GET() {
  try {
    // Get current authenticated user from session
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tasks assigned to this user AND belonging to projects where they are a member
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        project: {
          members: {
            some: {
              userId
            }
          }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Return plain array to match client expectations
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('[my-tasks] Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

