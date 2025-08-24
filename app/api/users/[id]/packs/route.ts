import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    const packs = await prisma.pack.findMany({
      where: {
        userId,
        isActive: true
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
        }
      }
    })

    const formattedPacks = packs.map(pack => ({
      ...pack,
      price: Number(pack.price)
    }))

    return NextResponse.json(formattedPacks)
  } catch (error) {
    console.error('Error fetching user packs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
