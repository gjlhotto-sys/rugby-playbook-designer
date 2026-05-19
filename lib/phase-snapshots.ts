import type { Arrow, FieldPlayer, PhaseSnapshot } from './types'

type SequencedArrow = Arrow & { timestamp?: number }

function arrowBelongsToPlayer(arrow: Arrow, player: FieldPlayer): boolean {
  if (arrow.arrowType === 'pass' || arrow.arrowType === 'kick' || arrow.arrowType === 'ruck') {
    return false
  }
  const playerKeys = new Set([
    player.id,
    `attack-${player.number}`,
    `defense-${player.number}`,
    `defence-${player.number}`,
    `${player.team}-${player.number}`,
  ])
  if (playerKeys.has(arrow.playerId)) return true
  const arrowNorm = arrow.playerId.replace(/^attack-/, '').replace(/^defense-/, '').replace(/^defence-/, '')
  return (
    arrowNorm === String(player.number) ||
    arrow.playerId === `${player.team}-${player.number}`
  )
}

/**
 * Resolves each player's position to the endpoint of their last movement arrow
 * (arrowhead tip). Players without movement arrows keep their static position.
 */
export function resolvePlayersToArrowEndpoints(
  players: FieldPlayer[],
  arrows: Arrow[]
): FieldPlayer[] {
  return players.map((player) => {
    const movementArrows = arrows
      .map((arrow, index) => ({ arrow, index }))
      .filter(({ arrow }) => arrowBelongsToPlayer(arrow, player))
      .sort((a, b) => {
        const aOrder = (a.arrow as SequencedArrow).timestamp ?? a.index
        const bOrder = (b.arrow as SequencedArrow).timestamp ?? b.index
        return aOrder - bOrder
      })

    if (movementArrows.length === 0) {
      return player
    }

    const lastArrow = movementArrows[movementArrows.length - 1].arrow
    return { ...player, x: lastArrow.toX, y: lastArrow.toY }
  })
}

export function createEmptyPhaseSnapshot(): PhaseSnapshot {
  return {
    players: [],
    arrows: [],
    ball: null,
    cones: [],
    labels: [],
    phaseMarkers: [],
    ruckMarkers: [],
  }
}

export function clonePlayersForNextPhase(players: FieldPlayer[]): FieldPlayer[] {
  return players.map((p) => ({
    ...p,
    id: `${p.team}-${p.number}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }))
}
