import { supabase } from './supabase'

export type UserRole = 'admin' | 'beta' | 'coach' | 'subscriber'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  school?: string
  role: UserRole
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

export function hasFullAccess(role: UserRole): boolean {
  return ['admin', 'beta', 'subscriber'].includes(role)
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}
