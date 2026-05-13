'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, school },
        },
      })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: name,
            school,
          })
        }
        setMessage('Account created! You can now log in.')
        setMode('login')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🏉</div>
          <h1 className="text-2xl font-bold text-white">PlayForge</h1>
          <p className="mt-1 text-sm text-gray-400">
            Rugby Playbook Designer
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mb-4 rounded-lg border border-green-800 bg-green-900/30 p-3 text-sm text-green-400">
              {message}
            </div>
          ) : null}

          <div className="space-y-3">
            {mode === 'signup' ? (
              <>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Coach John Smith"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    School / Club
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Leeuwenhof Akademie"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@school.co.za"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="mt-4 w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setMessage(null)
              }}
              className="text-sm text-gray-400 transition-colors hover:text-green-400"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
