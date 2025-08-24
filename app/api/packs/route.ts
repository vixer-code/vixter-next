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

    const packs = await prisma.pack.findMany({
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

    const formattedPacks = packs.map(pack => ({
      ...pack,
      price: Number(pack.price)
    }))

    return NextResponse.json(formattedPacks)
  } catch (error) {
    console.error('Error fetching packs:', error)
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
      subcategory,
      packType,
      description,
      price,
      discount,
      features,
      tags,
      licenseOptions
    } = body

    // Validate required fields
    if (!title || !category || !packType || !description || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (parseFloat(price) < 5) {
      return NextResponse.json({ error: 'Price must be at least 5 VC' }, { status: 400 })
    }

    const pack = await prisma.pack.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        category,
        subcategory: subcategory || '',
        packType,
        description: description.trim(),
        price: parseFloat(price),
        discount: parseInt(discount || '0', 10) || 0,
        features: features || [],
        tags: tags || [],
        licenseOptions: packType === 'nao-download' ? (licenseOptions || []) : [],
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
      packId: pack.id,
      pack: {
        ...pack,
        price: Number(pack.price)
      }
    })
  } catch (error) {
    console.error('Error creating pack:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
