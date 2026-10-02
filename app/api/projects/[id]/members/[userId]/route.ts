import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

// PATCH /api/projects/:id/members/:userId - update member role or designation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId: targetUserId } = await params
    const currentUserId = await getCurrentUserFromCookies()

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requester is a leader
    const requesterMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: currentUserId } }
    })

    if (!requesterMembership) {
      return NextResponse.json({ error: 'You are not a member of this project' }, { status: 403 })
    }

    if (requesterMembership.role !== 'leader') {
      return NextResponse.json({ error: 'Only project leaders can update member roles' }, { status: 403 })
    }

    const body = await request.json()
    const { role, designation } = body

    // Validate role if provided
    if (role && !['leader', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Role must be "leader" or "member"' }, { status: 400 })
    }

    // Check target member exists
    const targetMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      include: { user: true }
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // If demoting from leader, check if this is the last leader
    if (role === 'member' && targetMembership.role === 'leader') {
      const leaderCount = await prisma.projectMember.count({
        where: { projectId, role: 'leader' }
      })

      if (leaderCount <= 1) {
        return NextResponse.json({
          error: 'Cannot demote the last leader. Promote another member to leader first.'
        }, { status: 400 })
      }
    }

    // Update the member
    const updateData: { role?: string; designation?: string | null } = {}
    if (role) updateData.role = role
    if (designation !== undefined) updateData.designation = designation || null

    const updatedMember = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: updateData,
      include: { user: true }
    })

    return NextResponse.json({
      id: updatedMember.id,
      userId: updatedMember.user.id,
      name: updatedMember.user.name,
      email: updatedMember.user.email,
      role: updatedMember.role,
      designation: updatedMember.designation,
      userRole: updatedMember.user.role,
      color: updatedMember.user.color
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// DELETE /api/projects/:id/members/:userId - remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId: targetUserId } = await params
    const currentUserId = await getCurrentUserFromCookies()

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requester is a leader (or removing themselves)
    const requesterMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: currentUserId } }
    })

    if (!requesterMembership) {
      return NextResponse.json({ error: 'You are not a member of this project' }, { status: 403 })
    }

    const isLeader = requesterMembership.role === 'leader'
    const isSelf = currentUserId === targetUserId

    if (!isLeader && !isSelf) {
      return NextResponse.json({ error: 'Only project leaders can remove other members' }, { status: 403 })
    }

    // Check target member exists
    const targetMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } }
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // If removing a leader, check if this is the last leader
    if (targetMembership.role === 'leader') {
      const leaderCount = await prisma.projectMember.count({
        where: { projectId, role: 'leader' }
      })

      if (leaderCount <= 1) {
        return NextResponse.json({
          error: 'Cannot remove the last leader. Promote another member to leader first.'
        }, { status: 400 })
      }
    }

    // Remove the member
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
