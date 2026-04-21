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
  isAnimating?: boolean
  isPaused?: boolean
  animationSpeed?: 0.5 | 1 | 2
  onAnimationComplete?: () => void
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
  isAnimating = false,
  isPaused = false,
  animationSpeed = 1,
  onAnimationComplete,
}: RugbyFieldProps) {
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
  const [trailPositions, setTrailPositions] = useState<Record<string, Array<{ x: number; y: number }>>>({})
  const trailRef = useRef<Record<string, Array<{ x: number; y: number }>>>({})
  const [decoyActivePlayers, setDecoyActivePlayers] = useState<Record<string, boolean>>({})
  const rafRef = useRef<number | null>(null)
  const animationRef = useRef<{
    rafId: number | null
    startTime: number
    pausedElapsed: number
    durationPerSegment: number
    playerTracks: Record<string, Array<{ fromX: number; fromY: number; toX: number; toY: number; arrowType: ArrowType }>>
    ballTrack: Array<{ fromX: number; fromY: number; toX: number; toY: number }>
    completed: boolean
  } | null>(null)

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

  useEffect(() => {
    const getPointOnPath = (
      segments: Array<{ fromX: number; fromY: number; toX: number; toY: number; arrowType: ArrowType }> | undefined,
      index: number,
      t: number
    ) => {
      if (!segments || segments.length === 0) return { x: 0, y: 0 }
      const segment = segments[Math.min(index, segments.length - 1)]
      if (!segment) return { x: 0, y: 0 }
      const { fromX, fromY, toX, toY, arrowType } = segment
      const dx = toX - fromX
      const dy = toY - fromY
      const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy))

      if (arrowType === "curve") {
        const midX = (fromX + toX) / 2
        const midY = (fromY + toY) / 2
        const perpX = (-dy / dist) * 6
        const perpY = (dx / dist) * 6
        const ctrlX = midX + perpX
        const ctrlY = midY + perpY
        const oneMinusT = 1 - t
        return {
          x: oneMinusT * oneMinusT * fromX + 2 * oneMinusT * t * ctrlX + t * t * toX,
          y: oneMinusT * oneMinusT * fromY + 2 * oneMinusT * t * ctrlY + t * t * toY,
        }
      }

      if (arrowType === "z-left" || arrowType === "z-right") {
        const zMidX = fromX + dx * 0.5 + (arrowType === "z-left" ? -3 : 3)
        const zMidY = fromY + dy * 0.5
        if (t < 0.5) {
          const t2 = t * 2
          return {
            x: fromX + (zMidX - fromX) * t2,
            y: fromY + (zMidY - fromY) * t2,
          }
        }
        const t2 = (t - 0.5) * 2
        return {
          x: zMidX + (toX - zMidX) * t2,
          y: zMidY + (toY - zMidY) * t2,
        }
      }

      if (arrowType === "loop") {
        const midX = (fromX + toX) / 2
        const midY = (fromY + toY) / 2
        const perpX = -dy / dist
        const perpY = dx / dist
        const radius = Math.min(dist * 0.35, 5)
        return {
          x: fromX + dx * t + Math.sin(t * Math.PI) * perpX * radius,
          y: fromY + dy * t + Math.sin(t * Math.PI) * perpY * radius,
        }
      }

      return {
        x: fromX + dx * t,
        y: fromY + dy * t,
      }
    }

    const buildTracks = () => {
      const playerTracks: Record<string, Array<{ fromX: number; fromY: number; toX: number; toY: number; arrowType: ArrowType }>> = {}
      const playerById = new Map(players.map((p) => [p.id, p]))

      players.forEach((player) => {
        const segments = arrows
          .filter((a) => a.playerId === player.id && a.arrowType !== "pass")
          .map((a, idx, arr) => {
            if (idx === 0) {
              return { fromX: player.x, fromY: player.y, toX: a.toX, toY: a.toY, arrowType: a.arrowType }
            }
            const prev = arr[idx - 1]
            return { fromX: prev.toX, fromY: prev.toY, toX: a.toX, toY: a.toY, arrowType: a.arrowType }
          })
        if (segments.length > 0) playerTracks[player.id] = segments
      })

      const ballTrack = ball
        ? arrows
            .filter((a) => a.arrowType === "pass" && (a.playerId === "ball" || playerById.has(a.playerId)))
            .map((a, idx, arr) => {
              if (idx === 0) return { fromX: ball.x, fromY: ball.y, toX: a.toX, toY: a.toY }
              const prev = arr[idx - 1]
              return { fromX: prev.toX, fromY: prev.toY, toX: a.toX, toY: a.toY }
            })
        : []

      return { playerTracks, ballTrack }
    }

    const cancelFrame = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      const currentAnimation = animationRef.current
      if (currentAnimation && currentAnimation.rafId !== null) {
        currentAnimation.rafId = null
      }
    }

    if (!isAnimating || isPaused) {
      cancelFrame()
      const currentAnimation = animationRef.current
      if (currentAnimation && isPaused) {
        currentAnimation.pausedElapsed = performance.now() - currentAnimation.startTime
      }
      return
    }

    if (!animationRef.current || animationRef.current.completed) {
      const { playerTracks, ballTrack } = buildTracks()
      animationRef.current = {
        rafId: null,
        startTime: performance.now(),
        pausedElapsed: 0,
        durationPerSegment: 2000 / animationSpeed,
        playerTracks,
        ballTrack,
        completed: false,
      }
      setTrailPositions({})
      trailRef.current = {}
      setDecoyActivePlayers({})
    } else {
      animationRef.current.durationPerSegment = 2000 / animationSpeed
      animationRef.current.startTime = performance.now() - animationRef.current.pausedElapsed
    }

    const tick = (now: number) => {
      if (!animationRef.current) return
      const animation = animationRef.current
      const elapsed = now - animation.startTime
      let completeCount = 0
      const activeDecoys: Record<string, boolean> = {}
      const nextTrail: Record<string, Array<{ x: number; y: number }>> = {}
      const animationState = Object.entries(animation.playerTracks)
      if (animationState.length === 0 && animation.ballTrack.length === 0) {
        animation.completed = true
        setDecoyActivePlayers({})
        onAnimationComplete?.()
        return
      }

      animationState.forEach(([playerId, segments]) => {
        if (!segments || segments.length === 0) {
          completeCount += 1
          return
        }
        const totalDuration = segments.length * animation.durationPerSegment
        const clampedElapsed = Math.min(elapsed, totalDuration)
        const rawSegIndex = Math.floor(clampedElapsed / animation.durationPerSegment)
        if (rawSegIndex >= segments.length) {
          completeCount += 1
          return
        }
        const segIndex = Math.min(segments.length - 1, rawSegIndex)
        const segStart = segIndex * animation.durationPerSegment
        const localT = Math.min(1, (clampedElapsed - segStart) / animation.durationPerSegment)
        const segment = segments[segIndex]
        if (!segment) {
          completeCount += 1
          return
        }
        const point = getPointOnPath(segments, segIndex, localT)

        onPlayerDrag(playerId, point.x, point.y)

        const existingTrail = trailRef.current[playerId] || []
        nextTrail[playerId] = [...existingTrail, { x: point.x, y: point.y }].slice(-6)
        if (segment.arrowType === "decoy") activeDecoys[playerId] = true

        if (elapsed >= totalDuration) completeCount += 1
      })

      if (animation.ballTrack.length > 0) {
        const totalDuration = animation.ballTrack.length * animation.durationPerSegment
        const clampedElapsed = Math.min(elapsed, totalDuration)
        const rawSegIndex = Math.floor(clampedElapsed / animation.durationPerSegment)
        if (rawSegIndex >= animation.ballTrack.length) {
          completeCount += 1
        } else {
          const segIndex = Math.min(animation.ballTrack.length - 1, rawSegIndex)
        const segStart = segIndex * animation.durationPerSegment
        const localT = Math.min(1, (clampedElapsed - segStart) / animation.durationPerSegment)
        const seg = animation.ballTrack[segIndex]
          if (seg) {
            onBallDrag(seg.fromX + (seg.toX - seg.fromX) * localT, seg.fromY + (seg.toY - seg.fromY) * localT)
          }
        if (elapsed >= totalDuration) completeCount += 1
        }
      }

      setTrailPositions(nextTrail)
      trailRef.current = nextTrail
      setDecoyActivePlayers(activeDecoys)

      const expectedComplete = Object.keys(animation.playerTracks).length + (animation.ballTrack.length > 0 ? 1 : 0)
      if (expectedComplete === 0 || completeCount >= expectedComplete) {
        animation.completed = true
        animation.rafId = null
        setDecoyActivePlayers({})
        onAnimationComplete?.()
        return
      }

      animation.rafId = requestAnimationFrame(tick)
      rafRef.current = animation.rafId
    }

    animationRef.current.rafId = requestAnimationFrame(tick)
    rafRef.current = animationRef.current.rafId

    return () => cancelFrame()
  }, [isAnimating, isPaused, animationSpeed, arrows, players, ball, onPlayerDrag, onBallDrag, onAnimationComplete])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
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
      return
    }
    
    onFieldClick(x, y)
  }, [getCanvasCoordinates, onFieldClick, mode, selectedArrowId, onArrowSelect, onTextLabelCreate, arrowType, passerSelected, onPasserSelect])

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
          return
        }
        onCreatePassArrow(passerSelected, player.id)
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
  }, [getCanvasCoordinates, onPlayerDrag, onPlayerDragStart, onPlayerDragEnd, mode, selectedPlayerId, onPlayerSelect, onBallSelect, onArrowSelect, arrowType, passerSelected, onPasserSelect, onCreatePassArrow])

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
    const color = arrow.arrowType === "pass" ? "#EAB308" : getTeamColor(arrow.team)
    const markerId = `arrowhead-${arrow.id}`
    const dx = arrow.toX - arrow.fromX
    const dy = arrow.toY - arrow.fromY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const isSelected = selectedArrowId === arrow.id
    const strokeWidth = isSelected ? "0.7" : "0.5"
    const glowFilter = isSelected ? "drop-shadow(0 0 2px rgba(255,255,255,0.8))" : undefined
    
    const midX = (arrow.fromX + arrow.toX) / 2
    const midY = (arrow.fromY + arrow.toY) / 2
    
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
              x1={arrow.fromX} y1={arrow.fromY} x2={arrow.toX} y2={arrow.toY}
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
              x1={arrow.fromX} y1={arrow.fromY} x2={arrow.toX} y2={arrow.toY}
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
              d={`M ${arrow.fromX} ${arrow.fromY} Q ${ctrlX} ${ctrlY} ${arrow.toX} ${arrow.toY}`}
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
              d={`M ${arrow.fromX} ${arrow.fromY} Q ${ctrlX} ${ctrlY} ${arrow.toX} ${arrow.toY}`}
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
        const zMidX = arrow.fromX + dx * 0.5
        const zMidY = arrow.fromY + dy * 0.5
        const offsetX = -3
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path 
              d={`M ${arrow.fromX} ${arrow.fromY} L ${zMidX + offsetX} ${zMidY} L ${arrow.toX} ${arrow.toY}`}
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
        const zMidX = arrow.fromX + dx * 0.5
        const zMidY = arrow.fromY + dy * 0.5
        const offsetX = 3
        pathElement = (
          <g key={arrow.id}>
            <defs>
              <marker id={markerId} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path 
              d={`M ${arrow.fromX} ${arrow.fromY} L ${zMidX + offsetX} ${zMidY} L ${arrow.toX} ${arrow.toY}`}
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
              d={`M ${arrow.fromX} ${arrow.fromY} A ${loopRadius} ${loopRadius} 0 1 0 ${midX} ${midY} L ${arrow.toX} ${arrow.toY}`}
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
        const endX = arrow.fromX + dx * ratio
        const endY = arrow.fromY + dy * ratio
        const tickX = -dy / dist * 0.8
        const tickY = dx / dist * 0.8
        pathElement = (
          <g key={arrow.id}>
            <line 
              x1={arrow.fromX} y1={arrow.fromY} x2={endX} y2={endY}
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
      className={`relative h-full w-full flex items-center justify-center ${
        clickToPlaceActive ? "ring-2 ring-primary/60 rounded-md animate-pulse" : ""
      }`}
    >
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
        {ball && (
          <g
            className={`ball-token ${mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
            transform={`translate(${ball.x}, ${ball.y})`}
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
        )}

        {/* Player motion trails during animation */}
        {Object.entries(trailPositions).map(([playerId, points]) =>
          points.map((pt, index) => (
            <circle
              key={`${playerId}-trail-${index}`}
              cx={pt.x}
              cy={pt.y}
              r="0.9"
              fill="rgba(255,255,255,0.35)"
              opacity={(index + 1) / (points.length + 1)}
            />
          ))
        )}

        {/* Player tokens - 16px = ~1.6 units at this scale */}
        {players.map((player) => (
          <g
            key={player.id}
            className={`player-token ${
              mode === "move"
                ? "cursor-grab active:cursor-grabbing"
                : mode === "draw" && arrowType === "pass" && passerSelected && passerSelected !== player.id
                  ? "cursor-crosshair"
                  : "cursor-pointer"
            }`}
            transform={`translate(${player.x}, ${player.y})`}
            onMouseDown={(e) => handlePlayerMouseDown(e, player)}
            onContextMenu={(e) => handleContextMenu(e, player.id, "player")}
            opacity={decoyActivePlayers[player.id] ? 0.6 : 1}
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
