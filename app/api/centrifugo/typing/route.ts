import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { centrifugo, getChannels, RealtimeEventType } from '@/lib/centrifugo'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const typingSchema = z.object({
  conversationId: z.string(),
  isTyping: z.boolean(),
})

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
    const { conversationId, isTyping } = typingSchema.parse(body)

    // Verify user is a member of the conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Send typing indicator to conversation typing channel
    const typingChannel = getChannels.typing(conversationId)
    const event = {
      type: isTyping ? RealtimeEventType.TYPING_START : RealtimeEventType.TYPING_STOP,
      data: {
        userId: session.user.id,
        userName: session.user.name,
        conversationId,
      },
      timestamp: Date.now(),
      userId: session.user.id,
    }

    await centrifugo.publish(typingChannel, event)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending typing indicator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
