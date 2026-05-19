import type { Arrow } from './types'

export interface PathPoint {
  x: number
  y: number
}

export function dist(a: PathPoint, b: PathPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function getTotalLength(points: PathPoint[]): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += dist(points[i], points[i + 1])
  }
  return total
}

export function perpendicularDistance(
  point: PathPoint,
  lineStart: PathPoint,
  lineEnd: PathPoint
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag === 0) return dist(point, lineStart)
  return (
    Math.abs(
      dy * point.x -
        dx * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x
    ) / mag
  )
}

export function rdpSimplify(points: PathPoint[], epsilon = 3): PathPoint[] {
  if (points.length <= 2) return points

  let maxDist = 0
  let maxIdx = 0
  const start = points[0]
  const end = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end)
    if (d > maxDist) {
      maxDist = d
      maxIdx = i
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon)
    const right = rdpSimplify(points.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }

  return [start, end]
}

export function pointsToSmoothPath(points: PathPoint[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    const tension = 0.4
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 2
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 2
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 2
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 2

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }

  return d
}

export function pointsToPolylinePath(points: PathPoint[]): string {
  if (points.length === 0) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`
  }
  return d
}

export function interpolateAlongPoints(
  points: PathPoint[],
  t: number
): PathPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]

  const totalLength = getTotalLength(points)
  if (totalLength === 0) return points[points.length - 1]

  const targetLength = Math.max(0, Math.min(1, t)) * totalLength
  let accumulated = 0

  for (let i = 0; i < points.length - 1; i++) {
    const segLen = dist(points[i], points[i + 1])
    if (accumulated + segLen >= targetLength) {
      const segT = segLen === 0 ? 0 : (targetLength - accumulated) / segLen
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * segT,
        y: points[i].y + (points[i + 1].y - points[i].y) * segT,
      }
    }
    accumulated += segLen
  }

  return points[points.length - 1]
}

export function ensureFreeDrawPathD(arrow: Arrow): string {
  if (arrow.pathD) return arrow.pathD
  if (arrow.points && arrow.points.length >= 2) {
    return pointsToSmoothPath(arrow.points)
  }
  return `M ${arrow.fromX} ${arrow.fromY} L ${arrow.toX} ${arrow.toY}`
}

export function buildFreeDrawArrowFromRaw(
  rawPoints: PathPoint[],
  player: { id: string; team: 'attack' | 'defense'; x: number; y: number },
  color: string
): Arrow | null {
  if (rawPoints.length < 2) return null
  if (getTotalLength(rawPoints) < 10) return null

  const points = rdpSimplify(rawPoints, 3)
  if (points.length < 2) return null

  const pathD = pointsToSmoothPath(points)
  const last = points[points.length - 1]
  const first = points[0]

  return {
    id: `arrow-${Date.now()}`,
    playerId: player.id,
    team: player.team,
    fromX: first.x,
    fromY: first.y,
    toX: last.x,
    toY: last.y,
    arrowType: 'freedraw',
    points,
    pathD,
    color,
  }
}
