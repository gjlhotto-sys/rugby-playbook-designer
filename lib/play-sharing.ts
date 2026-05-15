import { supabase } from './supabase'
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

export interface PlayData {
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
  const shareId = row.share_id != null ? String(row.share_id) : null
  if (!shareId) return null
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
  return {
    id: `cloud:${shareId}`,
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
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('user_id', user.id)
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

  if (includeExtendedColumns) {
    row.play_category = playData.play_category ?? playData.play_type
    row.formation = playData.formation ?? null
  }

  return row
}

export async function savePlayToCloud(playData: PlayData): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) {
      console.error('Failed to save play: user is not authenticated')
      return null
    }

    const insertPlay = (row: Record<string, unknown>) =>
      supabase.from('plays').insert(row).select('share_id').single()

    let { data, error } = await insertPlay(
      buildPlayInsertRow(playData, userId, true)
    )

    if (
      error &&
      (isMissingColumnError(error, 'play_category') ||
        isMissingColumnError(error, 'formation'))
    ) {
      console.warn(
        'plays table missing play_category/formation columns; retrying without them'
      )
      ;({ data, error } = await insertPlay(
        buildPlayInsertRow(playData, userId, false)
      ))
    }

    if (error) {
      logSavePlayError(error)
      return null
    }

    const shareId = (data as { share_id?: string } | null)?.share_id
    if (!shareId) {
      console.error('Failed to save play: insert succeeded but share_id was missing')
      return null
    }

    return shareId
  } catch (err) {
    logSavePlayError(err)
    return null
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

