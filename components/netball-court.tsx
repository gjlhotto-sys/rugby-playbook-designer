import {
  FIELD_BUFFER,
  FIELD_CANVAS_WIDTH,
  FIELD_CANVAS_HEIGHT,
  FIELD_PLAY_HEIGHT,
} from '@/lib/field-zones'

/**
 * Netball court markings. Drawn in the exact same coordinate region the rugby
 * field uses (x: BUFFER..BUFFER+70, y: BUFFER..BUFFER+110) so all player,
 * arrow and animation coordinates line up identically across sports.
 *
 * Returns the static court SVG elements; intended to be embedded inside the
 * shared <svg> in rugby-field.tsx in place of the rugby markings.
 */
export function NetballCourt() {
  const x = FIELD_BUFFER
  const y = FIELD_BUFFER
  const w = 70
  const h = FIELD_PLAY_HEIGHT
  const cx = x + w / 2

  const thirdH = h / 3
  const thirdLine1 = y + thirdH
  const thirdLine2 = y + thirdH * 2

  // Shooting circles: radius ~16% of court length.
  const shootingR = h * 0.16
  const topGoalY = y
  const bottomGoalY = y + h

  const centreCircleR = 4

  const line = 'white'

  return (
    <>
      {/* Buffer background */}
      <rect
        x="0"
        y="0"
        width={FIELD_CANVAS_WIDTH}
        height={FIELD_CANVAS_HEIGHT}
        fill="#0f3d30"
      />

      {/* Court surface */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2"
        ry="2"
        fill="#1a4a3a"
        stroke={line}
        strokeWidth="1"
      />

      {/* Thirds dividing lines */}
      <line x1={x} y1={thirdLine1} x2={x + w} y2={thirdLine1} stroke={line} strokeWidth="1" />
      <line x1={x} y1={thirdLine2} x2={x + w} y2={thirdLine2} stroke={line} strokeWidth="1" />

      {/* Centre circle */}
      <circle
        cx={cx}
        cy={y + h / 2}
        r={centreCircleR}
        fill="none"
        stroke={line}
        strokeWidth="1"
      />
      <circle cx={cx} cy={y + h / 2} r="0.6" fill={line} opacity="0.7" />

      {/* Shooting circle — top (bulges down into court) */}
      <path
        d={`M ${cx - shootingR} ${topGoalY} A ${shootingR} ${shootingR} 0 0 0 ${
          cx + shootingR
        } ${topGoalY}`}
        fill="none"
        stroke={line}
        strokeWidth="1"
      />

      {/* Shooting circle — bottom (bulges up into court) */}
      <path
        d={`M ${cx - shootingR} ${bottomGoalY} A ${shootingR} ${shootingR} 0 0 1 ${
          cx + shootingR
        } ${bottomGoalY}`}
        fill="none"
        stroke={line}
        strokeWidth="1"
      />

      {/* Goal posts (simple ring at each goal line) */}
      <circle cx={cx} cy={topGoalY} r="1.1" fill="none" stroke={line} strokeWidth="0.5" />
      <circle cx={cx} cy={bottomGoalY} r="1.1" fill="none" stroke={line} strokeWidth="0.5" />

      {/* GOAL labels */}
      <text x={cx} y={topGoalY + 4} fontSize="2.4" fill="white" opacity="0.45" textAnchor="middle">
        GOAL
      </text>
      <text
        x={cx}
        y={bottomGoalY - 2.5}
        fontSize="2.4"
        fill="white"
        opacity="0.45"
        textAnchor="middle"
      >
        GOAL
      </text>

      {/* Third labels (muted) */}
      <text
        x={x + 1.5}
        y={y + thirdH / 2}
        fontSize="2.2"
        fill="white"
        opacity="0.35"
        dominantBaseline="middle"
      >
        Attacking Third
      </text>
      <text
        x={x + 1.5}
        y={y + thirdH + thirdH / 2}
        fontSize="2.2"
        fill="white"
        opacity="0.35"
        dominantBaseline="middle"
      >
        Centre Third
      </text>
      <text
        x={x + 1.5}
        y={y + thirdH * 2 + thirdH / 2}
        fontSize="2.2"
        fill="white"
        opacity="0.35"
        dominantBaseline="middle"
      >
        Defending Third
      </text>
    </>
  )
}
