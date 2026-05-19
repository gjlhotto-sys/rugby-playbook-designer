/** Rugby field canvas dimensions (matches rugby-field.tsx SVG). */
export const FIELD_CANVAS_WIDTH = 70 + 6 * 2
export const FIELD_CANVAS_HEIGHT = 120 + 6 * 2
export const FIELD_BUFFER = 6
export const FIELD_PLAY_HEIGHT = 110

export type FieldZone = 'full' | 'attack' | 'mid' | 'defence'

const ZONE_22_FRAC = 22 / 100
const ZONE_MID_FRAC = 56 / 100

/** Canvas y-coords of field lines (matches rugby-field.tsx). */
const LINE_10_TOP = FIELD_BUFFER + 45
const LINE_10_BOTTOM = FIELD_BUFFER + 65

export function parseViewBox(viewBox: string): {
  x: number
  y: number
  width: number
  height: number
} {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number)
  return {
    x: parts[0] ?? 0,
    y: parts[1] ?? 0,
    width: parts[2] ?? FIELD_CANVAS_WIDTH,
    height: parts[3] ?? FIELD_CANVAS_HEIGHT,
  }
}

export function getViewBoxForZone(zone: FieldZone): string {
  const top = FIELD_BUFFER
  const zone22H = FIELD_PLAY_HEIGHT * ZONE_22_FRAC
  const zoneMidH = FIELD_PLAY_HEIGHT * ZONE_MID_FRAC

  switch (zone) {
    case 'attack':
      return `0 0 ${FIELD_CANVAS_WIDTH} ${LINE_10_TOP}`
    case 'mid':
      return `0 ${top + zone22H} ${FIELD_CANVAS_WIDTH} ${zoneMidH}`
    case 'defence':
      return `0 ${LINE_10_BOTTOM} ${FIELD_CANVAS_WIDTH} ${FIELD_CANVAS_HEIGHT - LINE_10_BOTTOM}`
    case 'full':
    default:
      return `0 0 ${FIELD_CANVAS_WIDTH} ${FIELD_CANVAS_HEIGHT}`
  }
}

export function screenToSvgCoords(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewBox: string
): { x: number; y: number } {
  const vb = parseViewBox(viewBox)
  const nx = (clientX - rect.left) / rect.width
  const ny = (clientY - rect.top) / rect.height
  return {
    x: vb.x + nx * vb.width,
    y: vb.y + ny * vb.height,
  }
}

export function svgToScreenCoords(
  svgX: number,
  svgY: number,
  rect: DOMRect,
  viewBox: string
): { x: number; y: number } {
  const vb = parseViewBox(viewBox)
  return {
    x: rect.left + ((svgX - vb.x) / vb.width) * rect.width,
    y: rect.top + ((svgY - vb.y) / vb.height) * rect.height,
  }
}
