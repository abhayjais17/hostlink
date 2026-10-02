import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const summary = request.nextUrl.searchParams.get('summary')

    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's project memberships
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    })
    const projectIds = memberships.map(m => m.projectId)

    // Fetch only the projects the user is a member of
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
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
    // Get current authenticated user
    const userId = await getCurrentUserFromCookies()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color, memberIds = [] } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Always include the creator as a member with role "leader"
    const allMemberIds = [...new Set([userId, ...memberIds])]

    const project = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description: description || '',
        color: color || 'teal',
        members: {
          create: allMemberIds.map((mid: string) => ({
            userId: mid,
            role: mid === userId ? 'leader' : 'member'
          }))
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
