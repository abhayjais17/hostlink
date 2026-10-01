import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const summary = request.nextUrl.searchParams.get('summary')

    // Fetch all data in one pass
    const projects = await prisma.project.findMany({
      include: { members: { include: { user: true } } }
    })

    const allTasks = await prisma.task.findMany()

    const users = await prisma.user.findMany()

    // Normalize projects with memberIds
    const normalizedProjects = projects.map(project => ({
      ...project,
      description: project.description || '',
      memberIds: project.members.map(m => m.userId)
    }))

    // If summary mode, compute analytics
    if (summary === 'true') {
      const summaries = normalizedProjects.map(project => {
        const projectTasks = allTasks.filter(t => t.projectId === project.id)
        const doneTasks = projectTasks.filter(t => t.status === 'done').length
        const today = new Date()
        const overdueCount = projectTasks.filter(t => {
          if (t.status === 'done') return false
          const dueDate = new Date(t.dueDate)
          return dueDate < today
        }).length

        return {
          project,
          members: project.members.map(m => m.user),
          totalTasks: projectTasks.length,
          doneTasks,
          overdueCount,
          completionPct: projectTasks.length ? Math.round((doneTasks / projectTasks.length) * 100) : 0,
          lastUpdated: project.updatedAt || project.createdAt
        }
      })
      return NextResponse.json(summaries)
    }

    // Non-summary mode: return normalized projects
    return NextResponse.json(normalizedProjects)
  } catch (error) {
    console.error(error)
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
      },
      include: { members: { include: { user: true } } }
    })

    return NextResponse.json({
      ...project,
      description: project.description || '',
      memberIds: project.members.map(m => m.userId)
    }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
