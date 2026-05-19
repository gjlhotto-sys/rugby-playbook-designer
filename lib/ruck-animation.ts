import type { Arrow } from './types'

export type SequencedArrow = Arrow & {
  sequence?: number
  timestamp?: number
  _index?: number
}

/** Assign sequence numbers for animation (preserves existing sequence/timestamp when set). */
export function assignArrowSequences(arrows: Arrow[]): SequencedArrow[] {
  const arrowsWithMeta = arrows.map((arrow, index) => ({
    ...arrow,
    sequence: (arrow as SequencedArrow).sequence,
    timestamp: (arrow as SequencedArrow).timestamp,
    _index: index,
  }))

  const sortedByTime = [...arrowsWithMeta].sort((a, b) => {
    const aTs = a.timestamp ?? Number.MAX_SAFE_INTEGER
    const bTs = b.timestamp ?? Number.MAX_SAFE_INTEGER
    if (aTs !== bTs) return aTs - bTs
    return (a._index ?? 0) - (b._index ?? 0)
  })

  let lastTimestamp: number | null = null
  let generatedSequence = 0
  const sequencedArrows = sortedByTime.map((arrow) => {
    if (typeof arrow.sequence === 'number') {
      generatedSequence = Math.max(generatedSequence, arrow.sequence)
      lastTimestamp =
        typeof arrow.timestamp === 'number' ? arrow.timestamp : lastTimestamp
      return arrow
    }

    if (typeof arrow.timestamp === 'number') {
      if (lastTimestamp === null || Math.abs(arrow.timestamp - lastTimestamp) >= 500) {
        generatedSequence += 1
      }
      lastTimestamp = arrow.timestamp
    } else {
      generatedSequence += 1
    }

    return { ...arrow, sequence: generatedSequence }
  })

  return [...sequencedArrows].sort((a, b) => {
    const aSeq = a.sequence ?? Number.MAX_SAFE_INTEGER
    const bSeq = b.sequence ?? Number.MAX_SAFE_INTEGER
    if (aSeq !== bSeq) return aSeq - bSeq
    const aTs = a.timestamp ?? Number.MAX_SAFE_INTEGER
    const bTs = b.timestamp ?? Number.MAX_SAFE_INTEGER
    if (aTs !== bTs) return aTs - bTs
    return (a._index ?? 0) - (b._index ?? 0)
  })
}

/**
 * Build animation groups: each non-ruck arrow is its own step; all arrows sharing a
 * ruckId animate together as one step.
 */
export function buildAnimationGroupsFromArrows(arrows: Arrow[]): SequencedArrow[][] {
  const sorted = assignArrowSequences(arrows)
  const groups: SequencedArrow[][] = []
  const seenRuckIds = new Set<string>()

  for (const arrow of sorted) {
    if (arrow.arrowType === 'ruck' && arrow.ruckId) {
      if (seenRuckIds.has(arrow.ruckId)) continue
      seenRuckIds.add(arrow.ruckId)
      groups.push(
        sorted.filter((a) => a.arrowType === 'ruck' && a.ruckId === arrow.ruckId)
      )
    } else {
      groups.push([arrow])
    }
  }

  return groups
}
