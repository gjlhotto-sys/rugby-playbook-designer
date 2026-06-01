import type { PlayerTemplate } from './types'

export const NETBALL_POSITIONS: PlayerTemplate[] = [
  { number: 1, position: 'Goal Shooter', abbr: 'GS' },
  { number: 2, position: 'Goal Attack', abbr: 'GA' },
  { number: 3, position: 'Wing Attack', abbr: 'WA' },
  { number: 4, position: 'Centre', abbr: 'C' },
  { number: 5, position: 'Wing Defence', abbr: 'WD' },
  { number: 6, position: 'Goal Defence', abbr: 'GD' },
  { number: 7, position: 'Goal Keeper', abbr: 'GK' },
]

/**
 * Positional area restrictions (informational only — not enforced).
 * Keyed by position abbreviation.
 */
export const NETBALL_POSITION_NOTES: Record<string, string> = {
  GS: 'Attacking third + shooting circle only',
  GA: 'Attacking two thirds',
  WA: 'Attacking two thirds (no shooting circle)',
  C: 'All thirds (no shooting circles)',
  WD: 'Defending two thirds (no shooting circle)',
  GD: 'Defending two thirds',
  GK: 'Defending third + shooting circle only',
}
