import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/lemonsqueezy'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, userEmail } = await request.json()

    if (!plan || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const isLive =
      process.env.NODE_ENV === 'production' &&
      process.env.LEMONSQUEEZY_LIVE_MODE === 'true'

    const apiKey = isLive
      ? process.env.LEMONSQUEEZY_API_KEY_LIVE!
      : process.env.LEMONSQUEEZY_API_KEY!

    const storeId = isLive
      ? (process.env.LEMONSQUEEZY_STORE_ID_LIVE ??
          process.env.LEMONSQUEEZY_STORE_ID)!
      : process.env.LEMONSQUEEZY_STORE_ID!

    const variantId =
      plan === 'yearly'
        ? isLive
          ? process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID_LIVE!
          : process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID!
        : isLive
          ? process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID_LIVE!
          : process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID!

    const checkout = await createCheckoutSession({
      variantId,
      storeId,
      apiKey,
      userEmail,
      userId,
      plan,
    })

    if (checkout.error) {
      console.error('Checkout error:', checkout.error)
      return NextResponse.json(
        { error: 'Failed to create checkout' },
        { status: 500 }
      )
    }

    const checkoutUrl = checkout.data?.data?.attributes?.url

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'No checkout URL returned' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
