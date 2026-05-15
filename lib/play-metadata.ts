export type FormationId = 'scrum' | 'lineout' | 'both' | 'kickoff' | 'free-play'

export type PlayCategory = 'attack' | 'defence' | 'set-piece'

export const FORMATION_LABELS: Record<FormationId, string> = {
  scrum: 'Scrum',
  lineout: 'Lineout',
  both: 'Both Teams',
  kickoff: 'Kickoff',
  'free-play': 'Free Play',
}

export const PLAY_CATEGORY_LABELS: Record<PlayCategory, string> = {
  attack: 'Attack',
  defence: 'Defence',
  'set-piece': 'Set Piece',
}

export const PLAY_CATEGORY_COLORS: Record<PlayCategory, string> = {
  attack: '#60a5fa',
  defence: '#f87171',
  'set-piece': '#34d399',
}

/** Maps UI play category chips to legacy PlayType values for notes/export. */
export function playCategoryToLegacyPlayType(
  category: PlayCategory
): 'Lineout' | 'Scrum' | 'Backline Move' | 'Kick-off' | 'Restart' | 'Penalty' | 'Free Play' {
  switch (category) {
    case 'attack':
      return 'Backline Move'
    case 'defence':
      return 'Free Play'
    case 'set-piece':
      return 'Lineout'
    default:
      return 'Free Play'
  }
}

export function legacyPlayTypeToPlayCategory(playType: string): PlayCategory {
  const lower = playType.toLowerCase()
  if (lower === 'attack' || lower === 'backline move' || lower === 'kick-off') return 'attack'
  if (lower === 'defence' || lower === 'defense' || lower === 'penalty' || lower === 'restart') {
    return 'defence'
  }
  if (lower === 'set piece' || lower === 'set-piece' || lower === 'lineout' || lower === 'scrum') {
    return 'set-piece'
  }
  return 'attack'
}

export function parseFormationId(value: unknown): FormationId | null {
  if (value === 'scrum' || value === 'lineout' || value === 'both' || value === 'kickoff') {
    return value
  }
  if (value === 'free-play' || value === 'free_play' || value === 'Free Play') {
    return 'free-play'
  }
  return null
}
