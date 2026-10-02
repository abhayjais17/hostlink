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

    // Check if user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied - not a project member' },
        { status: 403 }
      )
    }

    // Get events for tasks in this project, ordered by createdAt ascending
    const events = await prisma.taskEvent.findMany({
      where: { projectId: id },
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
            title: true,
            assigneeId: true
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

    // Return sanitized response matching TaskEvent type in lib/types.ts
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
        title: event.task.title,
        assigneeId: event.task.assigneeId
      } : null,
      project: event.project ? {
        id: event.project.id,
        name: event.project.name,
        color: event.project.color
      } : null
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('[project-events] Error fetching project events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project events' },
      { status: 500 }
    )
  }
}
