"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import type { FieldPlayer, Arrow, InteractionMode, TeamColors, ArrowType, BallToken, PhaseMarker, ConeMarker, TextLabel } from "@/lib/types"
import { ARROW_TYPES } from "@/lib/types"

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetId: string | null
  targetType: "player" | "ball" | "phase" | "cone" | "label" | null
}

interface ArrowEditState {
  arrowId: string | null
  showTypeDropdown: boolean
  dropdownX: number
  dropdownY: number
}

interface RugbyFieldProps {
  players: FieldPlayer[]
  arrows: Arrow[]
  ball: BallToken | null
  phases: PhaseMarker[]
  cones: ConeMarker[]
  labels: TextLabel[]
  selectedPlayerId: string | null
  selectedBall: boolean
  selectedArrowId: string | null
  mode: InteractionMode
  arrowType: ArrowType
  passerSelected: string | null
  teamColors: TeamColors
  zoom: number
  clickToPlaceActive?: boolean
  onFieldClick: (x: number, y: number) => void
  onPlayerDrop: (playerId: string, x: number, y: number) => void
  onBallDrop: (x: number, y: number) => void
  onPhaseDrop: (phase: number, x: number, y: number) => void
  onConeDrop: (x: number, y: number) => void
  onPlayerSelect: (playerId: string | null) => void
  onPasserSelect: (playerId: string | null) => void
  onCreatePassArrow: (passerId: string, receiverId: string) => void
  onBallSelect: (selected: boolean) => void
  onArrowSelect: (arrowId: string | null) => void
  onPlayerDragStart: (playerId: string) => void
  onPlayerDrag: (playerId: string, x: number, y: number) => void
  onPlayerDragEnd: () => void
  onBallDragStart: () => void
  onBallDrag: (x: number, y: number) => void
  onBallDragEnd: () => void
  onPhaseDragStart: (phaseId: string) => void
  onPhaseDrag: (phaseId: string, x: number, y: number) => void
  onPhaseDragEnd: () => void
  onConeDragStart: (coneId: string) => void
  onConeDrag: (coneId: string, x: number, y: number) => void
  onConeDragEnd: () => void
  onLabelDragStart: (labelId: string) => void
  onLabelDrag: (labelId: string, x: number, y: number) => void
  onLabelDragEnd: () => void
  onDeletePlayer: (playerId: string) => void
  onDeleteBall: () => void
  onDeletePhase: (phaseId: string) => void
  onDeleteCone: (coneId: string) => void
  onDeleteLabel: (labelId: string) => void
  onClearPlayerArrows: (playerId: string) => void
  onClearBallArrows: () => void
  onArrowUpdate: (arrowId: string, updates: Partial<Arrow>) => void
  onArrowDelete: (arrowId: string) => void
  onArrowTypeChange: (arrowId: string, newType: ArrowType) => void
  onTextLabelCreate: (x: number, y: number) => void
  animationSpeed?: 0.5 | 1 | 2
}

export function RugbyField({
  players = [],
  arrows = [],
  ball,
  phases = [],
  cones = [],
  labels = [],
  selectedPlayerId,
  selectedBall,
  selectedArrowId,
  mode,
  arrowType,
  passerSelected,
  teamColors,
  zoom,
  clickToPlaceActive = false,
  onFieldClick,
  onPlayerDrop,
  onBallDrop,
  onPhaseDrop,
  onConeDrop,
  onPlayerSelect,
  onPasserSelect,
  onCreatePassArrow,
  onBallSelect,
  onArrowSelect,
  onPlayerDragStart,
  onPlayerDrag,
  onPlayerDragEnd,
  onBallDragStart,
  onBallDrag,
  onBallDragEnd,
  onPhaseDragStart,
  onPhaseDrag,
  onPhaseDragEnd,
  onConeDragStart,
  onConeDrag,
  onConeDragEnd,
  onLabelDragStart,
  onLabelDrag,
  onLabelDragEnd,
  onDeletePlayer,
  onDeleteBall,
  onDeletePhase,
  onDeleteCone,
  onDeleteLabel,
  onClearPlayerArrows,
  onClearBallArrows,
  onArrowUpdate,
  onArrowDelete,
  onArrowTypeChange,
  onTextLabelCreate,
  animationSpeed = 1,
}: RugbyFieldProps) {
  type SequencedArrow = Arrow & { timestamp?: number; sequence?: number }
  type KickCurve = {
    fromX: number
    fromY: number
    cp1x: number
    cp1y: number
    cp2x: number
    cp2y: number
    toX: number
    toY: number
  }
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ type: "player" | "ball" | "phase" | "cone" | "label" | "arrow-start" | "arrow-mid" | "arrow-end"; id: string; offsetX: number; offsetY: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null,
  })
  const [arrowEdit, setArrowEdit] = useState<ArrowEditState>({
    arrowId: null,
    showTypeDropdown: false,
    dropdownX: 0,
    dropdownY: 0,
  })
  const animatedPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, { x: number; y: number }>>({})
  const startPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const targetPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const animationStartTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)
  const isAnimatingRef = useRef(false)
  const animationDurationRef = useRef(2000)
  const currentGroupRef = useRef(0)
  const animationGroupsRef = useRef<SequencedArrow[][]>([])
  const groupTimeoutRef = useRef<number | null>(null)
  const nextGroupStarted = useRef(false)
  const overlapAnimationFrameRef = useRef<number | null>(null)
  const overlappedGroupIndexRef = useRef<number | null>(null)
  const kickCurveRef = useRef<KickCurve | null>(null)
  const pendingPassSnapRef = useRef<{
    passerId: string
    receiverId: string
    start: { x: number; y: number }
    target: { x: number; y: number }
  } | null>(null)
  const pendingRunSnapRef = useRef<{
    playerId: string
    start: { x: number; y: number }
  } | null>(null)
  const [hoverPassEndpoint, setHoverPassEndpoint] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setContextMenu(prev => ({ ...prev, visible: false }))
      // Close arrow type dropdown if clicking outside
      if (arrowEdit.showTypeDropdown) {
        const target = e.target as HTMLElement
        if (!target.closest('.arrow-type-dropdown')) {
          setArrowEdit(prev => ({ ...prev, showTypeDropdown: false }))
        }
      }
    }
    if (contextMenu.visible || arrowEdit.showTypeDropdown) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu.visible, arrowEdit.showTypeDropdown])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onPasserSelect(null)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onPasserSelect])

  const getPlayerCurrentPos = useCallback((playerId: string) => {
    if (animatedPositionsRef.current[playerId]) {
      return animatedPositionsRef.current[playerId]
    }
    const player = players.find((p) =>
      p.id === playerId ||
      `attack-${p.number}` === playerId ||
      `defense-${p.number}` === playerId ||
      `defence-${p.number}` === playerId ||
      `${p.team}-${p.number}` === playerId
    )
    return player ? { x: player.x, y: player.y } : null
  }, [players])

  const getKickCurve = useCallback((fromX: number, fromY: number, toX: number, toY: number) => {
    const dx = toX - fromX
    const dy = toY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const safeDist = Math.max(dist, 0.001)
    
    // Use a consistent upward lift in SVG space (negative Y = up on screen)
    // This makes the kick arc go "up" visually regardless of direction
    const lift = Math.min(dist * 0.4, 15)
    
    // Always arc upward on screen (negative Y direction in SVG)
    // For kicks going mostly horizontal, arc goes up
    // For kicks going mostly vertical, arc goes to the side
    const perpX = (-dy / safeDist) * lift
    const perpY = (-Math.abs(dx) / safeDist) * lift

    const cp1x = fromX + dx * 0.25 + perpX
    const cp1y = fromY + dy * 0.25 + perpY
    const cp2x = fromX + dx * 0.75 + perpX
    const cp2y = fromY + dy * 0.75 + perpY

    return { fromX, fromY, cp1x, cp1y, cp2x, cp2y, toX, toY }
  }, [])

  const getBezierPoint = useCallback((
    t: number,
    fx: number,
    fy: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    tx: number,
    ty: number
  ) => {
    const mt = 1 - t
    return {
      x: mt * mt * mt * fx + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * tx,
      y: mt * mt * mt * fy + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * ty,
    }
  }, [])

  const animateGroupTick = useCallback((
    timestamp: number,
    groupStarts: Record<string, { x: number; y: number }>,
    groupTargets: Record<string, { x: number; y: number }>,
    groupStartTime: number,
    onComplete: () => void,
    onProgress?: (rawProgress: number) => void
  ) => {
    if (!isAnimatingRef.current) return

    const elapsed = timestamp - groupStartTime
    const duration = animationDurationRef.current
    const rawProgress = Math.min(elapsed / duration, 1)
    const progress = 1 - Math.pow(1 - rawProgress, 3)
    const newPositions: Record<string, { x: number; y: number }> = { ...animatedPositionsRef.current }
    Object.keys(groupTargets).forEach((id) => {
      const start = groupStarts[id]
      const target = groupTargets[id]
      if (start && target) {
        if (id === "ball" && kickCurveRef.current) {
          const p = getBezierPoint(
            rawProgress,
            kickCurveRef.current.fromX,
            kickCurveRef.current.fromY,
            kickCurveRef.current.cp1x,
            kickCurveRef.current.cp1y,
            kickCurveRef.current.cp2x,
            kickCurveRef.current.cp2y,
            kickCurveRef.current.toX,
            kickCurveRef.current.toY
          )
          newPositions[id] = p
        } else {
          newPositions[id] = {
            x: start.x + (target.x - start.x) * progress,
            y: start.y + (target.y - start.y) * progress,
          }
        }
      }
    })

    animatedPositionsRef.current = newPositions
    setAnimatedPositions({ ...newPositions })
    onProgress?.(rawProgress)

    if (rawProgress < 1) {
      animationFrameRef.current = requestAnimationFrame((ts) =>
        animateGroupTick(ts, groupStarts, groupTargets, groupStartTime, onComplete, onProgress)
      )
    } else {
      onComplete()
    }
  }, [getBezierPoint])

  const clearGroupTimeout = useCallback(() => {
    if (groupTimeoutRef.current !== null) {
      window.clearTimeout(groupTimeoutRef.current)
      groupTimeoutRef.current = null
    }
  }, [])

  const resolvePlayerFromArrowPlayerId = useCallback((arrowPlayerId: string) => {
    return (
      players.find((p) =>
        p.id === arrowPlayerId ||
        `attack-${p.number}` === arrowPlayerId ||
        `defense-${p.number}` === arrowPlayerId ||
        `defence-${p.number}` === arrowPlayerId ||
        `${p.team}-${p.number}` === arrowPlayerId
      ) ?? null
    )
  }, [players])

  const getPassTarget = useCallback((passArrow: Arrow) => {
    if (!passArrow.receiverId) {
      return { x: passArrow.toX, y: passArrow.toY }
    }

    const receiver = players.find((p) =>
      p.id === passArrow.receiverId ||
      `attack-${p.number}` === passArrow.receiverId ||
      `defense-${p.number}` === passArrow.receiverId ||
      `defence-${p.number}` === passArrow.receiverId ||
      `${p.team}-${p.number}` === passArrow.receiverId
    )

    if (!receiver) return { x: passArrow.toX, y: passArrow.toY }

    const receiverRunArrow = arrows.find(
      (a) =>
        (a.playerId === receiver.id ||
          a.playerId === `attack-${receiver.number}` ||
          a.playerId === `defense-${receiver.number}` ||
          a.playerId === `defence-${receiver.number}` ||
          a.playerId === `${receiver.team}-${receiver.number}`) &&
        a.arrowType !== "pass"
    )

    if (receiverRunArrow) {
      const passTime = (passArrow as SequencedArrow).timestamp ?? 0
      const runTime = (receiverRunArrow as SequencedArrow).timestamp ?? 0

      if (passTime > runTime) {
        return { x: receiverRunArrow.toX, y: receiverRunArrow.toY }
      } else {
        return animatedPositionsRef.current[receiver.id] ?? { x: receiver.x, y: receiver.y }
      }
    }

    return animatedPositionsRef.current[receiver.id] ?? { x: receiver.x, y: receiver.y }
  }, [players, arrows])

  const buildGroupMotion = useCallback((group: SequencedArrow[]) => {
    const starts: Record<string, { x: number; y: number }> = {}
    const targets: Record<string, { x: number; y: number }> = {}
    let hasPassInGroup = false
    let kickCurve: KickCurve | null = null

    group.forEach((arrow) => {
      const player = players.find((p) =>
        arrow.playerId === p.id ||
        arrow.playerId === `attack-${p.number}` ||
        arrow.playerId === `defense-${p.number}` ||
        arrow.playerId === `defence-${p.number}` ||
        arrow.playerId === `${p.team}-${p.number}`
      )

      if (arrow.arrowType === "pass") {
        hasPassInGroup = true
        const passerPos = player ? getPlayerCurrentPos(player.id) : null
        starts.ball = animatedPositionsRef.current.ball ?? passerPos ?? { x: arrow.fromX, y: arrow.fromY }
        targets.ball = getPassTarget(arrow)
        return
      }
      if (arrow.arrowType === "kick") {
        hasPassInGroup = true
        const kickerPos = player ? getPlayerCurrentPos(player.id) : null
        const from = animatedPositionsRef.current.ball ?? kickerPos ?? { x: arrow.fromX, y: arrow.fromY }
        const to = { x: arrow.toX, y: arrow.toY }
        starts.ball = from
        targets.ball = to
        kickCurve = getKickCurve(from.x, from.y, to.x, to.y)
        return
      }

      if (player) {
        const playerStart = getPlayerCurrentPos(player.id)
        if (playerStart) {
          starts[player.id] = playerStart
          targets[player.id] = { x: arrow.toX, y: arrow.toY }
        }
      }
    })

    return { starts, targets, hasPassInGroup, kickCurve }
  }, [players, getPlayerCurrentPos, getPassTarget, getKickCurve])

  const prepareNextGroup = useCallback((group: SequencedArrow[], groupIndex: number) => {
    const { starts, targets, hasPassInGroup, kickCurve } = buildGroupMotion(group)
    kickCurveRef.current = kickCurve
    const groupStartTime = performance.now()
    overlappedGroupIndexRef.current = groupIndex

    const parallelTick = (timestamp: number) => {
      if (!isAnimatingRef.current) return
      const elapsed = timestamp - groupStartTime
      const duration = animationDurationRef.current
      const rawProgress = Math.min(elapsed / duration, 1)
      const progress = 1 - Math.pow(1 - rawProgress, 3)
      const newPositions: Record<string, { x: number; y: number }> = { ...animatedPositionsRef.current }

      Object.keys(targets).forEach((id) => {
        const start = starts[id]
        const target = targets[id]
        if (start && target) {
          const activeKickCurve = kickCurveRef.current
          if (id === "ball" && activeKickCurve) {
            const p = getBezierPoint(
              rawProgress,
              activeKickCurve.fromX,
              activeKickCurve.fromY,
              activeKickCurve.cp1x,
              activeKickCurve.cp1y,
              activeKickCurve.cp2x,
              activeKickCurve.cp2y,
              activeKickCurve.toX,
              activeKickCurve.toY
            )
            newPositions[id] = p
          } else {
            newPositions[id] = {
              x: start.x + (target.x - start.x) * progress,
              y: start.y + (target.y - start.y) * progress,
            }
          }
        }
      })

      animatedPositionsRef.current = newPositions
      setAnimatedPositions({ ...newPositions })

      if (rawProgress < 1) {
        overlapAnimationFrameRef.current = requestAnimationFrame(parallelTick)
      } else {
        Object.keys(targets).forEach((id) => {
          animatedPositionsRef.current[id] = targets[id]
        })
        if (hasPassInGroup && targets.ball) {
          if (ball) onBallDrag(targets.ball.x, targets.ball.y)
          delete animatedPositionsRef.current.ball
          kickCurveRef.current = null
        }
        setAnimatedPositions({ ...animatedPositionsRef.current })
      }
    }

    overlapAnimationFrameRef.current = requestAnimationFrame(parallelTick)
  }, [buildGroupMotion, ball, onBallDrag, getBezierPoint])

  const playNextGroup = useCallback(() => {
    const groups = animationGroupsRef.current
    const groupIndex = currentGroupRef.current

    if (groupIndex >= groups.length) {
      isAnimatingRef.current = false
      console.log("Animation complete")
      return
    }

    nextGroupStarted.current = false
    const currentGroup = groups[groupIndex]
    const { starts: groupStarts, targets: groupTargets, hasPassInGroup, kickCurve } = buildGroupMotion(currentGroup)
    kickCurveRef.current = kickCurve
    startPositionsRef.current = { ...startPositionsRef.current, ...groupStarts }
    targetPositionsRef.current = groupTargets
    animationStartTimeRef.current = performance.now()
    animationDurationRef.current = 2000 / (animationSpeed ?? 1)

    animationFrameRef.current = requestAnimationFrame((ts) =>
      animateGroupTick(ts, groupStarts, groupTargets, animationStartTimeRef.current, () => {
        Object.keys(targetPositionsRef.current).forEach((id) => {
          animatedPositionsRef.current[id] = targetPositionsRef.current[id]
        })
        if (hasPassInGroup && groupTargets.ball) {
          if (ball) {
            onBallDrag(groupTargets.ball.x, groupTargets.ball.y)
          }
          delete animatedPositionsRef.current.ball
          kickCurveRef.current = null
        }
        setAnimatedPositions({ ...animatedPositionsRef.current })
        currentGroupRef.current += 1
        if (overlappedGroupIndexRef.current === currentGroupRef.current) {
          currentGroupRef.current += 1
        }
        clearGroupTimeout()
        groupTimeoutRef.current = window.setTimeout(() => {
          playNextGroup()
        }, 300)
      }, (rawProgress) => {
        if (rawProgress >= 0.7 && !nextGroupStarted.current) {
          const nextGroup = animationGroupsRef.current[currentGroupRef.current + 1]
          if (!nextGroup) return
          const currentIds = new Set(Object.keys(targetPositionsRef.current))
          const nextIds = nextGroup.map((a) => (a.arrowType === "pass" ? "ball" : a.playerId))
          const hasConflict = nextIds.some((id) => currentIds.has(id))
          if (!hasConflict) {
            nextGroupStarted.current = true
            prepareNextGroup(nextGroup, currentGroupRef.current + 1)
          }
        }
      })
    )
  }, [ball, onBallDrag, animationSpeed, animateGroupTick, clearGroupTimeout, buildGroupMotion, prepareNextGroup])

  const handlePlay = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    clearGroupTimeout()

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
      return a._index - b._index
    })

    let lastTimestamp: number | null = null
    let generatedSequence = 0
    const sequencedArrows = sortedByTime.map((arrow) => {
      if (typeof arrow.sequence === "number") {
        generatedSequence = Math.max(generatedSequence, arrow.sequence)
        lastTimestamp = typeof arrow.timestamp === "number" ? arrow.timestamp : lastTimestamp
        return arrow
      }

      if (typeof arrow.timestamp === "number") {
        if (lastTimestamp === null || Math.abs(arrow.timestamp - lastTimestamp) >= 500) {
          generatedSequence += 1
        }
        lastTimestamp = arrow.timestamp
      } else {
        generatedSequence += 1
      }

      return { ...arrow, sequence: generatedSequence }
    })

    const sortedArrows = [...sequencedArrows].sort((a, b) => {
      const aSeq = a.sequence ?? Number.MAX_SAFE_INTEGER
      const bSeq = b.sequence ?? Number.MAX_SAFE_INTEGER
      if (aSeq !== bSeq) return aSeq - bSeq
      const aTs = a.timestamp ?? Number.MAX_SAFE_INTEGER
      const bTs = b.timestamp ?? Number.MAX_SAFE_INTEGER
      if (aTs !== bTs) return aTs - bTs
      return a._index - b._index
    })

    const grouped = sortedArrows.reduce<Record<number, SequencedArrow[]>>((acc, arrow) => {
      const seq = arrow.sequence ?? 1
      if (!acc[seq]) acc[seq] = []
      acc[seq].push(arrow)
      return acc
    }, {})

    animationGroupsRef.current = Object.keys(grouped)
      .map((key) => Number(key))
      .sort((a, b) => a - b)
      .map((key) => grouped[key] ?? [])

    currentGroupRef.current = 0
    nextGroupStarted.current = false
    overlappedGroupIndexRef.current = null
    animatedPositionsRef.current = {}
    setAnimatedPositions({})

    console.log("Play clicked - players:", players.length)
    console.log("Targets found:", sortedArrows.length)
    console.log("Sample player id:", players[0]?.id)
    console.log("Sample arrow playerId:", arrows[0]?.playerId)

    startPositionsRef.current = {}
    players.forEach((p) => {
      startPositionsRef.current[p.id] = { x: p.x, y: p.y }
    })

    isAnimatingRef.current = true
    playNextGroup()
  }, [players, arrows, clearGroupTimeout, playNextGroup])

  const handlePause = useCallback(() => {
    isAnimatingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    clearGroupTimeout()
  }, [clearGroupTimeout])

  const handleReset = useCallback(() => {
    isAnimatingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (overlapAnimationFrameRef.current) {
      cancelAnimationFrame(overlapAnimationFrameRef.current)
      overlapAnimationFrameRef.current = null
    }
    clearGroupTimeout()
    animatedPositionsRef.current = {}
    setAnimatedPositions({})
    currentGroupRef.current = 0
    nextGroupStarted.current = false
    overlappedGroupIndexRef.current = null
    animationGroupsRef.current = []
    kickCurveRef.current = null
  }, [clearGroupTimeout])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (overlapAnimationFrameRef.current) {
        cancelAnimationFrame(overlapAnimationFrameRef.current)
      }
      if (groupTimeoutRef.current !== null) {
        window.clearTimeout(groupTimeoutRef.current)
      }
      kickCurveRef.current = null
    }
  }, [])

  // SVG coordinate system: buffer zone adds 6 units on each side
  const BUFFER = 6
  const CANVAS_WIDTH = 70 + BUFFER * 2
  const CANVAS_HEIGHT = 120 + BUFFER * 2

  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.DragEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    return { 
      x: Math.max(1.5, Math.min(CANVAS_WIDTH - 1.5, x)), 
      y: Math.max(1.5, Math.min(CANVAS_HEIGHT - 1.5, y)) 
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer.getData("application/json")
    if (!data) return
    
    const dropData = JSON.parse(data)
    const { x, y } = getCanvasCoordinates(e)
    
    if (dropData.type === "ball") {
      onBallDrop(x, y)
    } else if (dropData.type === "phase") {
      onPhaseDrop(dropData.phase, x, y)
    } else if (dropData.type === "cone") {
      onConeDrop(x, y)
    } else {
      onPlayerDrop(dropData.id, x, y)
    }
  }, [getCanvasCoordinates, onPlayerDrop, onBallDrop, onPhaseDrop, onConeDrop])

  const handleFieldClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as SVGElement
    if (target.closest(".player-token") || target.closest(".ball-token") || target.closest(".phase-token") || target.closest(".cone-token") || target.closest(".label-token") || target.closest(".arrow-path") || target.closest(".arrow-handle")) return
    
    const { x, y } = getCanvasCoordinates(e)
    
    // In text mode, create a text label
    if (mode === "text") {
      onTextLabelCreate(x, y)
      return
    }
    
    // Deselect arrow if clicking on field in move mode
    if (mode === "move" && selectedArrowId) {
      onArrowSelect(null)
      return
    }

    if (mode === "draw" && arrowType === "pass" && passerSelected) {
      onPasserSelect(null)
      setHoverPassEndpoint(null)
      return
    }
    
    if (mode === "draw" && selectedPlayerId && arrowType !== "pass" && arrowType !== "kick") {
      const snapToRunEndpoint = (playerId: string, clickX: number, clickY: number) => {
        const normalizedPlayerId = playerId.replace("attack-", "")
        const playerRunArrows = arrows.filter((a) =>
          (a.playerId === playerId ||
            a.playerId === normalizedPlayerId ||
            playerId === a.playerId.replace("attack-", "")) &&
          a.arrowType !== "pass" &&
          a.arrowType !== "kick"
        )

        if (playerRunArrows.length === 0) return null

        const sortedRuns = [...playerRunArrows].sort(
          (a, b) => ((a as SequencedArrow).timestamp ?? 0) - ((b as SequencedArrow).timestamp ?? 0)
        )
        const lastRun = sortedRuns[sortedRuns.length - 1]
        const endpointDist = Math.hypot(clickX - lastRun.toX, clickY - lastRun.toY)
        if (endpointDist <= 5) {
          return { x: lastRun.toX, y: lastRun.toY }
        }
        return null
      }

      const snapStart = snapToRunEndpoint(selectedPlayerId, x, y)
      if (snapStart) {
        pendingRunSnapRef.current = { playerId: selectedPlayerId, start: snapStart }
      }
    }

    onFieldClick(x, y)
  }, [getCanvasCoordinates, onFieldClick, mode, selectedArrowId, onArrowSelect, onTextLabelCreate, arrowType, passerSelected, onPasserSelect, selectedPlayerId, arrows])

  const tryCreatePassToPoint = useCallback((toX: number, toY: number, receiverIdForArrow: string) => {
    if (!(mode === "draw" && arrowType === "pass" && passerSelected)) return false
    const passer = players.find((p) =>
      p.id === passerSelected ||
      `attack-${p.number}` === passerSelected ||
      `defense-${p.number}` === passerSelected ||
      `defence-${p.number}` === passerSelected ||
      `${p.team}-${p.number}` === passerSelected
    )
    if (!passer) return false

    const receiver = resolvePlayerFromArrowPlayerId(receiverIdForArrow)
    if (!receiver || receiver.id === passer.id) return false

    const calculatePassTarget = (
      receiverId: string,
      clickedToX: number,
      clickedToY: number,
      passTimestamp: number
    ) => {
      const targetReceiver = players.find((p) =>
        p.id === receiverId ||
        `attack-${p.number}` === receiverId ||
        `defense-${p.number}` === receiverId ||
        `defence-${p.number}` === receiverId
      )
      if (!targetReceiver) return { x: clickedToX, y: clickedToY }

      const receiverRunArrow = arrows.find(
        (a) =>
          (a.playerId === targetReceiver.id ||
            a.playerId === `attack-${targetReceiver.number}` ||
            a.playerId === `defense-${targetReceiver.number}` ||
            a.playerId === `defence-${targetReceiver.number}`) &&
          a.arrowType !== "pass"
      )

      if (receiverRunArrow) {
        const runTime = (receiverRunArrow as SequencedArrow).timestamp ?? 0
        if (passTimestamp > runTime) {
          return { x: receiverRunArrow.toX, y: receiverRunArrow.toY }
        } else {
          return { x: targetReceiver.x, y: targetReceiver.y }
        }
      }

      return { x: targetReceiver.x, y: targetReceiver.y }
    }

    const calculatePassStart = (
      passerId: string,
      passTimestamp: number
    ) => {
      const startPasser = players.find((p) =>
        p.id === passerId ||
        `attack-${p.number}` === passerId ||
        `defense-${p.number}` === passerId ||
        `defence-${p.number}` === passerId
      )
      if (!startPasser) return null

      const passerRunArrow = arrows.find(
        (a) =>
          (a.playerId === startPasser.id ||
            a.playerId === `attack-${startPasser.number}` ||
            a.playerId === `defense-${startPasser.number}` ||
            a.playerId === `defence-${startPasser.number}`) &&
          a.arrowType !== "pass"
      )

      if (passerRunArrow) {
        const runTime = (passerRunArrow as SequencedArrow).timestamp ?? 0
        if (passTimestamp > runTime) {
          return { x: passerRunArrow.toX, y: passerRunArrow.toY }
        }
      }

      return { x: startPasser.x, y: startPasser.y }
    }

    const now = Date.now()
    const passTarget = calculatePassTarget(receiverIdForArrow, toX, toY, now)
    const passStart = calculatePassStart(passerSelected, now)

    pendingPassSnapRef.current = {
      passerId: passerSelected,
      receiverId: receiverIdForArrow,
      start: passStart ?? { x: passer.x, y: passer.y },
      target: passTarget,
    }
    onCreatePassArrow(passerSelected, receiver.id)
    onPasserSelect(null)
    setHoverPassEndpoint(null)
    return true
  }, [mode, arrowType, passerSelected, players, arrows, onCreatePassArrow, onPasserSelect, resolvePlayerFromArrowPlayerId])

  const handlePassCanvasMouseDownCapture = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!(mode === "draw" && arrowType === "pass" && passerSelected)) return
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const xScale = rect.width / CANVAS_WIDTH
    const yScale = rect.height / CANVAS_HEIGHT

    for (const arrow of arrows) {
      if (arrow.arrowType === "pass") continue
      const endX = arrow.toX * xScale
      const endY = arrow.toY * yScale
      const dist = Math.hypot(clickX - endX, clickY - endY)
      if (dist < 30) {
        e.preventDefault()
        e.stopPropagation()
        if (tryCreatePassToPoint(arrow.toX, arrow.toY, arrow.playerId)) return
      }
    }

    for (const player of players) {
      const px = player.x * xScale
      const py = player.y * yScale
      const dist = Math.hypot(clickX - px, clickY - py)
      if (dist < 20) {
        const runArrow = arrows.find((a) =>
          (a.playerId === player.id ||
            a.playerId === `attack-${player.number}` ||
            a.playerId === `defense-${player.number}` ||
            a.playerId === `defence-${player.number}` ||
            a.playerId === `${player.team}-${player.number}`) &&
          a.arrowType !== "pass"
        )
        const targetX = runArrow ? runArrow.toX : player.x
        const targetY = runArrow ? runArrow.toY : player.y
        e.preventDefault()
        e.stopPropagation()
        if (tryCreatePassToPoint(targetX, targetY, player.id)) return
      }
    }
  }, [mode, arrowType, passerSelected, arrows, players, tryCreatePassToPoint])

  const handlePlayerMouseDown = useCallback((e: React.MouseEvent, player: FieldPlayer) => {
    e.stopPropagation()
    if (e.button !== 0) return
    
    if (mode === "draw") {
      if (arrowType === "pass") {
        onBallSelect(false)
        onArrowSelect(null)
        if (!passerSelected) {
          onPasserSelect(player.id)
          return
        }
        if (passerSelected === player.id) {
          onPasserSelect(null)
          setHoverPassEndpoint(null)
          return
        }
        const passer = players.find((p) =>
          p.id === passerSelected ||
          `attack-${p.number}` === passerSelected ||
          `defense-${p.number}` === passerSelected ||
          `defence-${p.number}` === passerSelected ||
          `${p.team}-${p.number}` === passerSelected
        )
        if (passer) {
          const calculatePassTarget = (
            receiverId: string,
            clickedToX: number,
            clickedToY: number,
            passTimestamp: number
          ) => {
            const targetReceiver = players.find((p) =>
              p.id === receiverId ||
              `attack-${p.number}` === receiverId ||
              `defense-${p.number}` === receiverId ||
              `defence-${p.number}` === receiverId
            )
            if (!targetReceiver) return { x: clickedToX, y: clickedToY }

            const receiverRunArrow = arrows.find(
              (a) =>
                (a.playerId === targetReceiver.id ||
                  a.playerId === `attack-${targetReceiver.number}` ||
                  a.playerId === `defense-${targetReceiver.number}` ||
                  a.playerId === `defence-${targetReceiver.number}`) &&
                a.arrowType !== "pass"
            )

            if (receiverRunArrow) {
              const runTime = (receiverRunArrow as SequencedArrow).timestamp ?? 0
              if (passTimestamp > runTime) {
                return { x: receiverRunArrow.toX, y: receiverRunArrow.toY }
              } else {
                return { x: targetReceiver.x, y: targetReceiver.y }
              }
            }

            return { x: targetReceiver.x, y: targetReceiver.y }
          }

          const calculatePassStart = (
            passerId: string,
            passTimestamp: number
          ) => {
            const startPasser = players.find((p) =>
              p.id === passerId ||
              `attack-${p.number}` === passerId ||
              `defense-${p.number}` === passerId ||
              `defence-${p.number}` === passerId
            )
            if (!startPasser) return null

            const passerRunArrow = arrows.find(
              (a) =>
                (a.playerId === startPasser.id ||
                  a.playerId === `attack-${startPasser.number}` ||
                  a.playerId === `defense-${startPasser.number}` ||
                  a.playerId === `defence-${startPasser.number}`) &&
                a.arrowType !== "pass"
            )

            if (passerRunArrow) {
              const runTime = (passerRunArrow as SequencedArrow).timestamp ?? 0
              if (passTimestamp > runTime) {
                return { x: passerRunArrow.toX, y: passerRunArrow.toY }
              }
            }

            return { x: startPasser.x, y: startPasser.y }
          }

          const now = Date.now()
          const passTarget = calculatePassTarget(player.id, player.x, player.y, now)
          const passStart = calculatePassStart(passerSelected, now)
          pendingPassSnapRef.current = {
            passerId: passerSelected,
            receiverId: player.id,
            start: passStart ?? { x: passer.x, y: passer.y },
            target: passTarget,
          }
        }
        onCreatePassArrow(passerSelected, player.id)
        setHoverPassEndpoint(null)
        return
      }
      onBallSelect(false)
      onArrowSelect(null)
      onPlayerSelect(selectedPlayerId === player.id ? null : player.id)
      return
    }

    if (mode === "move") {
      onArrowSelect(null)
    }

    onPlayerDragStart(player.id)

    const { x, y } = getCanvasCoordinates(e)
    draggingRef.current = {
      type: "player",
      id: player.id,
      offsetX: x - player.x,
      offsetY: y - player.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || draggingRef.current.type !== "player" || !svgRef.current) return
      
      const rect = svgRef.current.getBoundingClientRect()
      const newX = ((moveEvent.clientX - rect.left) / rect.width) * CANVAS_WIDTH - draggingRef.current.offsetX
      const newY = ((moveEvent.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - draggingRef.current.offsetY
      
      onPlayerDrag(
        draggingRef.current.id,
        Math.max(1.5, Math.min(CANVAS_WIDTH - 1.5, newX)),
        Math.max(1.5, Math.min(CANVAS_HEIGHT - 1.5, newY))
      )
    }
    
    const handleMouseUp = () => {
      draggingRef.current = null
      onPlayerDragEnd()
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }, [getCanvasCoordinates, onPlayerDrag, onPlayerDragStart, onPlayerDragEnd, mode, selectedPlayerId, onPlayerSelect, onBallSelect, onArrowSelect, arrowType, passerSelected, onPasserSelect, onCreatePassArrow, players, arrows])

  useEffect(() => {
    const pending = pendingPassSnapRef.current
    if (!pending) return

    const latestPassArrow = [...arrows]
      .reverse()
      .find((a) => a.arrowType === "pass" && a.playerId === pending.passerId)

    if (!latestPassArrow) return

    const updates: Partial<Arrow> = {}
    if (
      Math.abs(latestPassArrow.toX - pending.target.x) > 0.001 ||
      Math.abs(latestPassArrow.toY - pending.target.y) > 0.001
    ) {
      updates.toX = pending.target.x
      updates.toY = pending.target.y
    }
    if (
      Math.abs(latestPassArrow.fromX - pending.start.x) > 0.001 ||
      Math.abs(latestPassArrow.fromY - pending.start.y) > 0.001
    ) {
      updates.fromX = pending.start.x
      updates.fromY = pending.start.y
    }
    if (pending.receiverId && latestPassArrow.receiverId !== pending.receiverId) {
      updates.receiverId = pending.receiverId
    }
    if (Object.keys(updates).length > 0) {
      onArrowUpdate(latestPassArrow.id, updates)
    }
    pendingPassSnapRef.current = null
  }, [arrows, onArrowUpdate])

  useEffect(() => {
    const pending = pendingRunSnapRef.current
    if (!pending) return

    const latestRunArrow = [...arrows]
      .reverse()
      .find((a) =>
        a.arrowType !== "pass" &&
        a.arrowType !== "kick" &&
        (a.playerId === pending.playerId ||
          a.playerId === pending.playerId.replace("attack-", "") ||
          pending.playerId === a.playerId.replace("attack-", ""))
      )

    if (!latestRunArrow) return

    if (
      Math.abs(latestRunArrow.fromX - pending.start.x) > 0.001 ||
      Math.abs(latestRunArrow.fromY - pending.start.y) > 0.001
    ) {
      onArrowUpdate(latestRunArrow.id, { fromX: pending.start.x, fromY: pending.start.y })
    }

    pendingRunSnapRef.current = null
  }, [arrows, onArrowUpdate])

  const handleBallMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.button !== 0 || !ball) return
    
    if (mode === "draw") {
      onPlayerSelect(null)
      onArrowSelect(null)
      onBallSelect(!selectedBall)
      return
    }

    if (mode === "move") {
      onArrowSelect(null)
    }

    onBallDragStart()

    const { x, y } = getCanvasCoordinates(e)
    draggingRef.current = {
      type: "ball",
      id: "ball",
      offsetX: x - ball.x,
      offsetY: y - ball.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || draggingRef.current.type !== "ball" || !svgRef.current) return
      
      const rect = svgRef.current.getBoundingClientRect()
      const newX = ((moveEvent.clientX - rect.left) / rect.width) * CANVAS_WIDTH - draggingRef.current.offsetX
      const newY = ((moveEvent.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - draggingRef.current.offsetY
      
      onBallDrag(
        Math.max(1.5, Math.min(CANVAS_WIDTH - 1.5, newX)),
        Math.max(1.5, Math.min(CANVAS_HEIGHT - 1.5, newY))
      )
    }
    
    const handleMouseUp = () => {
      draggingRef.current = null
      onBallDragEnd()
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }, [getCanvasCoordinates, ball, mode, selectedBall, onBallSelect, onPlayerSelect, onBallDragStart, onBallDrag, onBallDragEnd, onArrowSelect])

  const handlePhaseMouseDown = useCallback((e: React.MouseEvent, phase: PhaseMarker) => {
    e.stopPropagation()
    if (e.button !== 0 || mode !== "move") return

    onArrowSelect(null)
    onPhaseDragStart(phase.id)

    const { x, y } = getCanvasCoordinates(e)
    draggingRef.current = {
      type: "phase",
      id: phase.id,
      offsetX: x - phase.x,
      offsetY: y - phase.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || draggingRef.current.type !== "phase" || !svgRef.current) return
      
      const rect = svgRef.current.getBoundingClientRect()
      const newX = ((moveEvent.clientX - rect.left) / rect.width) * CANVAS_WIDTH - draggingRef.current.offsetX
      const newY = ((moveEvent.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - draggingRef.current.offsetY
      
      onPhaseDrag(
        draggingRef.current.id,
        Math.max(1.5, Math.min(CANVAS_WIDTH - 1.5, newX)),
        Math.max(1.5, Math.min(CANVAS_HEIGHT - 1.5, newY))
      )
    }
    
    const handleMouseUp = () => {
      draggingRef.current = null
      onPhaseDragEnd()
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }, [getCanvasCoordinates, mode, onPhaseDragStart, onPhaseDrag, onPhaseDragEnd, onArrowSelect])

  const handleConeMouseDown = useCallback((e: React.MouseEvent, cone: ConeMarker) => {
    e.stopPropagation()
    if (e.button !== 0 || mode !== "move") return

    onArrowSelect(null)
    onConeDragStart(cone.id)

    const { x, y } = getCanvasCoordinates(e)
    draggingRef.current = {
      type: "cone",
      id: cone.id,
      offsetX: x - cone.x,
      offsetY: y - cone.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || draggingRef.current.type !== "cone" || !svgRef.current) return
      
      const rect = svgRef.current.getBoundingClientRect()
      const newX = ((moveEvent.clientX - rect.left) / rect.width) * CANVAS_WIDTH - draggingRef.current.offsetX
      const newY = ((moveEvent.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - draggingRef.current.offsetY
      
      onConeDrag(
        draggingRef.current.id,
        Math.max(1.5, Math.min(CANVAS_WIDTH - 1.5, newX)),
        Math.max(1.5, Math.min(CANVAS_HEIGHT - 1.5, newY))
      )
    }
    
    const handleMouseUp = () => {
      draggingRef.current = null
      onConeDragEnd()
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }, [getCanvasCoordinates, mode, onConeDragStart, onConeDrag, onConeDragEnd, onArrowSelect])

  const handleLabelMouseDown = useCallback((e: React.MouseEvent, label: TextLabel) => {
    e.stopPropagation()
    if (e.button !== 0 || mode !== "move") return

    onArrowSelect(null)
    onLabelDragStart(label.id)

    const { x, y } = getCanvasCoordinates(e)
    draggingRef.current = {
      type: "label",
      id: label.id,
      offsetX: x - label.x,
      offsetY: y - label.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || draggingRef.current.type !== "label" || !svgRef.current) return
      
      const rect = svgRef.current.getBoundingClientRect()
      const newX = ((moveEvent.clientX - rect.left) / rect.width) * CANVAS_WIDTH - draggingRef.current.offsetX
      const newY = ((moveEvent.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - draggingRef.current.offsetY
      
      onLabelDrag(
        draggingRef.current.id,
        Math.max(1.5, Math.min(CANVAS_WIDTH - 1.5, newX)),
        Math.max(1.5, Math.min(CANVAS_HEIGHT - 1.5, newY))
      )
    }
    
    const handleMouseUp = () => {
      draggingRef.current = null
      onLabelDragEnd()
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }, [getCanvasCoordinates, mode, onLabelDragStart, onLabelDrag, onLabelDragEnd, onArrowSelect])

  // Arrow click handler for selection in move mode
  const handleArrowClick = useCallback((e: React.MouseEvent, arrow: Arrow) => {
    e.stopPropagation()
    if (mode !== "move") return
    
    onPlayerSelect(null)
    onBallSelect(false)
    onArrowSelect(selectedArrowId === arrow.id ? null : arrow.id)
  }, [mode, selectedArrowId, onArrowSelect, onPlayerSelect, onBallSelect])

  // Arrow handle dragging
  const handleArrowHandleMouseDown = useCallback((e: React.MouseEvent, arrow: Arrow, handleType: "start" | "mid" | "end") => {
    e.stopPropagation()
    if (e.button !== 0 || mode !== "move") return

    const { x, y } = getCanvasCoordinates(e)
    const handlePos = handleType === "start" 
      ? { x: arrow.fromX, y: arrow.fromY }
      : handleType === "end"
      ? { x: arrow.toX, y: arrow.toY }
      : { x: (arrow.fromX + arrow.toX) / 2, y: (arrow.fromY + arrow.toY) / 2 }

    draggingRef.current = {
      type: `arrow-${handleType}` as "arrow-start" | "arrow-mid" | "arrow-end",
      id: arrow.id,
      offsetX: x - handlePos.x,
      offsetY: y - handlePos.y,
    }
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || !svgRef.current) return
      
      const rect = svgRef.current.getBoundingClientRect()
      const newX = Math.max(1.5, Math.min(CANVAS_WIDTH - 1.5, ((moveEvent.clientX - rect.left) / rect.width) * CANVAS_WIDTH - draggingRef.current.offsetX))
      const newY = Math.max(1.5, Math.min(CANVAS_HEIGHT - 1.5, ((moveEvent.clientY - rect.top) / rect.height) * CANVAS_HEIGHT - draggingRef.current.offsetY))
      
      if (draggingRef.current.type === "arrow-start") {
        onArrowUpdate(arrow.id, { fromX: newX, fromY: newY })
      } else if (draggingRef.current.type === "arrow-end") {
        onArrowUpdate(arrow.id, { toX: newX, toY: newY })
      } else if (draggingRef.current.type === "arrow-mid") {
        // Move the entire arrow
        const dx = newX - (arrow.fromX + arrow.toX) / 2
        const dy = newY - (arrow.fromY + arrow.toY) / 2
        onArrowUpdate(arrow.id, {
          fromX: arrow.fromX + dx,
          fromY: arrow.fromY + dy,
          toX: arrow.toX + dx,
          toY: arrow.toY + dy,
        })
      }
    }
    
    const handleMouseUp = () => {
      draggingRef.current = null
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }, [getCanvasCoordinates, mode, onArrowUpdate])

  const handleContextMenu = useCallback((e: React.MouseEvent, targetId: string, targetType: "player" | "ball" | "phase" | "cone" | "label") => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId,
      targetType,
    })
  }, [])

  const handleDeleteTarget = useCallback(() => {
    if (contextMenu.targetType === "player" && contextMenu.targetId) {
      onDeletePlayer(contextMenu.targetId)
    } else if (contextMenu.targetType === "ball") {
      onDeleteBall()
    } else if (contextMenu.targetType === "phase" && contextMenu.targetId) {
      onDeletePhase(contextMenu.targetId)
    } else if (contextMenu.targetType === "cone" && contextMenu.targetId) {
      onDeleteCone(contextMenu.targetId)
    } else if (contextMenu.targetType === "label" && contextMenu.targetId) {
      onDeleteLabel(contextMenu.targetId)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [contextMenu, onDeletePlayer, onDeleteBall, onDeletePhase, onDeleteCone, onDeleteLabel])

  const handleClearArrows = useCallback(() => {
    if (contextMenu.targetType === "player" && contextMenu.targetId) {
      onClearPlayerArrows(contextMenu.targetId)
    } else if (contextMenu.targetType === "ball") {
      onClearBallArrows()
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [contextMenu, onClearPlayerArrows, onClearBallArrows])

  const getTeamColor = (team: "attack" | "defense" | "ball") => {
    if (team === "ball") return "#EAB308"
    return team === "attack" ? teamColors.attack : teamColors.defense
  }

  // Generate grass stripe pattern (vertical stripes)
  const stripeWidth = 5
  const stripeCount = Math.ceil(70 / stripeWidth)

  // Render arrow based on type
  const renderArrow = (arrow: Arrow) => {
    const getArrowVisualStart = (currentArrow: Arrow) => {
      if (currentArrow.arrowType === "pass" || currentArrow.arrowType === "kick") {
        return { x: currentArrow.fromX, y: currentArrow.fromY }
      }

      const playerArrows = arrows
        .filter((a) =>
          a.id !== currentArrow.id &&
          a.arrowType !== "pass" &&
          a.arrowType !== "kick" &&
          (a.playerId === currentArrow.playerId ||
            a.playerId === currentArrow.playerId.replace("attack-", "") ||
            currentArrow.playerId === a.playerId.replace("attack-", ""))
        )
        .sort((a, b) => ((a as SequencedArrow).timestamp ?? 0) - ((b as SequencedArrow).timestamp ?? 0))

      const thisTime = (currentArrow as SequencedArrow).timestamp ?? 0
      const predecessors = playerArrows.filter((a) => ((a as SequencedArrow).timestamp ?? 0) < thisTime)

      if (predecessors.length > 0) {
        const lastPredecessor = predecessors[predecessors.length - 1]
        return { x: lastPredecessor.toX, y: lastPredecessor.toY }
      }

      return { x: currentArrow.fromX, y: currentArrow.fromY }
    }

    const visualStart = getArrowVisualStart(arrow)
    const fromX = visualStart.x
    const fromY = visualStart.y
    const color = arrow.arrowType === "pass" ? "#EAB308" : arrow.arrowType === "kick" ? "#F97316" : getTeamColor(arrow.team)
    const markerId = `arrowhead-${arrow.id}`
    const dx = arrow.toX - fromX
    const dy = arrow.toY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const isSelected = selectedArrowId === arrow.id
    const strokeWidth = isSelected ? "0.7" : "0.5"
    const glowFilter = isSelected ? "drop-shadow(0 0 2px rgba(255,255,255,0.8))" : undefined
    
    const midX = (fromX + arrow.toX) / 2
    const midY = (fromY + arrow.toY) / 2
    
    let pathElement: React.ReactNode = null
    
    switch (arrow.arrowType) {
      case "run":
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <line 
              x1={fromX} y1={fromY} x2={arrow.toX} y2={arrow.toY}
              stroke={color} strokeWidth={strokeWidth} markerEnd={`url(#${markerId})`} 
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
          </g>
        )
        break
      case "decoy":
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill="none" stroke={color} strokeWidth="0.5" />
              </marker>
            </defs>
            <line 
              x1={fromX} y1={fromY} x2={arrow.toX} y2={arrow.toY}
              stroke={color} strokeWidth={strokeWidth} strokeDasharray="1,0.5" markerEnd={`url(#${markerId})`}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
          </g>
        )
        break
      case "curve": {
        const curveMidX = midX
        const curveMidY = midY
        const perpX = -dy / dist * 6
        const perpY = dx / dist * 6
        const ctrlX = curveMidX + perpX
        const ctrlY = curveMidY + perpY
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path 
              d={`M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY} ${arrow.toX} ${arrow.toY}`}
              fill="none" stroke={color} strokeWidth={strokeWidth} markerEnd={`url(#${markerId})`}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
          </g>
        )
        break
      }
      case "pass": {
        const distance = Math.sqrt(dx * dx + dy * dy)
        const curveOffset = Math.min(distance * 0.15, 30)
        const safeDistance = Math.max(distance, 0.001)
        const ctrlX = midX - (dy / safeDistance) * curveOffset
        const ctrlY = midY + (dx / safeDistance) * curveOffset
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill="#EAB308" />
              </marker>
            </defs>
            <path 
              d={`M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY} ${arrow.toX} ${arrow.toY}`}
              fill="none" stroke="#EAB308" strokeWidth={strokeWidth} strokeDasharray="1,0.5" markerEnd={`url(#${markerId})`}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
          </g>
        )
        break
      }
      case "z-left": {
        const zMidX = fromX + dx * 0.5
        const zMidY = fromY + dy * 0.5
        const offsetX = -3
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path 
              d={`M ${fromX} ${fromY} L ${zMidX + offsetX} ${zMidY} L ${arrow.toX} ${arrow.toY}`}
              fill="none" stroke={color} strokeWidth={strokeWidth} markerEnd={`url(#${markerId})`}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
          </g>
        )
        break
      }
      case "z-right": {
        const zMidX = fromX + dx * 0.5
        const zMidY = fromY + dy * 0.5
        const offsetX = 3
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path 
              d={`M ${fromX} ${fromY} L ${zMidX + offsetX} ${zMidY} L ${arrow.toX} ${arrow.toY}`}
              fill="none" stroke={color} strokeWidth={strokeWidth} markerEnd={`url(#${markerId})`}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
          </g>
        )
        break
      }
      case "loop": {
        const loopRadius = Math.min(dist * 0.4, 4)
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path 
              d={`M ${fromX} ${fromY} A ${loopRadius} ${loopRadius} 0 1 0 ${midX} ${midY} L ${arrow.toX} ${arrow.toY}`}
              fill="none" stroke={color} strokeWidth={strokeWidth} markerEnd={`url(#${markerId})`}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
          </g>
        )
        break
      }
      case "short": {
        const shortDist = Math.min(dist, 3)
        const ratio = shortDist / dist
        const endX = fromX + dx * ratio
        const endY = fromY + dy * ratio
        const tickX = -dy / dist * 0.8
        const tickY = dx / dist * 0.8
        pathElement = (
          <g key={arrow.id}>
            <line 
              x1={fromX} y1={fromY} x2={endX} y2={endY}
              stroke={color} strokeWidth={isSelected ? "0.8" : "0.6"}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
            <line x1={endX - tickX} y1={endY - tickY} x2={endX + tickX} y2={endY + tickY}
              stroke={color} strokeWidth={strokeWidth} />
          </g>
        )
        break
      }
      case "kick": {
        const kickCurve = getKickCurve(arrow.fromX, arrow.fromY, arrow.toX, arrow.toY)
        const { cp1x, cp1y, cp2x, cp2y } = kickCurve
        const bezierMid = getBezierPoint(0.5, arrow.fromX, arrow.fromY, cp1x, cp1y, cp2x, cp2y, arrow.toX, arrow.toY)
        const angle = (Math.atan2(arrow.toY - arrow.fromY, arrow.toX - arrow.fromX) * 180) / Math.PI
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#F97316" />
              </marker>
            </defs>
            <path
              d={`M ${arrow.fromX} ${arrow.fromY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${arrow.toX} ${arrow.toY}`}
              fill="none" stroke="#F97316" strokeWidth={isSelected ? "0.9" : "0.8"} strokeDasharray="8 4" markerEnd={`url(#${markerId})`}
              style={{ filter: glowFilter }}
              className="arrow-path cursor-pointer"
              onClick={(e) => handleArrowClick(e, arrow)}
            />
            <ellipse
              cx={bezierMid.x}
              cy={bezierMid.y}
              rx="0.9"
              ry="0.55"
              fill="#F97316"
              transform={`rotate(${angle} ${bezierMid.x} ${bezierMid.y})`}
              className="pointer-events-none"
            />
          </g>
        )
        break
      }
      default:
        return null
    }
    
    // Add drag handles when arrow is selected
    if (isSelected && mode === "move") {
      return (
        <g key={arrow.id}>
          {pathElement}
          {/* Start handle */}
          <circle
            cx={arrow.fromX} cy={arrow.fromY} r="1"
            fill="white" stroke={color} strokeWidth="0.3"
            className="arrow-handle cursor-move"
            onMouseDown={(e) => handleArrowHandleMouseDown(e, arrow, "start")}
          />
          {/* Mid handle */}
          <circle
            cx={midX} cy={midY} r="1"
            fill="white" stroke={color} strokeWidth="0.3"
            className="arrow-handle cursor-move"
            onMouseDown={(e) => handleArrowHandleMouseDown(e, arrow, "mid")}
          />
          {/* End handle */}
          <circle
            cx={arrow.toX} cy={arrow.toY} r="1"
            fill="white" stroke={color} strokeWidth="0.3"
            className="arrow-handle cursor-move"
            onMouseDown={(e) => handleArrowHandleMouseDown(e, arrow, "end")}
          />
        </g>
      )
    }
    
    return pathElement
  }

  // Calculate screen position for arrow controls
  const getArrowControlsPosition = (arrow: Arrow) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const midX = (arrow.fromX + arrow.toX) / 2
    const midY = (arrow.fromY + arrow.toY) / 2
    return {
      x: rect.left + (midX / CANVAS_WIDTH) * rect.width,
      y: rect.top + (midY / CANVAS_HEIGHT) * rect.height,
    }
  }

  const selectedArrow = arrows.find(a => a.id === selectedArrowId)
  const arrowControlsPos = selectedArrow ? getArrowControlsPosition(selectedArrow) : null

  return (
    <div
      ref={containerRef}
      data-field-canvas
      className={`relative h-full w-full flex items-center justify-center ${
        clickToPlaceActive ? "ring-2 ring-primary/60 rounded-md animate-pulse" : ""
      }`}
    >
      {arrows.length > 0 && (
        <div className="absolute top-2 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-md border border-border bg-card/90 px-2 py-1">
          <button onClick={handlePlay} className="px-2 py-1 text-[10px] rounded border border-border bg-emerald-600/80 text-white">
            ▶ Play
          </button>
          <button onClick={handlePause} className="px-2 py-1 text-[10px] rounded border border-border bg-amber-500/90 text-black">
            ⏸ Pause
          </button>
          <button onClick={handleReset} className="px-2 py-1 text-[10px] rounded border border-border bg-muted/70 text-foreground">
            ⏹ Reset
          </button>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className={`max-w-full ${clickToPlaceActive ? "cursor-crosshair" : ""}`}
        style={{ 
          filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.3))",
          height: `${zoom}%`,
          maxHeight: "100%",
        }}
        preserveAspectRatio="xMidYMid meet"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDownCapture={handlePassCanvasMouseDownCapture}
        onClick={handleFieldClick}
      >
        {/* Buffer zone background (darker green) */}
        <rect x="0" y="0" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#14532d" />
        
        {/* Field background base */}
        <rect x={BUFFER} y={BUFFER} width="70" height="110" fill="#16a34a" />
        
        {/* Alternating grass stripes */}
        {Array.from({ length: stripeCount }).map((_, i) => (
          i % 2 === 0 && (
            <rect
              key={i}
              x={BUFFER + i * stripeWidth}
              y={BUFFER}
              width={stripeWidth}
              height="110"
              fill="#15803d"
              opacity="0.4"
            />
          )
        ))}
        
        {/* In-goal areas */}
        <rect x={BUFFER} y={BUFFER} width="70" height="10" fill="#15803d" />
        <rect x={BUFFER} y={BUFFER + 100} width="70" height="10" fill="#15803d" />
        
        {/* Boundary lines (touch lines and dead ball lines) */}
        <rect x={BUFFER} y={BUFFER} width="70" height="110" fill="none" stroke="white" strokeWidth="0.4" />
        
        {/* Try lines */}
        <line x1={BUFFER} y1={BUFFER + 10} x2={BUFFER + 70} y2={BUFFER + 10} stroke="white" strokeWidth="0.5" />
        <line x1={BUFFER} y1={BUFFER + 100} x2={BUFFER + 70} y2={BUFFER + 100} stroke="white" strokeWidth="0.5" />
        
        {/* 22m lines */}
        <line x1={BUFFER} y1={BUFFER + 30} x2={BUFFER + 70} y2={BUFFER + 30} stroke="white" strokeWidth="0.4" />
        <line x1={BUFFER} y1={BUFFER + 80} x2={BUFFER + 70} y2={BUFFER + 80} stroke="white" strokeWidth="0.4" />
        
        {/* Halfway line */}
        <line x1={BUFFER} y1={BUFFER + 55} x2={BUFFER + 70} y2={BUFFER + 55} stroke="white" strokeWidth="0.5" />
        
        {/* 10m lines (dashed) */}
        <line x1={BUFFER} y1={BUFFER + 45} x2={BUFFER + 70} y2={BUFFER + 45} stroke="white" strokeWidth="0.3" strokeDasharray="2,1" />
        <line x1={BUFFER} y1={BUFFER + 65} x2={BUFFER + 70} y2={BUFFER + 65} stroke="white" strokeWidth="0.3" strokeDasharray="2,1" />
        
        {/* 5m lines parallel to touch (dashed vertical lines) */}
        <line x1={BUFFER + 5} y1={BUFFER + 10} x2={BUFFER + 5} y2={BUFFER + 100} stroke="white" strokeWidth="0.2" strokeDasharray="1.5,1" />
        <line x1={BUFFER + 65} y1={BUFFER + 10} x2={BUFFER + 65} y2={BUFFER + 100} stroke="white" strokeWidth="0.2" strokeDasharray="1.5,1" />
        
        {/* 15m lines parallel to touch (dashed vertical lines) */}
        <line x1={BUFFER + 15} y1={BUFFER + 10} x2={BUFFER + 15} y2={BUFFER + 100} stroke="white" strokeWidth="0.15" strokeDasharray="1,1" opacity="0.6" />
        <line x1={BUFFER + 55} y1={BUFFER + 10} x2={BUFFER + 55} y2={BUFFER + 100} stroke="white" strokeWidth="0.15" strokeDasharray="1,1" opacity="0.6" />
        
        {/* Hash marks on 5m channel */}
        {[10, 30, 55, 80, 100].map(yPos => (
          <g key={`hash-5m-${yPos}`}>
            <line x1={BUFFER + 4} y1={BUFFER + yPos} x2={BUFFER + 6} y2={BUFFER + yPos} stroke="white" strokeWidth="0.2" />
            <line x1={BUFFER + 64} y1={BUFFER + yPos} x2={BUFFER + 66} y2={BUFFER + yPos} stroke="white" strokeWidth="0.2" />
          </g>
        ))}
        
        {/* Hash marks on 15m channel */}
        {[10, 30, 55, 80, 100].map(yPos => (
          <g key={`hash-15m-${yPos}`}>
            <line x1={BUFFER + 14} y1={BUFFER + yPos} x2={BUFFER + 16} y2={BUFFER + yPos} stroke="white" strokeWidth="0.2" />
            <line x1={BUFFER + 54} y1={BUFFER + yPos} x2={BUFFER + 56} y2={BUFFER + yPos} stroke="white" strokeWidth="0.2" />
          </g>
        ))}
        
        {/* Center circle */}
        <circle cx={BUFFER + 35} cy={BUFFER + 55} r="4" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Goal posts - Top (H-shape) */}
        <g>
          <line x1={BUFFER + 32.2} y1={BUFFER + 10} x2={BUFFER + 32.2} y2={BUFFER + 5} stroke="white" strokeWidth="0.4" />
          <line x1={BUFFER + 37.8} y1={BUFFER + 10} x2={BUFFER + 37.8} y2={BUFFER + 5} stroke="white" strokeWidth="0.4" />
          <line x1={BUFFER + 32.2} y1={BUFFER + 7} x2={BUFFER + 37.8} y2={BUFFER + 7} stroke="white" strokeWidth="0.4" />
        </g>
        
        {/* Goal posts - Bottom (H-shape) */}
        <g>
          <line x1={BUFFER + 32.2} y1={BUFFER + 100} x2={BUFFER + 32.2} y2={BUFFER + 105} stroke="white" strokeWidth="0.4" />
          <line x1={BUFFER + 37.8} y1={BUFFER + 100} x2={BUFFER + 37.8} y2={BUFFER + 105} stroke="white" strokeWidth="0.4" />
          <line x1={BUFFER + 32.2} y1={BUFFER + 103} x2={BUFFER + 37.8} y2={BUFFER + 103} stroke="white" strokeWidth="0.4" />
        </g>
        
        {/* Distance labels on left edge */}
        <text x={BUFFER - 0.5} y={BUFFER + 30.5} fontSize="2" fill="white" opacity="0.7" textAnchor="end" fontWeight="bold">22m</text>
        <text x={BUFFER - 0.5} y={BUFFER + 45.5} fontSize="2" fill="white" opacity="0.5" textAnchor="end">10m</text>
        <text x={BUFFER - 0.5} y={BUFFER + 55.5} fontSize="2" fill="white" opacity="0.7" textAnchor="end" fontWeight="bold">50m</text>
        <text x={BUFFER - 0.5} y={BUFFER + 65.5} fontSize="2" fill="white" opacity="0.5" textAnchor="end">10m</text>
        <text x={BUFFER - 0.5} y={BUFFER + 80.5} fontSize="2" fill="white" opacity="0.7" textAnchor="end" fontWeight="bold">22m</text>
        
        {/* In-goal area labels */}
        <text x={BUFFER + 35} y={BUFFER + 5.5} fontSize="2" fill="white" opacity="0.4" textAnchor="middle">IN-GOAL</text>
        <text x={BUFFER + 35} y={BUFFER + 106} fontSize="2" fill="white" opacity="0.4" textAnchor="middle">IN-GOAL</text>

        {/* Movement arrows */}
        {arrows.map(renderArrow)}
        {mode === "draw" && arrowType === "pass" && hoverPassEndpoint && (
          <g className="pointer-events-none" transform={`translate(${hoverPassEndpoint.x}, ${hoverPassEndpoint.y})`}>
            <circle r="2.1" fill="none" stroke="#EAB308" strokeWidth="0.2" strokeDasharray="0.6,0.4" opacity="0.9" />
            <circle r="0.35" fill="#EAB308" opacity="0.9" />
          </g>
        )}

        {/* Cone markers */}
        {cones.map((cone) => (
          <g
            key={cone.id}
            className={`cone-token ${mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
            transform={`translate(${cone.x}, ${cone.y})`}
            onMouseDown={(e) => handleConeMouseDown(e, cone)}
            onContextMenu={(e) => handleContextMenu(e, cone.id, "cone")}
          >
            <polygon
              points="0,-1.2 1,-0.4 0.6,1 -0.6,1 -1,-0.4"
              fill="#F97316"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.15"
            />
          </g>
        ))}

        {/* Ball token */}
        {(() => {
          const animatedBall = animatedPositions["ball"]
          const ballRenderPos = animatedBall ?? (ball ? { x: ball.x, y: ball.y } : null)
          if (!ballRenderPos) return null

          if (ball) {
            return (
              <g
                className={`ball-token ${mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                transform={`translate(${ballRenderPos.x}, ${ballRenderPos.y})`}
                onMouseDown={handleBallMouseDown}
                onContextMenu={(e) => handleContextMenu(e, "ball", "ball")}
              >
                <ellipse
                  rx="1.2"
                  ry="0.8"
                  fill="#EAB308"
                  stroke={selectedBall ? "#ffffff" : "rgba(0,0,0,0.3)"}
                  strokeWidth={selectedBall ? "0.3" : "0.1"}
                  className="transition-all"
                />
                <text
                  y="0.25"
                  fontSize="0.5"
                  fill="#000"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none font-bold select-none"
                >
                  BALL
                </text>
              </g>
            )
          }

          return (
            <g className="pointer-events-none" transform={`translate(${ballRenderPos.x}, ${ballRenderPos.y})`}>
              <ellipse rx="1.2" ry="0.8" fill="#EAB308" stroke="rgba(0,0,0,0.3)" strokeWidth="0.1" />
            </g>
          )
        })()}

        {/* Player tokens - 16px = ~1.6 units at this scale */}
        {players.map((player) => {
          const renderPos = animatedPositionsRef.current[player.id]
            ?? animatedPositions[player.id]
            ?? { x: player.x, y: player.y }
          return (
          <g
            key={player.id}
            className={`player-token ${
              mode === "move"
                ? "cursor-grab active:cursor-grabbing"
                : mode === "draw" && arrowType === "pass" && passerSelected && passerSelected !== player.id
                  ? "cursor-crosshair"
                  : "cursor-pointer"
            }`}
            transform={`translate(${renderPos.x}, ${renderPos.y})`}
            onMouseDown={(e) => handlePlayerMouseDown(e, player)}
            onMouseEnter={() => {
              if (mode === "draw" && arrowType === "pass" && passerSelected) {
                const passer = players.find((p) =>
                  p.id === passerSelected ||
                  `attack-${p.number}` === passerSelected ||
                  `defense-${p.number}` === passerSelected ||
                  `defence-${p.number}` === passerSelected ||
                  `${p.team}-${p.number}` === passerSelected
                )
                if (!passer) return
                const target = getPassTarget({
                  id: "hover",
                  playerId: passer.id,
                  team: passer.team,
                  fromX: passer.x,
                  fromY: passer.y,
                  toX: player.x,
                  toY: player.y,
                  arrowType: "pass",
                  receiverId: player.id,
                })
                setHoverPassEndpoint(target)
              }
            }}
            onMouseLeave={() => {
              if (mode === "draw" && arrowType === "pass") {
                setHoverPassEndpoint(null)
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, player.id, "player")}
          >
            <circle
              r="1.6"
              fill={getTeamColor(player.team)}
              stroke={selectedPlayerId === player.id ? "#ffffff" : "rgba(0,0,0,0.3)"}
              strokeWidth={selectedPlayerId === player.id ? "0.3" : "0.1"}
              className="transition-all"
            />
            {mode === "draw" && arrowType === "pass" && passerSelected === player.id && (
              <circle r="2.2" fill="none" stroke="#EAB308" strokeWidth="0.25" className="animate-pulse" />
            )}
            <text
              y="0.1"
              fontSize="1"
              fill="white"
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none font-bold select-none"
            >
              {player.number}
            </text>
            <text
              y="1.1"
              fontSize="0.7"
              fill="white"
              textAnchor="middle"
              className="pointer-events-none select-none"
              opacity="0.9"
            >
              {player.abbr}
            </text>
          </g>
          )
        })}
        {mode === "draw" && arrowType === "pass" && passerSelected &&
          arrows
            .filter((a) => a.arrowType !== "pass")
            .map((arrow) => (
              <g key={`endpoint-${arrow.id}`}>
                <circle
                  cx={arrow.toX}
                  cy={arrow.toY}
                  r="4.5"
                  fill="transparent"
                  style={{ cursor: "crosshair" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    tryCreatePassToPoint(arrow.toX, arrow.toY, arrow.playerId)
                  }}
                />
                <circle
                  cx={arrow.toX}
                  cy={arrow.toY}
                  r="1.4"
                  fill="rgba(234, 179, 8, 0.4)"
                  stroke="#EAB308"
                  strokeWidth="0.35"
                  style={{ cursor: "crosshair", pointerEvents: "none" }}
                />
              </g>
            ))}

        {/* Phase markers */}
        {phases.map((phase) => (
          <g
            key={phase.id}
            className={`phase-token ${mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
            transform={`translate(${phase.x}, ${phase.y})`}
            onMouseDown={(e) => handlePhaseMouseDown(e, phase)}
            onContextMenu={(e) => handleContextMenu(e, phase.id, "phase")}
          >
            <circle r="1.4" fill="white" stroke="rgba(0,0,0,0.4)" strokeWidth="0.15" />
            <text
              y="0.15"
              fontSize="1.2"
              fill="#000"
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none font-bold select-none"
            >
              {phase.phase}
            </text>
          </g>
        ))}

        {/* Text labels */}
        {labels.map((label) => (
          <g
            key={label.id}
            className={`label-token ${mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
            transform={`translate(${label.x}, ${label.y})`}
            onMouseDown={(e) => handleLabelMouseDown(e, label)}
            onContextMenu={(e) => handleContextMenu(e, label.id, "label")}
          >
            <rect
              x={-label.text.length * 0.35 - 0.5}
              y="-1.2"
              width={label.text.length * 0.7 + 1}
              height="2"
              rx="0.4"
              fill="rgba(0,0,0,0.7)"
            />
            <text
              y="0.2"
              fontSize="1.2"
              fill="white"
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none select-none"
            >
              {label.text}
            </text>
          </g>
        ))}

        {/* Legend at bottom of field */}
        <g transform={`translate(${BUFFER + 2}, ${CANVAS_HEIGHT - 4})`}>
          <rect x="-1" y="-2" width="68" height="3.5" rx="0.5" fill="rgba(0,0,0,0.5)" />
          {ARROW_TYPES.slice(0, 4).map((at, i) => (
            <g key={at.type} transform={`translate(${i * 17}, 0)`}>
              <text x="0" y="0.5" fontSize="1" fill="white" className="select-none">{at.label}</text>
            </g>
          ))}
          {ARROW_TYPES.slice(4).map((at, i) => (
            <g key={at.type} transform={`translate(${i * 17}, 1.5)`}>
              <text x="0" y="0.5" fontSize="1" fill="white" className="select-none">{at.label}</text>
            </g>
          ))}
          <g transform="translate(55, -0.55)">
            <path d="M 0 0.4 C 1.1 -0.4 1.7 1.2 2.8 0.4" fill="none" stroke="#F97316" strokeWidth="0.35" strokeDasharray="1.2 0.6" />
            <text x="3.3" y="0.7" fontSize="1" fill="white" className="select-none">Kick</text>
          </g>
        </g>
      </svg>
      
      {/* Arrow controls popup - positioned near arrow midpoint */}
      {selectedArrowId && selectedArrow && arrowControlsPos && mode === "move" && (
        <div
          className="fixed z-50 flex items-center gap-1 bg-card border border-border rounded-md shadow-lg p-1"
          style={{ 
            left: arrowControlsPos.x + 15, 
            top: arrowControlsPos.y - 15,
          }}
        >
          <button
            onClick={() => onArrowDelete(selectedArrowId)}
            className="p-1 rounded hover:bg-destructive/20 text-destructive"
            title="Delete Arrow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative arrow-type-dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setArrowEdit(prev => ({ ...prev, showTypeDropdown: !prev.showTypeDropdown }))
              }}
              className="px-2 py-1 text-[10px] rounded hover:bg-muted flex items-center gap-1"
              title="Change Arrow Type"
            >
              {ARROW_TYPES.find(a => a.type === selectedArrow.arrowType)?.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {arrowEdit.showTypeDropdown && (
              <div className="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-md shadow-lg py-1 min-w-[120px]">
                {ARROW_TYPES.map(at => (
                  <button
                    key={at.type}
                    onClick={() => {
                      onArrowTypeChange(selectedArrowId, at.type)
                      setArrowEdit(prev => ({ ...prev, showTypeDropdown: false }))
                    }}
                    className={`w-full px-3 py-1 text-left text-[10px] hover:bg-muted ${
                      selectedArrow.arrowType === at.type ? "bg-muted font-medium" : ""
                    }`}
                  >
                    {at.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-card border border-border rounded-md shadow-lg py-1 z-50 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleDeleteTarget}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors text-destructive"
          >
            Delete {
              contextMenu.targetType === "player" ? "Player" : 
              contextMenu.targetType === "ball" ? "Ball" : 
              contextMenu.targetType === "cone" ? "Cone" :
              contextMenu.targetType === "label" ? "Label" :
              "Phase"
            }
          </button>
          {(contextMenu.targetType === "player" || contextMenu.targetType === "ball") && (
            <button
              onClick={handleClearArrows}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors text-foreground"
            >
              Clear Arrows
            </button>
          )}
        </div>
      )}
      
      {/* Instructions overlay */}
      {mode === "draw" && arrowType === "pass" && passerSelected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-md text-sm text-foreground border border-border">
          Now click the receiver
        </div>
      )}
      {mode === "draw" && (selectedPlayerId || selectedBall) && (
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-md text-sm text-foreground border border-border">
          Click on the field to draw {arrowType} arrow
        </div>
      )}
      
      {mode === "text" && (
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-md text-sm text-foreground border border-border">
          Click anywhere on the field to add a text label
        </div>
      )}
    </div>
  )
}
