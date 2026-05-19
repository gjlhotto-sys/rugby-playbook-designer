import { svgToScreenCoords } from './field-zones'

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
  const viewBox =
    svg.getAttribute('viewBox') ?? `0 0 ${FIELD_CANVAS_WIDTH} ${FIELD_CANVAS_HEIGHT}`
  const { x: left, y: top } = svgToScreenCoords(x, y, rect, viewBox)
  return { left, top }
}
