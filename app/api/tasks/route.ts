import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, title, description, assigneeId, dueDate, priority, status } = body

    if (!projectId || !title || !assigneeId || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields: projectId, title, assigneeId, dueDate' }, { status: 400 })
    }

    // Get globally unique key by counting all existing tasks
    const allTasks = await prisma.task.findMany({ select: { key: true } })
    const maxNum = Math.max(...allTasks.map(t => {
      const num = parseInt(t.key.split('-')[1])
      return isNaN(num) ? 0 : num
    }), 0)
    const nextNumber = maxNum + 1

    const now = new Date().toISOString()
    const task = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        key: `HL-${nextNumber}`,
        projectId,
        title,
        description: description || '',
        assigneeId,
        dueDate,
        priority: priority || 'normal',
        status: status || 'backlog',
        createdAt: now,
        movedAt: now,
        completedAt: status === 'done' ? now : null
      }
    })

    // Create initial task event
    await prisma.taskEvent.create({
      data: {
        id: crypto.randomUUID(),
        taskId: task.id,
        projectId,
        userId: assigneeId,
        fromStatus: null,
        toStatus: status || 'backlog',
        createdAt: now
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}