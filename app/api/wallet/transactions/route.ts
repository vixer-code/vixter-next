import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const currency = searchParams.get('currency')
    const type = searchParams.get('type')

    let whereClause: any = {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id }
      ]
    }

    if (currency && currency !== 'all') {
      whereClause.currency = currency
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
      sender: transaction.sender,
      receiver: transaction.receiver,
      isIncoming: transaction.receiverId === session.user.id
    }))

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
