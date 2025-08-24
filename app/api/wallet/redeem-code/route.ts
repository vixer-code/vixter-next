import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock redeem codes for demonstration
const REDEEM_CODES = {
  'VIXT-ER20-24VP-DEMO': { type: 'VP', amount: 100, used: false },
  'WELC-OME5-0VBP-FREE': { type: 'VBP', amount: 50, used: false },
  'BETA-TEST-100V-P123': { type: 'VP', amount: 200, used: false },
  'DAIL-Y10V-BP50-GIFT': { type: 'VBP', amount: 25, used: false }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    const normalizedCode = code.replace(/\s+/g, '').toUpperCase()

    // Check if code exists and is valid
    const redeemData = REDEEM_CODES[normalizedCode as keyof typeof REDEEM_CODES]
    
    if (!redeemData) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    if (redeemData.used) {
      return NextResponse.json({ error: 'Código já foi utilizado' }, { status: 400 })
    }

    // Check if user has already used this code (in a real implementation, store this in database)
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        receiverId: session.user.id,
        type: 'REDEEM_CODE',
        description: { contains: normalizedCode }
      }
    })

    if (existingTransaction) {
      return NextResponse.json({ error: 'Você já resgatou este código' }, { status: 400 })
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

    // Update wallet based on code type
    let updateData: any = {}
    let balanceField = ''
    
    switch (redeemData.type) {
      case 'VP':
        updateData.vpBalance = { increment: redeemData.amount }
        balanceField = 'vpBalance'
        break
      case 'VC':
        updateData.vcBalance = { increment: redeemData.amount }
        balanceField = 'vcBalance'
        break
      case 'VBP':
        updateData.vbpBalance = { increment: redeemData.amount }
        balanceField = 'vbpBalance'
        break
      default:
        return NextResponse.json({ error: 'Invalid code type' }, { status: 400 })
    }

    const updatedWallet = await prisma.wallet.update({
      where: { userId: session.user.id },
      data: updateData
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        receiverId: session.user.id,
        amount: redeemData.amount,
        currency: redeemData.type,
        type: 'REDEEM_CODE',
        status: 'COMPLETED',
        description: `Código resgatado: ${normalizedCode} - ${redeemData.amount} ${redeemData.type}`
      }
    })

    // Mark code as used (in a real implementation, update database)
    redeemData.used = true

    return NextResponse.json({
      success: true,
      amount: redeemData.amount,
      currency: redeemData.type,
      newBalance: Number(updatedWallet[balanceField as keyof typeof updatedWallet]),
      message: `Código resgatado com sucesso! Você ganhou ${redeemData.amount} ${redeemData.type}!`
    })
  } catch (error) {
    console.error('Error redeeming code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
