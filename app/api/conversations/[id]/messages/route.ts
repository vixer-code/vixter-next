import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'SERVICE_NOTIFICATION']).default('TEXT'),
  mediaId: z.string().optional(),
  replyToId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a member of the conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')

    const messages = await prisma.message.findMany({
      where: {
        conversationId: params.id,
        ...(cursor && {
          createdAt: {
            lt: new Date(cursor),
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        media: true,
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: params.id,
        senderId: {
          not: session.user.id,
        },
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
        readBy: session.user.id,
      },
    })

    return NextResponse.json(messages.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a member of the conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, type, mediaId, replyToId } = sendMessageSchema.parse(body)

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: session.user.id,
        content,
        type,
        mediaId,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        media: true,
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    })

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        lastMessageId: message.id,
        lastMessageTime: message.createdAt,
      },
    })

    // TODO: Send real-time notification via Centrifugo
    // This will be implemented in the Centrifugo integration

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
