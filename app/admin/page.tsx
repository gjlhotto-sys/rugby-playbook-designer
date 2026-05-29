'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  school: string | null
  role: string
  created_at: string
  play_count?: number
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    beta: 0,
    subscriber: 0,
    coach: 0,
    totalPlays: 0,
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading profiles:', error)
        setLoading(false)
        return
      }

      const { data: plays } = await supabase
        .from('plays')
        .select('user_id')

      const playCounts: Record<string, number> = {}
      plays?.forEach((p) => {
        if (p.user_id) {
          playCounts[p.user_id] = (playCounts[p.user_id] ?? 0) + 1
        }
      })

      const profileRows = (profiles ?? []) as UserRow[]
      const usersWithCounts = profileRows.map((p) => ({
        ...p,
        play_count: playCounts[p.id] ?? 0,
      }))

      setUsers(usersWithCounts)

      setStats({
        total: usersWithCounts.length,
        admin: usersWithCounts.filter((p) => p.role === 'admin').length,
        beta: usersWithCounts.filter((p) => p.role === 'beta').length,
        subscriber: usersWithCounts.filter((p) => p.role === 'subscriber')
          .length,
        coach: usersWithCounts.filter((p) => p.role === 'coach').length,
        totalPlays: plays?.length ?? 0,
      })
    } catch (err) {
      console.error('loadUsers error:', err)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      const profile = await getUserProfile()
      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }
      await loadUsers()
    }
    void init()
  }, [router, loadUsers])

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role: newRole,
          adminUserId: session?.user?.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
        await loadUsers()
      } else {
        console.error('Failed to update role:', data.error)
        alert('Failed to update role. Please try again.')
      }
    } catch (error) {
      console.error('Role change error:', error)
      alert('Failed to update role. Please try again.')
    }
    setUpdatingId(null)
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.school?.toLowerCase().includes(search.toLowerCase())
  )

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-purple-600',
    beta: 'bg-green-600',
    subscriber: 'bg-blue-600',
    coach: 'bg-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏉</span>
            <div>
              <h1 className="text-lg font-bold">PlayForge Admin</h1>
              <p className="text-xs text-gray-400">User Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
          >
            ← Back to App
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          {[
            { label: 'Total Users', value: stats.total, color: 'text-white' },
            { label: 'Admin', value: stats.admin, color: 'text-purple-400' },
            { label: 'Beta', value: stats.beta, color: 'text-green-400' },
            {
              label: 'Subscribers',
              value: stats.subscriber,
              color: 'text-blue-400',
            },
            { label: 'Free', value: stats.coach, color: 'text-gray-400' },
            {
              label: 'Total Plays',
              value: stats.totalPlays,
              color: 'text-yellow-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-800 bg-gray-900 p-3"
            >
              <p className="mb-1 text-xs text-gray-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name or school..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading users...</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">School</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Plays</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-800/50 transition-colors hover:bg-gray-800/30 ${
                      i % 2 === 0 ? '' : 'bg-gray-900/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">
                          {user.full_name || '—'}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.school || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium text-white ${
                          roleBadgeColor[user.role] ?? 'bg-gray-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.play_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="cursor-pointer rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-green-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="admin">admin</option>
                        <option value="beta">beta</option>
                        <option value="subscriber">subscriber</option>
                        <option value="coach">coach</option>
                      </select>
                      {updatingId === user.id && (
                        <span className="ml-2 text-xs text-gray-400">
                          saving...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="rounded border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
          >
            ↻ Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
