import { supabase } from './supabase'
import type { FieldPlayer, Arrow, BallToken, PhaseMarker, ConeMarker, TextLabel, TeamColors } from './types'

export interface PlayData {
  name: string
  play_type: string
  notes: string
  players: FieldPlayer[]
  arrows: Arrow[]
  ball: BallToken | null
  phases: PhaseMarker[]
  cones: ConeMarker[]
  labels: TextLabel[]
  team_colors: TeamColors
}

export async function savePlayToCloud(playData: PlayData): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('plays')
      .insert({
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
      })
      .select('share_id')
      .single()

    if (error) throw error
    return (data as { share_id: string }).share_id
  } catch (err) {
    console.error('Failed to save play to cloud:', err)
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

