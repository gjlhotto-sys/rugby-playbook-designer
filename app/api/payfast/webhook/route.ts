import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, serviceKey)

    const body = await req.text()
    const params = new URLSearchParams(body)
    const data = Object.fromEntries(params.entries())

    if (data.payment_status !== 'COMPLETE') {
      return NextResponse.json({ received: true })
    }

    const userId = data.m_payment_id

    if (userId) {
      await supabase
        .from('profiles')
        .update({
          role: 'subscriber',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('PayFast webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}
