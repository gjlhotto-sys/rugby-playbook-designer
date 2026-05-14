'use client'

import { useState, useEffect } from 'react'
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
  const [animStep, setAnimStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 8)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, school } },
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
        setMessage('Account created! You can now sign in.')
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

  const players = [
    { id: 'p1', x: 45, y: 65, team: 'attack', label: '9' },
    { id: 'p2', x: 55, y: 58, team: 'attack', label: '10' },
    { id: 'p3', x: 65, y: 52, team: 'attack', label: '12' },
    { id: 'p4', x: 75, y: 46, team: 'attack', label: '13' },
    { id: 'p5', x: 88, y: 42, team: 'attack', label: '14' },
    { id: 'd1', x: 58, y: 45, team: 'defence', label: '10' },
    { id: 'd2', x: 68, y: 40, team: 'defence', label: '12' },
    { id: 'd3', x: 78, y: 36, team: 'defence', label: '13' },
  ]

  const arrows = [
    { from: { x: 45, y: 65 }, to: { x: 55, y: 58 }, type: 'pass' as const, show: animStep >= 1 },
    { from: { x: 48, y: 62 }, to: { x: 38, y: 55 }, type: 'run' as const, show: animStep >= 2 },
    { from: { x: 55, y: 58 }, to: { x: 65, y: 52 }, type: 'pass' as const, show: animStep >= 3 },
    { from: { x: 60, y: 55 }, to: { x: 60, y: 45 }, type: 'decoy' as const, show: animStep >= 4 },
    { from: { x: 65, y: 52 }, to: { x: 75, y: 46 }, type: 'pass' as const, show: animStep >= 5 },
    { from: { x: 75, y: 46 }, to: { x: 88, y: 42 }, type: 'run' as const, show: animStep >= 6 },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
      <div
        className="relative hidden flex-1 flex-col overflow-hidden lg:flex"
        style={{
          background:
            'linear-gradient(135deg, #0a1f0a 0%, #0d2b0d 50%, #071507 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 px-12 pt-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-xl">
              🏉
            </div>
            <div>
              <span className="text-xl font-black tracking-wide text-white">
                PLAY FORGE
              </span>
              <p className="text-[10px] uppercase tracking-widest text-orange-400">
                Since 2026
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-12 pt-8">
          <h1 className="mb-3 text-4xl font-black leading-tight text-white">
            Forge and
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              {' '}
              Dominate
            </span>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-gray-400">
            Design plays, animate them in sequence, and share instantly with
            your team via WhatsApp.
          </p>
        </div>

        <div className="relative z-10 flex-1 px-12 py-6">
          <div
            className="relative h-full max-h-72 w-full overflow-hidden rounded-2xl border border-green-900/50 shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #14532d 0%, #166534 100%)',
            }}
          >
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 80">
              <line x1="10" y1="5" x2="90" y2="5" stroke="white" strokeWidth="0.5" opacity="0.4" />
              <line x1="10" y1="75" x2="90" y2="75" stroke="white" strokeWidth="0.5" opacity="0.4" />
              <line x1="10" y1="5" x2="10" y2="75" stroke="white" strokeWidth="0.5" opacity="0.4" />
              <line x1="90" y1="5" x2="90" y2="75" stroke="white" strokeWidth="0.5" opacity="0.4" />
              <line x1="10" y1="40" x2="90" y2="40" stroke="white" strokeWidth="0.4" opacity="0.3" />
              <line x1="10" y1="25" x2="90" y2="25" stroke="white" strokeWidth="0.3" strokeDasharray="2,2" opacity="0.25" />
              <line x1="10" y1="55" x2="90" y2="55" stroke="white" strokeWidth="0.3" strokeDasharray="2,2" opacity="0.25" />
              <circle cx="50" cy="40" r="4" fill="none" stroke="white" strokeWidth="0.3" opacity="0.2" />

              <defs>
                <marker id="arrowOrange" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#EAB308" />
                </marker>
                <marker id="arrowBlue" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#60a5fa" />
                </marker>
                <marker id="arrowGray" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#9ca3af" opacity="0.6" />
                </marker>
              </defs>

              {arrows.map((arrow, i) =>
                arrow.show ? (
                  <line
                    key={`arrow-${i}`}
                    x1={arrow.from.x}
                    y1={arrow.from.y}
                    x2={arrow.to.x}
                    y2={arrow.to.y}
                    stroke={
                      arrow.type === 'pass'
                        ? '#EAB308'
                        : arrow.type === 'decoy'
                          ? '#9ca3af'
                          : '#60a5fa'
                    }
                    strokeWidth="0.8"
                    strokeDasharray={
                      arrow.type === 'pass' ? '1.5,0.8' : arrow.type === 'decoy' ? '1,0.8' : 'none'
                    }
                    markerEnd={`url(#arrow${arrow.type === 'pass' ? 'Orange' : arrow.type === 'decoy' ? 'Gray' : 'Blue'})`}
                    opacity="0.9"
                    style={{ animation: 'loginFadeIn 0.3s ease-in' }}
                  />
                ) : null
              )}

              {players
                .filter((p) => p.team === 'defence')
                .map((p) => (
                  <g key={p.id}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#ef4444" opacity="0.9" />
                    <text
                      x={p.x}
                      y={p.y + 0.8}
                      fontSize="2.5"
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="bold"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}

              {players
                .filter((p) => p.team === 'attack')
                .map((p) => (
                  <g key={p.id}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#3b82f6" opacity="0.9" />
                    <text
                      x={p.x}
                      y={p.y + 0.8}
                      fontSize="2.5"
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="bold"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}

              <circle
                cx={animStep < 3 ? 45 : animStep < 5 ? 55 : animStep < 6 ? 65 : 75}
                cy={animStep < 3 ? 65 : animStep < 5 ? 58 : animStep < 6 ? 52 : 46}
                r="4.5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.5"
                opacity="0.6"
                style={{ animation: 'loginPulse 1s ease-in-out infinite' }}
              />
            </svg>

            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              <span className="text-[10px] font-medium text-green-400">Live Preview</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🎨', text: 'Design Plays' },
              { icon: '▶️', text: 'Animate' },
              { icon: '📲', text: 'Share via WhatsApp' },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <span className="text-base">{f.icon}</span>
                <span className="text-xs font-medium text-gray-300">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-12 pb-10">
          <div className="border-l-2 border-orange-500 pl-4">
            <p className="text-sm italic leading-relaxed text-gray-300">
              &ldquo;PlayForge has elevated our game and player understanding
              significantly&rdquo;
            </p>
            <p className="mt-1 text-xs font-medium text-orange-400">
              — Coach, Leeuwenhof Akademie
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-shrink-0 flex-col items-center justify-center bg-gray-950 px-8 py-12 lg:w-[420px]">
        <div className="mb-8 text-center lg:hidden">
          <div className="mb-2 text-4xl">🏉</div>
          <h1 className="text-2xl font-black text-white">PLAY FORGE</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-orange-400">
            Forge and Dominate
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h2 className="mb-1 text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-sm text-gray-400">
              {mode === 'login'
                ? 'Sign in to your PlayForge account'
                : 'Create your free coaching account'}
            </p>
          </div>

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
                  <label className="mb-1 block text-xs text-gray-400">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Coach John Smith"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white transition-colors focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">School / Club</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Your School or Club"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white transition-colors focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="mb-1 block text-xs text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@school.co.za"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white transition-colors focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white transition-colors focus:border-orange-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleSubmit()
                  }
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || !email || !password}
            className="mt-5 w-full rounded-lg py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In →'
                : 'Create Account →'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setMessage(null)
              }}
              className="text-sm text-gray-500 transition-colors hover:text-orange-400"
            >
              {mode === 'login'
                ? 'New to PlayForge? Create free account'
                : 'Already have an account? Sign in'}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-600">
            © 2026 PlayForge · Rugby Playbook Designer
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loginFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes loginPulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
