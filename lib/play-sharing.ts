import { supabase } from '@/lib/supabase'
import type {
  FieldPlayer,
  Arrow,
  BallToken,
  PhaseMarker,
  ConeMarker,
  TextLabel,
  TeamColors,
  SavedPlay,
  PlayType,
} from './types'
import { PLAY_TYPES } from './types'
import type { FormationId, PlayCategory } from './play-metadata'
import { legacyPlayTypeToPlayCategory, parseFormationId } from './play-metadata'

export interface SavePlayResult {
  id: string
  share_id: string
}

export interface PlayData {
  /** Supabase `plays.id` — when set, upserts instead of inserting */
  id?: string
  name: string
  play_type: string
  play_category?: string
  formation?: string | null
  notes: string
  players: FieldPlayer[]
  arrows: Arrow[]
  ball: BallToken | null
  phases: PhaseMarker[]
  cones: ConeMarker[]
  labels: TextLabel[]
  team_colors: TeamColors
}

function isPlayType(value: string): value is PlayType {
  return PLAY_TYPES.includes(value as PlayType)
}

function playRowToSavedPlay(row: Record<string, unknown>): SavedPlay | null {
  const dbId = typeof row.id === 'string' ? row.id : null
  const shareId = row.share_id != null ? String(row.share_id) : null
  if (!shareId && !dbId) return null
  const playTypeRaw = typeof row.play_type === 'string' ? row.play_type : 'Free Play'
  const playType: PlayType = isPlayType(playTypeRaw) ? playTypeRaw : 'Free Play'
  const playCategoryRaw =
    typeof row.play_category === 'string'
      ? row.play_category
      : legacyPlayTypeToPlayCategory(playTypeRaw)
  const playCategory = ['attack', 'defence', 'set-piece'].includes(playCategoryRaw)
    ? (playCategoryRaw as PlayCategory)
    : legacyPlayTypeToPlayCategory(playTypeRaw)
  const formation = parseFormationId(row.formation)
  const teamColors = row.team_colors as TeamColors | undefined
  const listKey = shareId ?? dbId ?? ''
  return {
    id: `cloud:${listKey}`,
    cloudRecordId: dbId ?? undefined,
    shareId: shareId ?? undefined,
    name: typeof row.name === 'string' ? row.name : 'Untitled Play',
    playType,
    playCategory,
    formation,
    notes: typeof row.notes === 'string' ? row.notes : '',
    timestamp:
      typeof row.updated_at === 'string'
        ? row.updated_at
        : new Date().toISOString(),
    teamColors: teamColors ?? {
      attack: '#3B82F6',
      defense: '#EF4444',
    },
    players: (row.players as FieldPlayer[]) ?? [],
    arrows: (row.arrows as Arrow[]) ?? [],
    ball: (row.ball as BallToken | null) ?? null,
    phases: (row.phases as PhaseMarker[]) ?? [],
    cones: (row.cones as ConeMarker[]) ?? [],
    labels: (row.labels as TextLabel[]) ?? [],
  }
}

export async function loadCloudPlaysForUser(): Promise<SavedPlay[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return []

  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error || !data) {
    console.error('Failed to load cloud plays:', error)
    return []
  }

  return (data as Record<string, unknown>[])
    .map((row) => playRowToSavedPlay(row))
    .filter((p): p is SavedPlay => p != null)
}

function logSavePlayError(error: unknown) {
  console.error('Failed to save play:', JSON.stringify(error, null, 2))
  const err = error as {
    message?: string
    details?: string
    hint?: string
    code?: string
  }
  console.error('Error message:', err?.message)
  console.error('Error details:', err?.details)
  console.error('Error hint:', err?.hint)
  console.error('Error code:', err?.code)
}

function isMissingColumnError(
  error: { code?: string; message?: string } | null,
  column: string
): boolean {
  return (
    error?.code === 'PGRST204' &&
    (error.message?.includes(`'${column}'`) ?? false)
  )
}

function buildPlayInsertRow(
  playData: PlayData,
  userId: string,
  includeExtendedColumns: boolean
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: playData.name,
    play_type: playData.play_type,
    notes: playData.notes,
    players: playData.players,
    arrows: playData.arrows,
    ball: playData.ball,
    phases: playData.phases,
    cones: playData.cones,
    labels: playData.labels,
    team_colors: playData.team_colors,
    user_id: userId,
  }

  if (playData.id) {
    row.id = playData.id
  }

  if (includeExtendedColumns) {
    row.play_category = playData.play_category ?? playData.play_type
    row.formation = playData.formation ?? null
  }

  return row
}

function assertSupabaseClient() {
  if (!supabase?.from) {
    throw new Error('Supabase client is not initialized')
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
}

async function writePlayRow(
  row: Record<string, unknown>,
  hasExistingId: boolean
) {
  assertSupabaseClient()
  const table = supabase.from('plays')
  if (hasExistingId) {
    return table.upsert(row, { onConflict: 'id' }).select('id, share_id').single()
  }
  return table.insert(row).select('id, share_id').single()
}

export async function savePlayToCloud(
  playData: PlayData
): Promise<SavePlayResult | null> {
  assertSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  console.log('savePlayToCloud session userId:', userId)

  if (!userId) {
    console.error('No active session — cannot save play')
    return null
  }

  const existingId =
    playData.id && isUuid(playData.id) ? playData.id : undefined

  const saveWithExtendedColumns = async (includeExtended: boolean) => {
    const payload = buildPlayInsertRow(playData, userId, includeExtended)
    if (existingId) {
      payload.id = existingId
    } else {
      delete payload.id
    }

    console.log('Upserting payload:', JSON.stringify(payload))

    const response = await writePlayRow(payload, Boolean(existingId))
    console.log('Supabase response:', {
      data: response.data,
      error: response.error,
    })

    return response
  }

  try {
    let { data, error } = await saveWithExtendedColumns(true)

    if (
      error &&
      (isMissingColumnError(error, 'play_category') ||
        isMissingColumnError(error, 'formation'))
    ) {
      console.warn(
        'plays table missing play_category/formation columns; retrying without them'
      )
      ;({ data, error } = await saveWithExtendedColumns(false))
    }

    if (error) {
      logSavePlayError(error)
      throw error
    }

    const id = (data as { id?: string } | null)?.id
    const shareId = (data as { share_id?: string } | null)?.share_id
    if (!id || !shareId) {
      const missing = new Error(
        'Save succeeded but Supabase response is missing id or share_id'
      )
      console.error(missing.message, data)
      throw missing
    }

    return { id, share_id: shareId }
  } catch (err) {
    logSavePlayError(err)
    throw err
  }
}

export async function deletePlay(playId: string): Promise<boolean> {
  if (!playId) return false

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) {
      console.error('No active session — cannot delete play')
      return false
    }

    const { error } = await supabase
      .from('plays')
      .delete()
      .eq('id', playId)
      .eq('user_id', userId)

    if (error) {
      logSavePlayError(error)
      return false
    }

    return true
  } catch (err) {
    logSavePlayError(err)
    return false
  }
}

export async function loadPlayFromCloud(shareId: string): Promise<PlayData | null> {
  try {
    const { data, error } = await supabase
      .from('plays')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (error) throw error
    return data as PlayData
  } catch (err) {
    console.error('Failed to load play:', err)
    return null
  }
}

