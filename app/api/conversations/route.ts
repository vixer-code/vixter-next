import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1),
  name: z.string().optional(),
  type: z.enum(['DIRECT', 'GROUP', 'SERVICE']).default('DIRECT'),
  serviceOrderId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'service' or 'regular'

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
        ...(type === 'service' && {
          type: 'SERVICE',
        }),
        ...(type === 'regular' && {
          type: { in: ['DIRECT', 'GROUP'] },
        }),
      },
      include: {
        members: {
          include: {
            user: {
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
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
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
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: {
                  not: session.user.id,
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageTime: 'desc',
      },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { participantIds, name, type, serviceOrderId } = createConversationSchema.parse(body)

    // Add current user to participants if not already included
    const allParticipants = Array.from(new Set([...participantIds, session.user.id]))

    // For direct conversations, check if one already exists
    if (type === 'DIRECT' && allParticipants.length === 2) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          members: {
            every: {
              userId: {
                in: allParticipants,
              },
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
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
            },
          },
        },
      })

      if (existingConversation && existingConversation.members.length === 2) {
        return NextResponse.json(existingConversation)
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        name,
        type,
        serviceOrderId,
        members: {
          create: allParticipants.map((userId) => ({
            userId,
            isAdmin: userId === session.user.id,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
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
          },
        },
      },
    })

    return NextResponse.json(conversation)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
