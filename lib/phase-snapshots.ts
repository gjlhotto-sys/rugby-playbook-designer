import type { FieldPlayer, PhaseSnapshot } from './types'

export function createEmptyPhaseSnapshot(): PhaseSnapshot {
  return {
    players: [],
    arrows: [],
    ball: null,
    cones: [],
    labels: [],
    phaseMarkers: [],
  }
}

export function clonePlayersForNextPhase(players: FieldPlayer[]): FieldPlayer[] {
  return players.map((p) => ({
    ...p,
    id: `${p.team}-${p.number}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }))
}
