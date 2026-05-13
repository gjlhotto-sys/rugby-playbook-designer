'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PlaybookDesigner } from '@/components/playbook-designer'
import type { User } from '@supabase/supabase-js'
import { getUserProfile } from '@/lib/auth'
import type { UserProfile } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      if (!session) {
        router.push('/login')
        setLoading(false)
      } else {
        setUser(session.user)
        const userProfile = await getUserProfile()
        if (!cancelled) {
          setProfile(userProfile)
          setLoading(false)
        }
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.push('/login')
        setUser(null)
        setProfile(null)
        setLoading(false)
      } else {
        setUser(session.user)
        const userProfile = await getUserProfile()
        setProfile(userProfile)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mb-2 animate-bounce text-4xl">🏉</div>
          <p className="text-sm text-gray-400">Loading PlayForge...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <PlaybookDesigner user={user} profile={profile} />
}
