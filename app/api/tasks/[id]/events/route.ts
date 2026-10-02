import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the task to check project membership
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user is a member of the project
    if (task.project.members.length === 0) {
      // Also check if user is the assignee (they should be able to see events)
      if (task.assigneeId !== userId) {
        return NextResponse.json(
          { error: 'Access denied - not a project member' },
          { status: 403 }
        )
      }
    }

    // Get events for this task, ordered by createdAt ascending
    const events = await prisma.taskEvent.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        task: {
          select: {
            id: true,
            key: true,
            title: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Return sanitized response
    const response = events.map(event => ({
      id: event.id,
      taskId: event.taskId,
      projectId: event.projectId,
      userId: event.userId,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      createdAt: event.createdAt.toISOString(),
      user: event.user ? {
        id: event.user.id,
        name: event.user.name,
        color: event.user.color
      } : null,
      task: event.task ? {
        id: event.task.id,
        key: event.task.key,
        title: event.task.title
      } : null,
      project: event.project ? {
        id: event.project.id,
        name: event.project.name,
        color: event.project.color
      } : null
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('[task-events] Error fetching task events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task events' },
      { status: 500 }
    )
  }
}
