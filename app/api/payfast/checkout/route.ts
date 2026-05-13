import { NextRequest, NextResponse } from 'next/server'
import { generatePayFastForm } from '@/lib/payfast'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string
      name?: string
      userId?: string
    }
    const { email, name, userId } = body

    if (!email?.trim() || !userId?.trim()) {
      return NextResponse.json(
        { error: 'Missing email or userId' },
        { status: 400 }
      )
    }

    const { url, data } = generatePayFastForm(
      email.trim(),
      (name ?? email).trim(),
      userId.trim()
    )

    return NextResponse.json({ url, data })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      { error: 'Failed to generate checkout' },
      { status: 500 }
    )
  }
}
