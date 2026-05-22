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
  const [loadingTooLong, setLoadingTooLong] = useState(false)

  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoadingTooLong(true), 6000)
    return () => clearTimeout(t)
  }, [loading])

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      window.history.replaceState({}, '', '/')
      window.alert(
        '🏉 Welcome to PlayForge Pro! Your subscription is now active. Enjoy unlimited plays!'
      )
      getUserProfile().then((updatedProfile) => {
        if (updatedProfile) setProfile(updatedProfile)
      })
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">🏉</div>
          <p className="text-sm text-gray-400">Loading PlayForge...</p>
          {loadingTooLong && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-gray-500">Taking too long?</p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-xs text-green-400 hover:text-green-300 underline"
              >
                Click here to sign in again
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) return null

  return <PlaybookDesigner user={user} profile={profile} />
}
