import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

// GET /api/projects/:id/members - list current members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserFromCookies()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: { include: { user: true } } }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if requester is a member
    const isMember = project.members.some(m => m.userId === userId)
    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this project' }, { status: 403 })
    }

    // Return members sorted by join time (oldest first)
    const members = project.members.map(m => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      designation: m.designation,
      userRole: m.user.role,
      color: m.user.color,
      joinedAt: m.id // Using member id as proxy for join order
    })).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))

    return NextResponse.json(members)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// POST /api/projects/:id/members - add a member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserFromCookies()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id }
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

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already a member
    const existingMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: targetUserId } }
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }

    // Add the member (default role is "member")
    const newMembership = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: targetUserId,
        role: 'member'
      },
      include: { user: true }
    })

    return NextResponse.json({
      id: newMembership.id,
      userId: newMembership.user.id,
      name: newMembership.user.name,
      email: newMembership.user.email,
      role: newMembership.role,
      designation: newMembership.designation,
      userRole: newMembership.user.role,
      color: newMembership.user.color
    }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
