import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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

    // Check if user can claim daily bonus
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (wallet.lastDailyBonus) {
      const lastBonus = new Date(wallet.lastDailyBonus)
      const lastBonusDate = new Date(lastBonus.getFullYear(), lastBonus.getMonth(), lastBonus.getDate())
      
      if (lastBonusDate.getTime() === today.getTime()) {
        return NextResponse.json({ error: 'Daily bonus already claimed today' }, { status: 400 })
      }
    }

    const bonusAmount = 10 // 10 VBP daily bonus

    // Update wallet
    const updatedWallet = await prisma.wallet.update({
      where: { userId: session.user.id },
      data: {
        vbpBalance: { increment: bonusAmount },
        lastDailyBonus: now
      }
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        receiverId: session.user.id,
        amount: bonusAmount,
        currency: 'VBP',
        type: 'DAILY_BONUS',
        status: 'COMPLETED',
        description: 'Bônus diário de login'
      }
    })

    return NextResponse.json({
      success: true,
      bonusAmount,
      newBalance: Number(updatedWallet.vbpBalance),
      message: `Você ganhou ${bonusAmount} VBP!`
    })
  } catch (error) {
    console.error('Error claiming daily bonus:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
