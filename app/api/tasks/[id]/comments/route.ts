import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: params.id },
      include: { author: true },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { authorId, body: commentBody } = body

    if (!authorId || !commentBody) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        id: crypto.randomUUID(),
        taskId: params.id,
        authorId,
        body: commentBody,
        createdAt: new Date()
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
