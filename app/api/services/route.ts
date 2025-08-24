import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {
      isActive: true
    }

    if (userId) {
      whereClause.userId = userId
    }

    if (category && category !== 'all') {
      whereClause.category = category
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
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
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      category,
      description,
      price,
      features,
      complementaryOptions,
      tags,
      deliveryTime
    } = body

    // Validate required fields
    if (!title || !category || !description || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (parseFloat(price) < 10) {
      return NextResponse.json({ error: 'Price must be at least 10 VC' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        category,
        description: description.trim(),
        price: parseFloat(price),
        features: features || [],
        complementaryOptions: complementaryOptions || [],
        tags: tags || [],
        deliveryTime: deliveryTime || 24,
        isActive: true,
        isAdult: false
      },
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

    return NextResponse.json({
      success: true,
      serviceId: service.id,
      service: {
        ...service,
        price: Number(service.price)
      }
    })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
