import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, role, adminUserId } = await request.json()

    if (!userId || !role || !adminUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the requesting user is actually an admin
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminUserId)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const validRoles = ['admin', 'beta', 'subscriber', 'coach']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      console.error('Role update error:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    console.log(`Role updated: user ${userId} → ${role} by admin ${adminUserId}`)
    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('Admin update role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
