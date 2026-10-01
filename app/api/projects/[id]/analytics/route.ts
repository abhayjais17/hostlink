import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { endOfDay, subDays, startOfDay, format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tasks = await prisma.task.findMany({
      where: { projectId: id }
    })

    const events = await prisma.taskEvent.findMany({
      where: { projectId: id }
    })

    const users = await prisma.user.findMany()
    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: true }
    })

    // Compute burndown
    const today = new Date()
    const burndown = []
    for (let i = 0; i < 10; i++) {
      const date = subDays(startOfDay(today), 9 - i)
      const cutoff = endOfDay(date).getTime()

      const existing = tasks.filter(t => new Date(t.createdAt).getTime() <= cutoff)
      const states = new Map<string, string>()
      for (const event of events) {
        if (new Date(event.createdAt).getTime() > cutoff) break
        states.set(event.taskId, event.toStatus)
      }

      const done = existing.filter(t => states.get(t.id) === 'done').length
      burndown.push({
        date: format(date, 'yyyy-MM-dd'),
        total: existing.length,
        done,
        remaining: existing.length - done
      })
    }

    // Compute workload
    const workload = members.map(member => {
      const open = tasks.filter(t => t.assigneeId === member.userId && t.status !== 'done')
      return {
        userId: member.userId,
        name: member.user.name,
        color: member.user.color,
        backlog: open.filter(t => t.status === 'backlog').length,
        in_progress: open.filter(t => t.status === 'in_progress').length,
        review: open.filter(t => t.status === 'review').length,
        total: open.length
      }
    })

    const counts = {
      backlog: tasks.filter(t => t.status === 'backlog').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length
    }

    const overdueTasks = tasks.filter(t => {
      if (t.status === 'done') return false
      const dueDate = new Date(t.dueDate)
      return dueDate < today
    })

    return NextResponse.json({
      completionPct: tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0,
      total: tasks.length,
      counts,
      burndown,
      workload,
      overdueCount: overdueTasks.length,
      overdueTasks
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
