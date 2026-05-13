'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PaymentSuccess() {
  const router = useRouter()

  useEffect(() => {
    void supabase.auth.refreshSession()
    const t = setTimeout(() => router.push('/'), 3000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-2 text-2xl font-bold text-white">
          Welcome to PlayForge Pro!
        </h1>
        <p className="mb-4 text-gray-400">
          Your subscription is now active. Redirecting you back...
        </p>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    </div>
  )
}
