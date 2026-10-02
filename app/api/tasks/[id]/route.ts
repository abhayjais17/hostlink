import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'
import { sendTelegramNotification } from '@/lib/telegram'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id },
      include: { comments: true, events: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, assigneeId, dueDate, priority, status } = body

    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current task state BEFORE update
    const oldTask = await prisma.task.findUnique({ where: { id } })
    if (!oldTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // If status is being changed, validate transition
    if (status && status !== oldTask.status) {
      const allowedTo = ALLOWED_TRANSITIONS[oldTask.status] || []
      if (!allowedTo.includes(status)) {
        return NextResponse.json(
          {
            error: transitionError(oldTask.status, status),
            allowed: allowedTo
          },
          { status: 422 }
        )
      }
    }

    const now = new Date()
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description || undefined,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
        priority: priority || undefined,
        ...(status && { status }),
        movedAt: status ? now : undefined,
        // Only update completedAt if status is changing
        completedAt: status
          ? (status === 'done' ? now : null)
          : undefined
      }
    })

    if (status && status !== oldTask.status) {
      await prisma.taskEvent.create({
        data: {
          id: crypto.randomUUID(),
          taskId: task.id,
          projectId: task.projectId,
          userId: assigneeId || oldTask.assigneeId || userId,
          fromStatus: oldTask.status,
          toStatus: status,
          createdAt: now
        }
      })
    }

    // Send Telegram notification if assignee was changed
    if (assigneeId && assigneeId !== oldTask.assigneeId) {
      try {
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { telegramChatId: true }
        })

        if (assignee?.telegramChatId) {
          const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: { name: true }
          })

          if (project) {
            await sendTelegramNotification(
              assignee.telegramChatId,
              task.title,
              project.name,
              task.priority,
              task.dueDate
            )
          }
        }
      } catch (error) {
        // Log but don't fail the update if notification fails
        console.error('[tasks] Failed to send Telegram notification:', error)
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({}, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
