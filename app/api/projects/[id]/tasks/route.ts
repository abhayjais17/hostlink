import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('q')
    const assigneeIds = searchParams.getAll('assignee')
    const priorities = searchParams.getAll('priority')
    const statuses = searchParams.getAll('status')

    const tasks = await prisma.task.findMany({
      where: {
        projectId: params.id,
        ...(search && { title: { contains: search, mode: 'insensitive' } }),
        ...(assigneeIds.length && { assigneeId: { in: assigneeIds } }),
        ...(priorities.length && { priority: { in: priorities } }),
        ...(statuses.length && { status: { in: statuses } })
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, assigneeId, dueDate, priority, status } = body

    if (!title || !assigneeId || !dueDate) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const projectTasks = await prisma.task.findMany({ where: { projectId: params.id } })
    const nextNumber = Math.max(...projectTasks.map(t => parseInt(t.key.split('-')[1])), 0) + 1

    const now = new Date().toISOString()
    const task = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        key: `HL-${nextNumber}`,
        projectId: params.id,
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
        projectId: params.id,
        userId: assigneeId,
        fromStatus: null,
        toStatus: status || 'backlog',
        createdAt: now
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
