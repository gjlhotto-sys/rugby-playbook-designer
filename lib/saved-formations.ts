import { supabase } from './supabase'
import type { FieldPlayer } from './types'
import type { FormationId } from './play-metadata'
import { FORMATION_LABELS, parseFormationId } from './play-metadata'
import { clonePlayersForNextPhase } from './phase-snapshots'

export interface SavedFormation {
  id: string
  name: string
  baseFormation: FormationId
  players: FieldPlayer[]
  createdAt: string
}

function rowToSavedFormation(row: Record<string, unknown>): SavedFormation | null {
  const id = typeof row.id === 'string' ? row.id : null
  if (!id) return null
  const name = typeof row.name === 'string' ? row.name : 'Untitled'
  const baseFormation = parseFormationId(row.base_formation) ?? 'free-play'
  return {
    id,
    name,
    baseFormation,
    players: (row.players as FieldPlayer[]) ?? [],
    createdAt:
      typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  }
}

export function formatFormationOptionLabel(formation: SavedFormation): string {
  return `${formation.name} (${FORMATION_LABELS[formation.baseFormation]})`
}

export async function loadFormationsForUser(): Promise<SavedFormation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Failed to load formations:', error)
    return []
  }

  return (data as Record<string, unknown>[])
    .map((row) => rowToSavedFormation(row))
    .filter((f): f is SavedFormation => f != null)
}

export async function saveFormationToCloud(
  name: string,
  baseFormation: FormationId,
  players: FieldPlayer[]
): Promise<SavedFormation | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('formations')
      .insert({
        name: name.trim(),
        base_formation: baseFormation,
        players,
        user_id: user.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return rowToSavedFormation(data as Record<string, unknown>)
  } catch (err) {
    console.error('Failed to save formation:', err)
    return null
  }
}

export async function deleteFormationFromCloud(id: string): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return false

    const { error } = await supabase
      .from('formations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) throw error
    return true
  } catch (err) {
    console.error('Failed to delete formation:', err)
    return false
  }
}

export function preparePlayersForFormationLoad(players: FieldPlayer[]): FieldPlayer[] {
  return clonePlayersForNextPhase(players)
}
