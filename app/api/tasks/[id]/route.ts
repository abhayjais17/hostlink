import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

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

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description || undefined,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
        priority: priority || undefined,
        ...(status && { status }),
        movedAt: status ? new Date() : undefined,
        completedAt: status === 'done' ? new Date() : status === 'done' ? undefined : null
      }
    })

    if (status) {
      const oldTask = await prisma.task.findUnique({ where: { id } })
      await prisma.taskEvent.create({
        data: {
          id: crypto.randomUUID(),
          taskId: task.id,
          projectId: task.projectId,
          userId: assigneeId || oldTask?.assigneeId || userId,
          fromStatus: oldTask?.status,
          toStatus: status,
          createdAt: new Date()
        }
      })
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
