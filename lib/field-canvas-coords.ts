const BUFFER = 6
export const FIELD_CANVAS_WIDTH = 70 + BUFFER * 2
export const FIELD_CANVAS_HEIGHT = 120 + BUFFER * 2

export function getFieldCanvasScreenPoint(
  x: number,
  y: number
): { left: number; top: number } | null {
  const svg = document.querySelector('[data-field-canvas] svg') as SVGSVGElement | null
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  return {
    left: rect.left + (x / FIELD_CANVAS_WIDTH) * rect.width,
    top: rect.top + (y / FIELD_CANVAS_HEIGHT) * rect.height,
  }
}
