import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.comment.delete({ where: { id: params.id } })
    return NextResponse.json({}, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
