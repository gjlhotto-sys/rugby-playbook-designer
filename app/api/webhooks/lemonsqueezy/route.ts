import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Webhook URL to add in Lemon Squeezy after deploying:
// https://playforge.co.za/api/webhooks/lemonsqueezy
// Events: subscription_created, subscription_cancelled,
// subscription_resumed, subscription_expired,
// subscription_payment_failed, subscription_paused,
// subscription_unpaused

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-signature') ?? ''
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

    if (!verifySignature(rawBody, signature, secret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta?.event_name
    const customData = payload.meta?.custom_data
    const attributes = payload.data?.attributes
    const userId = customData?.user_id

    console.log('Webhook event:', eventName)
    console.log('User ID:', userId)

    if (!userId) {
      console.error('No user_id in webhook')
      return NextResponse.json(
        { error: 'No user_id' },
        { status: 400 }
      )
    }

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_resumed':
      case 'subscription_unpaused': {
        const subscriptionId = payload.data?.id
        const customerId = attributes?.customer_id
        const renewsAt = attributes?.renews_at
        const endsAt = attributes?.ends_at

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'subscriber',
            subscription_status: 'active',
            subscription_id: subscriptionId?.toString(),
            lemon_squeezy_customer_id: customerId?.toString(),
            subscription_ends_at: endsAt ?? renewsAt ?? null,
            subscription_plan: customData?.plan ?? 'monthly',
          })
          .eq('id', userId)

        if (error) {
          console.error('Supabase update error:', error)
          return NextResponse.json(
            { error: 'Database update failed' },
            { status: 500 }
          )
        }

        console.log(`User ${userId} → subscriber`)
        break
      }

      case 'subscription_cancelled': {
        const endsAt = attributes?.ends_at

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_ends_at: endsAt ?? null,
          })
          .eq('id', userId)

        console.log(
          `User ${userId} cancelled, access until ${endsAt}`
        )
        break
      }

      case 'subscription_expired': {
        await supabaseAdmin
          .from('profiles')
          .update({
            role: 'coach',
            subscription_status: 'expired',
            subscription_id: null,
            subscription_ends_at: null,
          })
          .eq('id', userId)

        console.log(`User ${userId} → coach (expired)`)
        break
      }

      case 'subscription_payment_failed': {
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'payment_failed',
          })
          .eq('id', userId)

        console.log(`User ${userId} payment failed`)
        break
      }

      case 'subscription_paused': {
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'paused',
          })
          .eq('id', userId)

        console.log(`User ${userId} paused`)
        break
      }

      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
