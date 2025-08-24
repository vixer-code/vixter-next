import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    const services = await prisma.service.findMany({
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

    const formattedServices = services.map(service => ({
      ...service,
      price: Number(service.price)
    }))

    return NextResponse.json(formattedServices)
  } catch (error) {
    console.error('Error fetching user services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
