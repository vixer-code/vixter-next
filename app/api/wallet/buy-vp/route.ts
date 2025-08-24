import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil'
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, paymentMethod } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // VP packages with pricing
    const vpPackages = [
      { vp: 100, price: 9.99, bonus: 0 },
      { vp: 250, price: 24.99, bonus: 25 },
      { vp: 500, price: 49.99, bonus: 75 },
      { vp: 1000, price: 89.99, bonus: 200 },
      { vp: 2500, price: 199.99, bonus: 600 }
    ]

    const selectedPackage = vpPackages.find(pkg => pkg.vp === amount)
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid VP package' }, { status: 400 })
    }

    const totalVP = selectedPackage.vp + selectedPackage.bonus
    const priceInCents = Math.round(selectedPackage.price * 100)

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethod === 'pix' ? ['boleto'] : ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `${selectedPackage.vp} Vixter Points`,
              description: selectedPackage.bonus > 0 
                ? `${selectedPackage.vp} VP + ${selectedPackage.bonus} VP bônus` 
                : `${selectedPackage.vp} VP`,
              images: [`${process.env.NEXTAUTH_URL}/images/logoFlorColorida.svg`]
            },
            unit_amount: priceInCents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/wallet?success=true&vp=${totalVP}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/wallet?cancelled=true`,
      metadata: {
        userId: session.user.id,
        vpAmount: totalVP.toString(),
        packageVP: selectedPackage.vp.toString(),
        bonusVP: selectedPackage.bonus.toString()
      },
      customer_email: session.user.email || undefined,
      locale: 'pt-BR'
    })

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        receiverId: session.user.id,
        amount: totalVP,
        currency: 'VP',
        type: 'VP_PURCHASE',
        status: 'PENDING',
        description: `Compra de ${totalVP} VP (${selectedPackage.vp} + ${selectedPackage.bonus} bônus)`,
        stripeId: checkoutSession.id,
        metadata: {
          packagePrice: selectedPackage.price,
          paymentMethod
        }
      }
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })
  } catch (error) {
    console.error('Error creating VP purchase:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
