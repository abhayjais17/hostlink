import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

// DELETE /api/projects/:id/members/:userId - remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId: targetUserId } = await params
    const userId = await getCurrentUserFromCookies()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if requester is a member
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    })

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this project' }, { status: 403 })
    }

    // Count current members
    const memberCount = await prisma.projectMember.count({
      where: { projectId: id }
    })

    // Prevent removing the last member
    if (memberCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last member. Projects must have at least one member.' }, { status: 400 })
    }

    // Remove the member
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId: targetUserId } }
    })

    // Note: Tasks assigned to this user are left as-is. They remain assigned
    // to this user, but the user won't appear in future assignee dropdowns
    // for this project until they're re-added as a member.

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
