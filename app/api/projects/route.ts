import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { members: { include: { user: true } } }
    })

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasks = await prisma.task.findMany({ where: { projectId: project.id } })
        const doneTasks = tasks.filter(t => t.status === 'done').length
        const overdueCount = tasks.filter(t => {
          if (t.status === 'done') return false
          const today = new Date()
          const dueDate = new Date(t.dueDate)
          return dueDate < today
        }).length

        return {
          project,
          members: project.members.map(m => m.user),
          totalTasks: tasks.length,
          doneTasks,
          overdueCount,
          completionPct: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0,
          lastUpdated: project.updatedAt || project.createdAt
        }
      })
    )

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color, memberIds } = body

    if (!name || !memberIds?.length) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description: description || '',
        color,
        members: {
          create: memberIds.map((userId: string) => ({ userId }))
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
