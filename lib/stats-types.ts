export type NetballPosition = 'GS' | 'GA' | 'WA' | 'C' | 'WD' | 'GD' | 'GK'

export const NETBALL_POSITIONS_ORDER: NetballPosition[] = [
  'GS',
  'GA',
  'WA',
  'C',
  'WD',
  'GD',
  'GK',
]

export const NETBALL_POSITION_LABELS: Record<NetballPosition, string> = {
  GS: 'Goal Shooter',
  GA: 'Goal Attack',
  WA: 'Wing Attack',
  C: 'Centre',
  WD: 'Wing Defence',
  GD: 'Goal Defence',
  GK: 'Goal Keeper',
}

export type StatType =
  | 'bad_pass'
  | 'drop_ball'
  | 'step'
  | 'break'
  | 'contact'
  | 'obstruct'
  | 'offside'
  | 'obstruct_hand'
  | 'obstruct_feet'
  | 'replay'
  | 'repossession'
  | 'held_negative'
  | 'goal_missed'
  | 'interception'
  | 'tip'
  | 'rebound'
  | 'held_positive'
  | 'loose_ball'
  | 'goal_shot'

export const NEGATIVE_STATS: StatType[] = [
  'bad_pass',
  'drop_ball',
  'step',
  'break',
  'contact',
  'obstruct',
  'offside',
  'obstruct_hand',
  'obstruct_feet',
  'replay',
  'repossession',
  'held_negative',
  'goal_missed',
]

export const POSITIVE_STATS: StatType[] = [
  'interception',
  'tip',
  'rebound',
  'held_positive',
  'loose_ball',
  'goal_shot',
]

export const STAT_LABELS: Record<StatType, string> = {
  bad_pass: 'Bad Pass',
  drop_ball: 'Miss Catch',
  step: 'Footwork',
  break: 'Break',
  contact: 'Contact',
  obstruct: 'Obstruct',
  offside: 'Offside',
  obstruct_hand: 'Obstruct (Hand)',
  obstruct_feet: 'Obstruct (Feet)',
  replay: 'Replay',
  repossession: 'Repossession',
  held_negative: 'Held',
  goal_missed: 'Goal Missed',
  interception: 'Interception',
  tip: 'Tip',
  rebound: 'Rebound',
  held_positive: 'Held',
  loose_ball: 'Loose Ball',
  goal_shot: 'Goal Shot',
}

/** Goal stats get their own dedicated section (GS/GA only), so they are
 *  excluded from the generic Faults / Positive button grids. */
export const GOAL_STATS: StatType[] = ['goal_shot', 'goal_missed']

export interface PlayerEntry {
  position: NetballPosition
  name: string
  isOnField: boolean
  substitutedAt?: number // quarter number
}

export interface StatEntry {
  id: string
  quarter: number
  timeInQuarter: number // seconds elapsed
  playerId: string // position key
  playerName: string
  stat: StatType
  timestamp: number
}

export interface QuarterScore {
  us: number
  them: number
}

export interface MatchData {
  id: string
  teamName: string
  oppositionName: string
  quarterDuration: number // minutes
  date: string
  players: Record<NetballPosition, PlayerEntry[]>
  // Array because of substitutions
  stats: StatEntry[]
  scores: Record<number, QuarterScore>
  // quarter 1-4
  currentQuarter: number
  matchComplete: boolean
}

export interface SavedTeam {
  id: string
  name: string
  players: Record<NetballPosition, string>
  // position -> player name
  lastUsed: string
}

export const SAVED_TEAMS_KEY = 'playforge-saved-teams'
export const CURRENT_MATCH_KEY = 'playforge-current-match'

export function loadSavedTeams(): SavedTeam[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SAVED_TEAMS_KEY)
    return raw ? (JSON.parse(raw) as SavedTeam[]) : []
  } catch {
    return []
  }
}

export function persistSavedTeams(teams: SavedTeam[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams))
}

export function loadCurrentMatch(): MatchData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CURRENT_MATCH_KEY)
    return raw ? (JSON.parse(raw) as MatchData) : null
  } catch {
    return null
  }
}

export function persistCurrentMatch(match: MatchData | null) {
  if (typeof window === 'undefined') return
  if (match === null) {
    localStorage.removeItem(CURRENT_MATCH_KEY)
  } else {
    localStorage.setItem(CURRENT_MATCH_KEY, JSON.stringify(match))
  }
}

/** The player currently on the field for a given position. */
export function getActivePlayer(
  match: MatchData,
  position: NetballPosition
): PlayerEntry | undefined {
  const entries = match.players[position] ?? []
  return entries.find((p) => p.isOnField) ?? entries[entries.length - 1]
}
