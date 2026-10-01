import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  backlog: ['in_progress'],
  in_progress: ['backlog', 'review'],
  review: ['in_progress', 'done'],
  done: ['review']
}

function transitionError(from: string, to: string): string {
  if (from === 'backlog') return 'Backlog tasks must move to In Progress first.'
  if (to === 'done') return 'Tasks must go through Review before Done.'
  if (from === 'done') return 'Completed tasks must reopen in Review first.'
  return `Cannot move from ${from} to ${to}.`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { toStatus, userId } = body

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const allowedTo = ALLOWED_TRANSITIONS[task.status] || []
    if (!allowedTo.includes(toStatus)) {
      return NextResponse.json(
        {
          error: transitionError(task.status, toStatus),
          allowed: allowedTo
        },
        { status: 422 }
      )
    }

    const now = new Date()
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: toStatus,
        movedAt: now,
        completedAt: toStatus === 'done' ? now : toStatus === 'review' ? null : undefined
      }
    })

    await prisma.taskEvent.create({
      data: {
        id: crypto.randomUUID(),
        taskId: task.id,
        projectId: task.projectId,
        userId: userId || task.assigneeId,
        fromStatus: task.status,
        toStatus,
        createdAt: now
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to move task' }, { status: 500 })
  }
}
