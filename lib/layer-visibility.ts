import type { Arrow } from './types'

export interface LayerVisibility {
  runArrows: boolean
  passArrows: boolean
  kickArrows: boolean
  ruckArrows: boolean
  repositionArrows: boolean
  freeDrawArrows: boolean
  decoyArrows: boolean
  defencePlayers: boolean
  arrowOpacity: number
}

export type LayerToggleKey = Exclude<keyof LayerVisibility, 'arrowOpacity'>

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  runArrows: true,
  passArrows: true,
  kickArrows: true,
  ruckArrows: true,
  repositionArrows: true,
  freeDrawArrows: true,
  decoyArrows: true,
  defencePlayers: true,
  arrowOpacity: 1,
}

export const ALL_LAYERS_VISIBLE: LayerVisibility = {
  ...DEFAULT_LAYER_VISIBILITY,
  arrowOpacity: 1,
}

export function filterVisibleArrows(
  arrows: Arrow[],
  layerVisibility: LayerVisibility
): Arrow[] {
  return arrows.filter((arrow) => {
    if (arrow.arrowType === 'run' && !layerVisibility.runArrows) return false
    if (arrow.arrowType === 'pass' && !layerVisibility.passArrows) return false
    if (arrow.arrowType === 'kick' && !layerVisibility.kickArrows) return false
    if (arrow.arrowType === 'ruck' && !layerVisibility.ruckArrows) return false
    if (arrow.arrowType === 'reposition' && !layerVisibility.repositionArrows) {
      return false
    }
    if (arrow.arrowType === 'freedraw' && !layerVisibility.freeDrawArrows) {
      return false
    }
    if (arrow.arrowType === 'decoy' && !layerVisibility.decoyArrows) return false
    return true
  })
}
