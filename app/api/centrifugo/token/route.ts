import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { centrifugo } from '@/lib/centrifugo'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate Centrifugo token for the user
    const token = centrifugo.generateToken(session.user.id)

    return NextResponse.json({
      token,
      user: {
        id: session.user.id,
        name: session.user.name,
        username: session.user.username,
      },
    })
  } catch (error) {
    console.error('Error generating Centrifugo token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
