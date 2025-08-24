import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    const posts = await prisma.post.findMany({
      where: {
        userId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profile: {
              select: {
                avatarUrl: true
              }
            }
          }
        },
        media: {
          select: {
            url: true,
            type: true
          }
        },
        likes: {
          select: {
            userId: true
          }
        }
      }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
