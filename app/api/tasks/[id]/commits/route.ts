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

    // Get the task to check project membership
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user is a member of the project
    if (task.project.members.length === 0) {
      // Also check if user is the assignee (they should be able to see commits)
      if (task.assigneeId !== userId) {
        return NextResponse.json(
          { error: 'Access denied - not a project member' },
          { status: 403 }
        )
      }
    }

    // Get commits for this task, ordered by committedAt ascending
    const commits = await prisma.commitLink.findMany({
      where: { taskId: id },
      include: {
        authorUser: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        committedAt: 'asc'
      }
    })

    // Return sanitized response
    const response = commits.map(commit => ({
      id: commit.id,
      taskId: commit.taskId,
      commitSha: commit.commitSha,
      commitMessage: commit.commitMessage,
      authorName: commit.authorName,
      authorEmail: commit.authorEmail,
      githubUsername: commit.githubUsername,
      branch: commit.branch,
      commitUrl: commit.commitUrl,
      committedAt: commit.committedAt,
      createdAt: commit.createdAt,
      authorUser: commit.authorUser ? {
        id: commit.authorUser.id,
        name: commit.authorUser.name,
        color: commit.authorUser.color
      } : null
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('[commits] Error fetching commits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commits' },
      { status: 500 }
    )
  }
}
