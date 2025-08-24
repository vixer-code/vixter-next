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

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          vpBalance: 0,
          vcBalance: 0,
          vbpBalance: 0,
          vcPendingBalance: 0
        }
      })
    }

    return NextResponse.json({
      vpBalance: Number(wallet.vpBalance),
      vcBalance: Number(wallet.vcBalance),
      vbpBalance: Number(wallet.vbpBalance),
      vcPendingBalance: Number(wallet.vcPendingBalance)
    })
  } catch (error) {
    console.error('Error fetching wallet:', error)
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
    const { action, amount, currency, description } = body

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          vpBalance: 0,
          vcBalance: 0,
          vbpBalance: 0,
          vcPendingBalance: 0
        }
      })
    }

    // Update wallet based on action
    let updateData: any = {}
    
    switch (action) {
      case 'add_vp':
        updateData.vpBalance = { increment: amount }
        break
      case 'add_vc':
        updateData.vcBalance = { increment: amount }
        break
      case 'add_vbp':
        updateData.vbpBalance = { increment: amount }
        break
      case 'subtract_vp':
        updateData.vpBalance = { decrement: amount }
        break
      case 'subtract_vc':
        updateData.vcBalance = { decrement: amount }
        break
      case 'subtract_vbp':
        updateData.vbpBalance = { decrement: amount }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedWallet = await prisma.wallet.update({
      where: { userId: session.user.id },
      data: updateData
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        receiverId: session.user.id,
        amount,
        currency: currency || 'VP',
        type: action.includes('add') ? 'DEPOSIT' : 'WITHDRAWAL',
        status: 'COMPLETED',
        description: description || `${action} - ${amount} ${currency || 'VP'}`
      }
    })

    return NextResponse.json({
      vpBalance: Number(updatedWallet.vpBalance),
      vcBalance: Number(updatedWallet.vcBalance),
      vbpBalance: Number(updatedWallet.vbpBalance),
      vcPendingBalance: Number(updatedWallet.vcPendingBalance)
    })
  } catch (error) {
    console.error('Error updating wallet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
