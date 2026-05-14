import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_KEY!

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  school: string | null
  role: string | null
  created_at: string | null
}

type AdminUserRow = {
  id: string
  email: string
  full_name: string | null
  school: string | null
  role: string
  created_at: string
  play_count: number
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing SUPABASE_SERVICE_KEY' },
        { status: 503 }
      )
    }

    const anon = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const {
      data: { user },
      error: userError,
    } = await anon.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile, error: profileError } = await anon
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const authUsers: User[] = []
    let page = 1
    const perPage = 200
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      })
      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      authUsers.push(...data.users)
      if (data.users.length < perPage) break
      page += 1
    }

    const { data: profilesRaw } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const profiles = (profilesRaw ?? []) as ProfileRow[]
    const profileById = new Map(profiles.map((p) => [p.id, p]))

    const { data: playsRaw } = await admin.from('plays').select('user_id')
    const plays = (playsRaw ?? []) as { user_id: string | null }[]

    const playCounts: Record<string, number> = {}
    for (const p of plays) {
      if (p.user_id) {
        playCounts[p.user_id] = (playCounts[p.user_id] ?? 0) + 1
      }
    }

    const meta = (u: User) =>
      (u.user_metadata ?? {}) as Record<string, unknown>

    const merged: AdminUserRow[] = authUsers.map((authUser) => {
      const p = profileById.get(authUser.id)
      const m = meta(authUser)
      const metaName =
        typeof m.full_name === 'string' ? m.full_name : null
      const metaSchool =
        typeof m.school === 'string' ? m.school : null

      return {
        id: authUser.id,
        email: (p?.email ?? authUser.email ?? '').trim(),
        full_name: p?.full_name ?? metaName,
        school: p?.school ?? metaSchool,
        role: p?.role ?? 'coach',
        created_at:
          p?.created_at ?? authUser.created_at ?? new Date(0).toISOString(),
        play_count: playCounts[authUser.id] ?? 0,
      }
    })

    merged.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const totalPlays = plays.length

    return NextResponse.json({ users: merged, totalPlays })
  } catch (e) {
    console.error('Admin users GET error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
