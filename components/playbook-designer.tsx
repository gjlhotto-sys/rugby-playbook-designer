"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { RugbyField } from "./rugby-field"
import { PlaybookSidebar, type SidebarPlacementToken } from "./playbook-sidebar"
import { Move, Pencil, Undo2, ChevronDown } from "lucide-react"
import type { FieldPlayer, Arrow, InteractionMode, TeamColors, UndoAction, SavedPlay, PlayType, ArrowType, BallToken, PhaseMarker, ConeMarker, TextLabel } from "@/lib/types"
import { RUGBY_POSITIONS, ARROW_TYPES } from "@/lib/types"
import { generatePlayNotes } from "@/lib/generate-notes"

const STORAGE_KEY = "rugby-playbook"
const BUFFER = 6
const FIELD_WIDTH = 70
const FIELD_HEIGHT = 110

export function PlaybookDesigner() {
  const [fieldPlayers, setFieldPlayers] = useState<FieldPlayer[]>([])
  const [arrows, setArrows] = useState<Arrow[]>([])
  const [ball, setBall] = useState<BallToken | null>(null)
  const [phases, setPhases] = useState<PhaseMarker[]>([])
  const [cones, setCones] = useState<ConeMarker[]>([])
  const [labels, setLabels] = useState<TextLabel[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [selectedBall, setSelectedBall] = useState(false)
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null)
  const [mode, setMode] = useState<InteractionMode>("move")
  const [arrowType, setArrowType] = useState<ArrowType>("run")
  const [passerSelected, setPasserSelected] = useState<string | null>(null)
  const [selectedPlacementToken, setSelectedPlacementToken] = useState<SidebarPlacementToken | null>(null)
  const [playName, setPlayName] = useState("")
  const [playType, setPlayType] = useState<PlayType>("Free Play")
  const [notes, setNotes] = useState("")
  const [teamColors, setTeamColors] = useState<TeamColors>({
    attack: "#3B82F6",
    defense: "#EF4444",
  })
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const [savedPlays, setSavedPlays] = useState<SavedPlay[]>([])
  const [arrowDropdownOpen, setArrowDropdownOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState<0.5 | 1 | 2>(1)
  const [hasCompletedAnimation, setHasCompletedAnimation] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [startPositions, setStartPositions] = useState<{
    players: Array<{ id: string; x: number; y: number }>
    ball: { x: number; y: number } | null
  } | null>(null)
  
  // Track drag start state for undo
  const dragStartRef = useRef<{ type: "player" | "ball" | "phase"; id: string; x: number; y: number; arrows: Arrow[] } | null>(null)
  const fieldContainerRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  // Load saved plays from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSavedPlays(parsed)
        }
      }
    } catch (e) {
      console.error("Failed to load saved plays:", e)
    }
  }, [])

  // Save plays to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlays))
    } catch (e) {
      console.error("Failed to save plays:", e)
    }
  }, [savedPlays])

  // Keyboard shortcut for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undoStack])

  // Close arrow dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setArrowDropdownOpen(false)
    if (arrowDropdownOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [arrowDropdownOpen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPresentationMode(false)
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setZoom((prev) => e.deltaY < 0
          ? Math.min(prev + 0.1, 2.0)
          : Math.max(prev - 0.1, 0.5))
        return
      }

      if (zoom > 1 && fieldContainerRef.current?.contains(e.target as Node)) {
        e.preventDefault()
        const rect = fieldContainerRef.current.getBoundingClientRect()
        const maxPanX = ((zoom - 1) * rect.width) / 2
        const maxPanY = ((zoom - 1) * rect.height) / 2
        if (e.shiftKey) {
          setPanX((prev) => Math.max(-maxPanX, Math.min(maxPanX, prev - e.deltaY * 0.25)))
        } else {
          setPanY((prev) => Math.max(-maxPanY, Math.min(maxPanY, prev - e.deltaY * 0.25)))
        }
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [zoom])

  useEffect(() => {
    if (zoom === 1) {
      setPanX(0)
      setPanY(0)
    }
  }, [zoom])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return

    const lastAction = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))

    switch (lastAction.type) {
      case "add_player":
        setFieldPlayers(prev => prev.filter(p => p.id !== lastAction.player.id))
        setArrows(prev => prev.filter(a => a.playerId !== lastAction.player.id))
        break
      case "batch_add_players":
        setFieldPlayers(prev => prev.filter(p => !lastAction.playerIds.includes(p.id)))
        setArrows(prev => prev.filter(a => !lastAction.playerIds.includes(a.playerId)))
        break
      case "add_arrow":
        setArrows(prev => prev.filter(a => a.id !== lastAction.arrow.id))
        break
      case "move_player":
        setFieldPlayers(prev =>
          prev.map(p =>
            p.id === lastAction.playerId
              ? { ...p, x: lastAction.prevX, y: lastAction.prevY }
              : p
          )
        )
        setArrows(prev => {
          const otherArrows = prev.filter(a => a.playerId !== lastAction.playerId)
          return [...otherArrows, ...lastAction.prevArrows]
        })
        break
      case "add_ball":
        setBall(null)
        setArrows(prev => prev.filter(a => a.playerId !== "ball"))
        break
      case "move_ball":
        setBall(prev => prev ? { ...prev, x: lastAction.prevX, y: lastAction.prevY } : null)
        setArrows(prev => {
          const otherArrows = prev.filter(a => a.playerId !== "ball")
          return [...otherArrows, ...lastAction.prevArrows]
        })
        break
      case "add_phase":
        setPhases(prev => prev.filter(p => p.id !== lastAction.phase.id))
        break
      case "move_phase":
        setPhases(prev =>
          prev.map(p =>
            p.id === lastAction.phaseId
              ? { ...p, x: lastAction.prevX, y: lastAction.prevY }
              : p
          )
        )
        break
    }
  }, [undoStack])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPlacementToken(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])


  const getFieldCoords = useCallback((xPercent: number, yPercent: number) => ({
    x: BUFFER + FIELD_WIDTH * xPercent,
    y: BUFFER + FIELD_HEIGHT * yPercent,
  }), [])

  const getExistingPlayerKey = useCallback((player: FieldPlayer) => `${player.team}-${player.number}`, [])

  const makePlayerAt = useCallback((team: "attack" | "defense", number: number, x: number, y: number): FieldPlayer => {
    const positionData = RUGBY_POSITIONS.find(p => p.number === number)
    return {
      id: `${team}-${number}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      number,
      position: positionData?.position || "",
      abbr: positionData?.abbr || "",
      team,
      x,
      y,
    }
  }, [])

  const applyFormationBatch = useCallback((placements: Array<{ team: "attack" | "defense"; number: number; xPercent: number; yPercent: number }>) => {
    const existingKeys = new Set(fieldPlayers.map(getExistingPlayerKey))
    const newPlayers: FieldPlayer[] = []

    placements.forEach(({ team, number, xPercent, yPercent }) => {
      const key = `${team}-${number}`
      if (existingKeys.has(key)) return
      const { x, y } = getFieldCoords(xPercent, yPercent)
      const player = makePlayerAt(team, number, x, y)
      newPlayers.push(player)
      existingKeys.add(key)
    })

    if (newPlayers.length === 0) return
    setFieldPlayers(prev => [...prev, ...newPlayers])
    setUndoStack(prev => [...prev, { type: "batch_add_players", playerIds: newPlayers.map(p => p.id) }])
    setSelectedPlayerId(null)
    setSelectedBall(false)
    setSelectedArrowId(null)
  }, [fieldPlayers, getExistingPlayerKey, getFieldCoords, makePlayerAt])

  const handleApplyAttackFormation = useCallback(() => {
    applyFormationBatch([
      { team: "attack", number: 1, xPercent: 0.47, yPercent: 0.58 },
      { team: "attack", number: 2, xPercent: 0.50, yPercent: 0.58 },
      { team: "attack", number: 3, xPercent: 0.53, yPercent: 0.58 },
      { team: "attack", number: 4, xPercent: 0.48, yPercent: 0.60 },
      { team: "attack", number: 5, xPercent: 0.52, yPercent: 0.60 },
      { team: "attack", number: 6, xPercent: 0.44, yPercent: 0.59 },
      { team: "attack", number: 7, xPercent: 0.56, yPercent: 0.59 },
      { team: "attack", number: 8, xPercent: 0.50, yPercent: 0.62 },
      { team: "attack", number: 9, xPercent: 0.52, yPercent: 0.63 },
      { team: "attack", number: 10, xPercent: 0.45, yPercent: 0.66 },
      { team: "attack", number: 12, xPercent: 0.37, yPercent: 0.67 },
      { team: "attack", number: 13, xPercent: 0.29, yPercent: 0.67 },
      { team: "attack", number: 11, xPercent: 0.10, yPercent: 0.67 },
      { team: "attack", number: 14, xPercent: 0.75, yPercent: 0.66 },
      { team: "attack", number: 15, xPercent: 0.50, yPercent: 0.75 },
    ])
  }, [applyFormationBatch])

  const handleApplyDefenseFormation = useCallback(() => {
    applyFormationBatch([
      { team: "defense", number: 1, xPercent: 0.40, yPercent: 0.40 },
      { team: "defense", number: 2, xPercent: 0.50, yPercent: 0.40 },
      { team: "defense", number: 3, xPercent: 0.60, yPercent: 0.40 },
      { team: "defense", number: 4, xPercent: 0.35, yPercent: 0.42 },
      { team: "defense", number: 5, xPercent: 0.65, yPercent: 0.42 },
      { team: "defense", number: 6, xPercent: 0.30, yPercent: 0.41 },
      { team: "defense", number: 7, xPercent: 0.70, yPercent: 0.41 },
      { team: "defense", number: 8, xPercent: 0.50, yPercent: 0.43 },
      { team: "defense", number: 9, xPercent: 0.52, yPercent: 0.37 },
      { team: "defense", number: 10, xPercent: 0.44, yPercent: 0.35 },
      { team: "defense", number: 12, xPercent: 0.36, yPercent: 0.34 },
      { team: "defense", number: 13, xPercent: 0.28, yPercent: 0.34 },
      { team: "defense", number: 11, xPercent: 0.12, yPercent: 0.34 },
      { team: "defense", number: 14, xPercent: 0.72, yPercent: 0.34 },
      { team: "defense", number: 15, xPercent: 0.50, yPercent: 0.28 },
    ])
  }, [applyFormationBatch])

  const handleApplyBothTeamsFormation = useCallback(() => {
    applyFormationBatch([
      { team: "attack", number: 1, xPercent: 0.47, yPercent: 0.58 },
      { team: "attack", number: 2, xPercent: 0.50, yPercent: 0.58 },
      { team: "attack", number: 3, xPercent: 0.53, yPercent: 0.58 },
      { team: "attack", number: 4, xPercent: 0.48, yPercent: 0.60 },
      { team: "attack", number: 5, xPercent: 0.52, yPercent: 0.60 },
      { team: "attack", number: 6, xPercent: 0.44, yPercent: 0.59 },
      { team: "attack", number: 7, xPercent: 0.56, yPercent: 0.59 },
      { team: "attack", number: 8, xPercent: 0.50, yPercent: 0.62 },
      { team: "attack", number: 9, xPercent: 0.52, yPercent: 0.63 },
      { team: "attack", number: 10, xPercent: 0.45, yPercent: 0.66 },
      { team: "attack", number: 12, xPercent: 0.37, yPercent: 0.67 },
      { team: "attack", number: 13, xPercent: 0.29, yPercent: 0.67 },
      { team: "attack", number: 11, xPercent: 0.10, yPercent: 0.67 },
      { team: "attack", number: 14, xPercent: 0.75, yPercent: 0.66 },
      { team: "attack", number: 15, xPercent: 0.50, yPercent: 0.75 },
      { team: "defense", number: 1, xPercent: 0.40, yPercent: 0.40 },
      { team: "defense", number: 2, xPercent: 0.50, yPercent: 0.40 },
      { team: "defense", number: 3, xPercent: 0.60, yPercent: 0.40 },
      { team: "defense", number: 4, xPercent: 0.35, yPercent: 0.42 },
      { team: "defense", number: 5, xPercent: 0.65, yPercent: 0.42 },
      { team: "defense", number: 6, xPercent: 0.30, yPercent: 0.41 },
      { team: "defense", number: 7, xPercent: 0.70, yPercent: 0.41 },
      { team: "defense", number: 8, xPercent: 0.50, yPercent: 0.43 },
      { team: "defense", number: 9, xPercent: 0.52, yPercent: 0.37 },
      { team: "defense", number: 10, xPercent: 0.44, yPercent: 0.35 },
      { team: "defense", number: 12, xPercent: 0.36, yPercent: 0.34 },
      { team: "defense", number: 13, xPercent: 0.28, yPercent: 0.34 },
      { team: "defense", number: 11, xPercent: 0.12, yPercent: 0.34 },
      { team: "defense", number: 14, xPercent: 0.72, yPercent: 0.34 },
      { team: "defense", number: 15, xPercent: 0.50, yPercent: 0.28 },
    ])
  }, [applyFormationBatch])

  const handleApplyLineoutFormation = useCallback(() => {
    applyFormationBatch([
      // Attack lineout structure (left side)
      { team: "attack", number: 2, xPercent: 0.05, yPercent: 0.58 },
      { team: "attack", number: 1, xPercent: 0.13, yPercent: 0.58 },
      { team: "attack", number: 4, xPercent: 0.18, yPercent: 0.58 },
      { team: "attack", number: 6, xPercent: 0.23, yPercent: 0.58 },
      { team: "attack", number: 5, xPercent: 0.28, yPercent: 0.58 },
      { team: "attack", number: 7, xPercent: 0.33, yPercent: 0.58 },
      { team: "attack", number: 3, xPercent: 0.38, yPercent: 0.58 },
      { team: "attack", number: 8, xPercent: 0.40, yPercent: 0.60 },
      { team: "attack", number: 9, xPercent: 0.42, yPercent: 0.63 },
      { team: "attack", number: 10, xPercent: 0.48, yPercent: 0.65 },
      { team: "attack", number: 12, xPercent: 0.56, yPercent: 0.65 },
      { team: "attack", number: 13, xPercent: 0.64, yPercent: 0.65 },
      { team: "attack", number: 14, xPercent: 0.78, yPercent: 0.64 },
      { team: "attack", number: 11, xPercent: 0.10, yPercent: 0.70 },
      { team: "attack", number: 15, xPercent: 0.55, yPercent: 0.74 },
      // Defense mirrored to oppose lineout
      { team: "defense", number: 2, xPercent: 0.05, yPercent: 0.52 },
      { team: "defense", number: 1, xPercent: 0.13, yPercent: 0.52 },
      { team: "defense", number: 4, xPercent: 0.18, yPercent: 0.52 },
      { team: "defense", number: 6, xPercent: 0.23, yPercent: 0.52 },
      { team: "defense", number: 5, xPercent: 0.28, yPercent: 0.52 },
      { team: "defense", number: 7, xPercent: 0.33, yPercent: 0.52 },
      { team: "defense", number: 3, xPercent: 0.38, yPercent: 0.52 },
      { team: "defense", number: 8, xPercent: 0.40, yPercent: 0.52 },
      { team: "defense", number: 9, xPercent: 0.42, yPercent: 0.52 },
      { team: "defense", number: 10, xPercent: 0.48, yPercent: 0.50 },
      { team: "defense", number: 12, xPercent: 0.56, yPercent: 0.50 },
      { team: "defense", number: 13, xPercent: 0.64, yPercent: 0.50 },
      { team: "defense", number: 14, xPercent: 0.78, yPercent: 0.50 },
      { team: "defense", number: 11, xPercent: 0.10, yPercent: 0.50 },
      { team: "defense", number: 15, xPercent: 0.55, yPercent: 0.44 },
    ])
  }, [applyFormationBatch])

  const handleApplyScrumFormation = useCallback(() => {
    applyFormationBatch([
      // Attack pack
      { team: "attack", number: 1, xPercent: 0.47, yPercent: 0.55 },
      { team: "attack", number: 2, xPercent: 0.50, yPercent: 0.55 },
      { team: "attack", number: 3, xPercent: 0.53, yPercent: 0.55 },
      { team: "attack", number: 4, xPercent: 0.48, yPercent: 0.57 },
      { team: "attack", number: 5, xPercent: 0.52, yPercent: 0.57 },
      { team: "attack", number: 6, xPercent: 0.44, yPercent: 0.56 },
      { team: "attack", number: 7, xPercent: 0.56, yPercent: 0.56 },
      { team: "attack", number: 8, xPercent: 0.50, yPercent: 0.59 },
      { team: "attack", number: 9, xPercent: 0.54, yPercent: 0.60 },
      { team: "attack", number: 10, xPercent: 0.60, yPercent: 0.64 },
      { team: "attack", number: 12, xPercent: 0.68, yPercent: 0.65 },
      { team: "attack", number: 13, xPercent: 0.76, yPercent: 0.65 },
      { team: "attack", number: 14, xPercent: 0.88, yPercent: 0.64 },
      { team: "attack", number: 11, xPercent: 0.25, yPercent: 0.65 },
      { team: "attack", number: 15, xPercent: 0.50, yPercent: 0.74 },
      // Defense pack
      { team: "defense", number: 1, xPercent: 0.47, yPercent: 0.45 },
      { team: "defense", number: 2, xPercent: 0.50, yPercent: 0.45 },
      { team: "defense", number: 3, xPercent: 0.53, yPercent: 0.45 },
      { team: "defense", number: 4, xPercent: 0.48, yPercent: 0.43 },
      { team: "defense", number: 5, xPercent: 0.52, yPercent: 0.43 },
      { team: "defense", number: 6, xPercent: 0.44, yPercent: 0.44 },
      { team: "defense", number: 7, xPercent: 0.56, yPercent: 0.44 },
      { team: "defense", number: 8, xPercent: 0.50, yPercent: 0.41 },
      { team: "defense", number: 9, xPercent: 0.54, yPercent: 0.40 },
      { team: "defense", number: 10, xPercent: 0.60, yPercent: 0.36 },
      { team: "defense", number: 12, xPercent: 0.68, yPercent: 0.35 },
      { team: "defense", number: 13, xPercent: 0.76, yPercent: 0.35 },
      { team: "defense", number: 14, xPercent: 0.88, yPercent: 0.36 },
      { team: "defense", number: 11, xPercent: 0.25, yPercent: 0.35 },
      { team: "defense", number: 15, xPercent: 0.50, yPercent: 0.30 },
    ])
  }, [applyFormationBatch])

  const handlePlayerDrop = useCallback((playerId: string, x: number, y: number) => {
    const [team, numberStr] = playerId.split("-")
    const number = parseInt(numberStr, 10)
    const positionData = RUGBY_POSITIONS.find(p => p.number === number)

    const newPlayer: FieldPlayer = {
      id: playerId,
      number,
      position: positionData?.position || "",
      abbr: positionData?.abbr || "",
      team: team as "attack" | "defense",
      x,
      y,
    }

    setFieldPlayers(prev => [...prev, newPlayer])
    setUndoStack(prev => [...prev, { type: "add_player", player: newPlayer }])
    setSelectedPlayerId(null)
    setSelectedBall(false)
  }, [])

  const handleBallDrop = useCallback((x: number, y: number) => {
    if (ball) return // Only one ball allowed
    
    const newBall: BallToken = {
      id: `ball-${Date.now()}`,
      x,
      y,
    }
    setBall(newBall)
    setUndoStack(prev => [...prev, { type: "add_ball", ball: newBall }])
  }, [ball])

  const handlePhaseDrop = useCallback((phase: number, x: number, y: number) => {
    const newPhase: PhaseMarker = {
      id: `phase-${phase}-${Date.now()}`,
      phase,
      x,
      y,
    }
    setPhases(prev => [...prev, newPhase])
    setUndoStack(prev => [...prev, { type: "add_phase", phase: newPhase }])
  }, [])

  const handleConeDrop = useCallback((x: number, y: number) => {
    const newCone: ConeMarker = {
      id: `cone-${Date.now()}`,
      x,
      y,
    }
    setCones(prev => [...prev, newCone])
  }, [])

  const handlePlayerDragStart = useCallback((playerId: string) => {
    const player = fieldPlayers.find(p => p.id === playerId)
    if (player) {
      const playerArrows = arrows.filter(a => a.playerId === playerId)
      dragStartRef.current = {
        type: "player",
        id: playerId,
        x: player.x,
        y: player.y,
        arrows: playerArrows,
      }
    }
  }, [fieldPlayers, arrows])

  const handlePlayerDrag = useCallback((playerId: string, x: number, y: number) => {
    setFieldPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, x, y } : p
      )
    )
    
    setArrows(prev =>
      prev.map(arrow =>
        arrow.playerId === playerId
          ? { ...arrow, fromX: x, fromY: y }
          : arrow
      )
    )
  }, [])

  const handlePlayerDragEnd = useCallback(() => {
    if (dragStartRef.current && dragStartRef.current.type === "player") {
      const { id: playerId, x: prevX, y: prevY, arrows: prevArrows } = dragStartRef.current
      const player = fieldPlayers.find(p => p.id === playerId)
      
      if (player && (player.x !== prevX || player.y !== prevY)) {
        setUndoStack(prev => [...prev, { 
          type: "move_player", 
          playerId, 
          prevX, 
          prevY,
          prevArrows
        }])
      }
      dragStartRef.current = null
    }
  }, [fieldPlayers])

  const handleBallDragStart = useCallback(() => {
    if (ball) {
      const ballArrows = arrows.filter(a => a.playerId === "ball")
      dragStartRef.current = {
        type: "ball",
        id: "ball",
        x: ball.x,
        y: ball.y,
        arrows: ballArrows,
      }
    }
  }, [ball, arrows])

  const handleBallDrag = useCallback((x: number, y: number) => {
    setBall(prev => prev ? { ...prev, x, y } : null)
    setArrows(prev =>
      prev.map(arrow =>
        arrow.playerId === "ball"
          ? { ...arrow, fromX: x, fromY: y }
          : arrow
      )
    )
  }, [])

  const handleBallDragEnd = useCallback(() => {
    if (dragStartRef.current && dragStartRef.current.type === "ball") {
      const { x: prevX, y: prevY, arrows: prevArrows } = dragStartRef.current
      
      if (ball && (ball.x !== prevX || ball.y !== prevY)) {
        setUndoStack(prev => [...prev, { 
          type: "move_ball",
          prevX, 
          prevY,
          prevArrows
        }])
      }
      dragStartRef.current = null
    }
  }, [ball])

  const handlePhaseDragStart = useCallback((phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId)
    if (phase) {
      dragStartRef.current = {
        type: "phase",
        id: phaseId,
        x: phase.x,
        y: phase.y,
        arrows: [],
      }
    }
  }, [phases])

  const handlePhaseDrag = useCallback((phaseId: string, x: number, y: number) => {
    setPhases(prev =>
      prev.map(p =>
        p.id === phaseId ? { ...p, x, y } : p
      )
    )
  }, [])

  const handlePhaseDragEnd = useCallback(() => {
    if (dragStartRef.current && dragStartRef.current.type === "phase") {
      const { id: phaseId, x: prevX, y: prevY } = dragStartRef.current
      const phase = phases.find(p => p.id === phaseId)
      
      if (phase && (phase.x !== prevX || phase.y !== prevY)) {
        setUndoStack(prev => [...prev, { 
          type: "move_phase", 
          phaseId, 
          prevX, 
          prevY
        }])
      }
      dragStartRef.current = null
    }
  }, [phases])

  const handleConeDragStart = useCallback((_coneId: string) => {
    // No-op for now; cone dragging updates live.
  }, [])

  const handleConeDrag = useCallback((coneId: string, x: number, y: number) => {
    setCones(prev =>
      prev.map(c =>
        c.id === coneId ? { ...c, x, y } : c
      )
    )
  }, [])

  const handleConeDragEnd = useCallback(() => {
    // No-op for now; retained for RugbyField contract.
  }, [])

  const handleLabelDragStart = useCallback((_labelId: string) => {
    // No-op for now; label dragging updates live.
  }, [])

  const handleLabelDrag = useCallback((labelId: string, x: number, y: number) => {
    setLabels(prev =>
      prev.map(l =>
        l.id === labelId ? { ...l, x, y } : l
      )
    )
  }, [])

  const handleLabelDragEnd = useCallback(() => {
    // No-op for now; retained for RugbyField contract.
  }, [])

  const handlePlayerSelect = useCallback((playerId: string | null) => {
    setSelectedPlayerId(playerId)
    if (playerId) setSelectedBall(false)
  }, [])

  const handleBallSelect = useCallback((selected: boolean) => {
    setSelectedBall(selected)
    if (selected) setSelectedPlayerId(null)
  }, [])

  const handleFieldClick = useCallback((x: number, y: number) => {
    if (selectedPlacementToken) {
      if (selectedPlacementToken.type === "player") {
        const existing = fieldPlayers.some(
          p => p.team === selectedPlacementToken.team && p.number === selectedPlacementToken.number
        )
        if (!existing) {
          const player = makePlayerAt(selectedPlacementToken.team, selectedPlacementToken.number, x, y)
          setFieldPlayers(prev => [...prev, player])
          setUndoStack(prev => [...prev, { type: "add_player", player }])
        }
      } else if (selectedPlacementToken.type === "ball") {
        if (ball) {
          setBall(prev => (prev ? { ...prev, x, y } : prev))
        } else {
          const newBall: BallToken = { id: `ball-${Date.now()}`, x, y }
          setBall(newBall)
          setUndoStack(prev => [...prev, { type: "add_ball", ball: newBall }])
        }
      } else if (selectedPlacementToken.type === "cone") {
        setCones(prev => [...prev, { id: `cone-${Date.now()}`, x, y }])
      } else if (selectedPlacementToken.type === "phase") {
        setPhases(prev => [
          ...prev,
          { id: `phase-${selectedPlacementToken.phase}-${Date.now()}`, phase: selectedPlacementToken.phase, x, y },
        ])
      }
      setSelectedPlacementToken(null)
      return
    }

    if (mode !== "draw") return
    
    if (selectedPlayerId) {
      const player = fieldPlayers.find(p => p.id === selectedPlayerId)
      if (!player) return

      const newArrow: Arrow = {
        id: `arrow-${Date.now()}`,
        playerId: selectedPlayerId,
        team: player.team,
        fromX: player.x,
        fromY: player.y,
        toX: x,
        toY: y,
        arrowType,
      }

      setArrows(prev => [...prev, newArrow])
      setUndoStack(prev => [...prev, { type: "add_arrow", arrow: newArrow }])
      setSelectedPlayerId(null)
    } else if (selectedBall && ball) {
      const newArrow: Arrow = {
        id: `arrow-${Date.now()}`,
        playerId: "ball",
        team: "ball",
        fromX: ball.x,
        fromY: ball.y,
        toX: x,
        toY: y,
        arrowType: "pass", // Ball always uses pass arrow
      }

      setArrows(prev => [...prev, newArrow])
      setUndoStack(prev => [...prev, { type: "add_arrow", arrow: newArrow }])
      setSelectedBall(false)
    }
  }, [selectedPlacementToken, mode, selectedPlayerId, selectedBall, fieldPlayers, ball, arrowType, makePlayerAt])

  const handleDeletePlayer = useCallback((playerId: string) => {
    setFieldPlayers(prev => prev.filter(p => p.id !== playerId))
    setArrows(prev => prev.filter(a => a.playerId !== playerId))
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null)
    }
  }, [selectedPlayerId])

  const handleDeleteBall = useCallback(() => {
    setBall(null)
    setArrows(prev => prev.filter(a => a.playerId !== "ball"))
    setSelectedBall(false)
  }, [])

  const handleDeletePhase = useCallback((phaseId: string) => {
    setPhases(prev => prev.filter(p => p.id !== phaseId))
  }, [])

  const handleDeleteCone = useCallback((coneId: string) => {
    setCones(prev => prev.filter(c => c.id !== coneId))
  }, [])

  const handleDeleteLabel = useCallback((labelId: string) => {
    setLabels(prev => prev.filter(l => l.id !== labelId))
  }, [])

  const handleClearPlayerArrows = useCallback((playerId: string) => {
    setArrows(prev => prev.filter(a => a.playerId !== playerId))
  }, [])

  const handleClearBallArrows = useCallback(() => {
    setArrows(prev => prev.filter(a => a.playerId !== "ball"))
  }, [])

  const handleClearField = useCallback(() => {
    setFieldPlayers([])
    setArrows([])
    setBall(null)
    setPhases([])
    setCones([])
    setLabels([])
    setSelectedPlayerId(null)
    setSelectedBall(false)
    setSelectedArrowId(null)
    setSelectedPlacementToken(null)
    setIsAnimating(false)
    setIsPaused(false)
    setHasCompletedAnimation(false)
    setStartPositions(null)
    setUndoStack([])
  }, [])

  const handleArrowSelect = useCallback((arrowId: string | null) => {
    setSelectedArrowId(arrowId)
  }, [])

  const handleArrowUpdate = useCallback((arrowId: string, updates: Partial<Arrow>) => {
    setArrows(prev =>
      prev.map(arrow =>
        arrow.id === arrowId ? { ...arrow, ...updates } : arrow
      )
    )
  }, [])

  const handleArrowDelete = useCallback((arrowId: string) => {
    setArrows(prev => prev.filter(arrow => arrow.id !== arrowId))
    setSelectedArrowId(prev => (prev === arrowId ? null : prev))
  }, [])

  const handleArrowTypeChange = useCallback((arrowId: string, newType: ArrowType) => {
    setArrows(prev =>
      prev.map(arrow =>
        arrow.id === arrowId ? { ...arrow, arrowType: newType } : arrow
      )
    )
  }, [])

  const handleTextLabelCreate = useCallback((x: number, y: number) => {
    const text = window.prompt("Enter label text")
    if (!text || !text.trim()) return

    const newLabel: TextLabel = {
      id: `label-${Date.now()}`,
      text: text.trim(),
      x,
      y,
    }
    setLabels(prev => [...prev, newLabel])
  }, [])

  const handleSavePlay = useCallback(() => {
    const newPlay: SavedPlay = {
      id: `play-${Date.now()}`,
      name: playName || "Untitled Play",
      playType,
      notes,
      timestamp: new Date().toISOString(),
      teamColors,
      players: fieldPlayers,
      arrows: arrows,
      ball,
      phases,
      cones,
      labels,
    }
    
    setSavedPlays(prev => [...prev, newPlay])
    console.log("Saved play:", newPlay)
  }, [playName, playType, notes, teamColors, fieldPlayers, arrows, ball, phases, cones, labels])

  const handleLoadPlay = useCallback((play: SavedPlay) => {
    setPlayName(play.name)
    setPlayType(play.playType)
    setNotes(play.notes || "")
    setTeamColors(play.teamColors)
    setFieldPlayers(play.players)
    setArrows(play.arrows)
    setBall(play.ball || null)
    setPhases(play.phases || [])
    setCones(play.cones || [])
    setLabels(play.labels || [])
    setUndoStack([])
    setSelectedPlayerId(null)
    setSelectedBall(false)
    setSelectedArrowId(null)
  }, [])

  const handleDeletePlay = useCallback((playId: string) => {
    setSavedPlays(prev => prev.filter(p => p.id !== playId))
  }, [])

  const handleDuplicatePlay = useCallback((play: SavedPlay) => {
    const duplicatedPlay: SavedPlay = {
      ...play,
      id: `play-${Date.now()}`,
      name: `${play.name} (Copy)`,
      timestamp: new Date().toISOString(),
    }
    setSavedPlays(prev => [...prev, duplicatedPlay])
  }, [])

  const handleModeChange = useCallback((newMode: InteractionMode) => {
    setMode(newMode)
    setSelectedPlayerId(null)
    setSelectedBall(false)
    setSelectedArrowId(null)
    setPasserSelected(null)
  }, [])

  const handleCreatePassArrow = useCallback((passerId: string, receiverId: string) => {
    const passer = fieldPlayers.find((p) => p.id === passerId)
    const receiver = fieldPlayers.find((p) => p.id === receiverId)
    if (!passer || !receiver || passer.id === receiver.id) return

    const newArrow: Arrow = {
      id: `arrow-${Date.now()}`,
      playerId: passer.id,
      team: passer.team,
      fromX: passer.x,
      fromY: passer.y,
      toX: receiver.x,
      toY: receiver.y,
      arrowType: "pass",
    }
    setArrows((prev) => [...prev, newArrow])
    setUndoStack((prev) => [...prev, { type: "add_arrow", arrow: newArrow }])
    setPasserSelected(null)
  }, [fieldPlayers])

  const handlePlayAnimation = useCallback(() => {
    if (arrows.length === 0) return
    const animatingPlayers = fieldPlayers.filter((p) =>
      arrows.some((a) => a.playerId === p.id)
    )
    if (animatingPlayers.length === 0) {
      window.alert("Draw movement arrows first before playing")
      return
    }
    if (!startPositions || hasCompletedAnimation) {
      setStartPositions({
        players: fieldPlayers.map((p) => ({ id: p.id, x: p.x, y: p.y })),
        ball: ball ? { x: ball.x, y: ball.y } : null,
      })
    }
    setHasCompletedAnimation(false)
    setIsPaused(false)
    setIsAnimating(true)
  }, [arrows, startPositions, hasCompletedAnimation, fieldPlayers, ball])

  const handlePauseAnimation = useCallback(() => {
    setIsPaused(true)
    setIsAnimating(false)
  }, [])

  const handleResetAnimation = useCallback(() => {
    if (startPositions) {
      setFieldPlayers((prev) =>
        prev.map((p) => {
          const start = startPositions.players.find((sp) => sp.id === p.id)
          return start ? { ...p, x: start.x, y: start.y } : p
        })
      )
      if (startPositions.ball && ball) {
        setBall({ ...ball, x: startPositions.ball.x, y: startPositions.ball.y })
      }
    }
    setIsAnimating(false)
    setIsPaused(false)
    setHasCompletedAnimation(false)
  }, [startPositions, ball])

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    setIsPaused(false)
    setHasCompletedAnimation(true)
  }, [])

  const handleEnterPresentation = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsPresentationMode(true)
    } catch (error) {
      console.error("Failed to enter fullscreen:", error)
    }
  }, [])

  const handleExitPresentation = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Failed to exit fullscreen:", error)
    } finally {
      setIsPresentationMode(false)
    }
  }, [])

  const handleTeamColorChange = useCallback((team: "attack" | "defense", color: string) => {
    setTeamColors(prev => ({ ...prev, [team]: color }))
  }, [])

  const handleExportPNG = useCallback(() => {
    // Placeholder export hook to satisfy sidebar contract.
    console.warn("PNG export is not implemented yet.")
  }, [])

  const handleGenerateNotes = useCallback(() => {
    const generatedNotes = generatePlayNotes({
      playType,
      players: fieldPlayers.map((p) => ({
        number: p.number,
        abbr: p.abbr,
        team: p.team,
        x: p.x,
        y: p.y,
      })),
      arrows: arrows.map((a) => ({
        playerId: a.playerId,
        arrowType: a.arrowType,
        team: a.team,
      })),
    })
    setNotes(generatedNotes)
  }, [playType, fieldPlayers, arrows])

  const selectedArrowType = ARROW_TYPES.find(a => a.type === arrowType)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Main field area with toolbar */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        {!isPresentationMode && (
        <div className="h-10 bg-sidebar border-b border-sidebar-border flex items-center px-3 gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground mr-1">Mode:</span>
          <div className="flex rounded-md overflow-hidden border border-border">
            <button
              onClick={() => handleModeChange("move")}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                mode === "move"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Move className="w-3 h-3" />
              Move
            </button>
            <button
              onClick={() => handleModeChange("draw")}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                mode === "draw"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Pencil className="w-3 h-3" />
              Draw
            </button>
          </div>

          {/* Arrow Type Selector - only visible in draw mode */}
          {mode === "draw" && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setArrowDropdownOpen(!arrowDropdownOpen)
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors"
              >
                <span className="w-3 h-3 flex items-center justify-center text-[8px]">
                  {arrowType === "pass" ? "🟡" : "→"}
                </span>
                {selectedArrowType?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {arrowDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg py-1 z-50 min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {ARROW_TYPES.map(at => (
                    <button
                      key={at.type}
                      onClick={() => {
                        setArrowType(at.type)
                        setArrowDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-[10px] hover:bg-muted transition-colors flex items-center gap-2 ${
                        arrowType === at.type ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <span className="w-4 text-center">
                        {at.type === "pass" ? "🟡" : 
                         at.type === "decoy" ? "⋯→" :
                         at.type === "curve" ? "↪" :
                         at.type === "z-left" ? "↙" :
                         at.type === "z-right" ? "↘" :
                         at.type === "loop" ? "↺" :
                         at.type === "short" ? "—" :
                         "→"}
                      </span>
                      <span>{at.label}</span>
                      <span className="text-[8px] text-muted-foreground ml-auto">{at.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>

          {arrows.length > 0 && (
            <>
              {!isAnimating ? (
                <button
                  onClick={handlePlayAnimation}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-emerald-600/80 text-white hover:bg-emerald-600 transition-colors"
                  title={hasCompletedAnimation ? "Replay animation" : "Play animation"}
                >
                  {hasCompletedAnimation ? "▶ Replay" : "▶ Play"}
                </button>
              ) : (
                <button
                  onClick={handlePauseAnimation}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-amber-500/90 text-black hover:bg-amber-500 transition-colors"
                  title="Pause animation"
                >
                  ⏸ Pause
                </button>
              )}
              <button
                onClick={handleResetAnimation}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-muted/70 text-foreground hover:bg-muted transition-colors"
                title="Reset to animation start"
              >
                ⏹ Reset
              </button>
              <div className="flex rounded-md overflow-hidden border border-border">
                {[0.5, 1, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setAnimationSpeed(speed as 0.5 | 1 | 2)}
                    className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                      animationSpeed === speed
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </>
          )}

          {playName && (
            <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[200px]">
              {playName}
            </span>
          )}
          <button
            onClick={handleEnterPresentation}
            className="px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors"
          >
            ⛶ Present
          </button>
          <button
            onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.5))}
            className="px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors"
          >
            -
          </button>
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 0.1, 2.0))}
            className="px-2 py-1 text-[10px] font-medium rounded-md border border-border bg-muted/50 text-foreground hover:bg-muted transition-colors"
          >
            +
          </button>
          <span className="text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => {
              setZoom(1)
              setPanX(0)
              setPanY(0)
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Reset
          </button>
          {zoom > 1 && (
            <span className="text-[10px] text-muted-foreground">Alt+drag to pan</span>
          )}
        </div>
        )}

        {/* Field container - fills remaining space */}
        <div
          ref={fieldContainerRef}
          className="relative flex-1 p-2 min-h-0"
          onMouseDown={(e) => {
            if (zoom <= 1) return
            if (e.altKey || e.button === 1) {
              e.preventDefault()
              isPanning.current = true
              panStart.current = { x: e.clientX, y: e.clientY, panX, panY }
            }
          }}
          onMouseMove={(e) => {
            if (!isPanning.current || !fieldContainerRef.current) return
            const dx = e.clientX - panStart.current.x
            const dy = e.clientY - panStart.current.y
            const rect = fieldContainerRef.current.getBoundingClientRect()
            const maxPanX = ((zoom - 1) * rect.width) / 2
            const maxPanY = ((zoom - 1) * rect.height) / 2
            setPanX(Math.max(-maxPanX, Math.min(maxPanX, panStart.current.panX + dx / zoom)))
            setPanY(Math.max(-maxPanY, Math.min(maxPanY, panStart.current.panY + dy / zoom)))
          }}
          onMouseUp={() => {
            isPanning.current = false
          }}
          onMouseLeave={() => {
            isPanning.current = false
          }}
        >
          <div
            style={{
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
              transformOrigin: "top center",
              transition: isPanning.current ? "none" : "transform 0.15s ease",
              width: "100%",
              height: "100%",
              cursor: zoom > 1 ? "grab" : "default",
            }}
          >
            <RugbyField
            players={fieldPlayers}
            arrows={arrows}
            ball={ball}
            phases={phases}
            cones={cones}
            labels={labels}
            selectedPlayerId={selectedPlayerId}
            selectedBall={selectedBall}
            selectedArrowId={selectedArrowId}
            mode={mode}
            arrowType={arrowType}
            passerSelected={passerSelected}
            teamColors={teamColors}
            zoom={100}
            clickToPlaceActive={selectedPlacementToken !== null}
            onFieldClick={handleFieldClick}
            onPlayerDrop={handlePlayerDrop}
            onBallDrop={handleBallDrop}
            onPhaseDrop={handlePhaseDrop}
            onConeDrop={handleConeDrop}
            onPlayerSelect={handlePlayerSelect}
            onPasserSelect={setPasserSelected}
            onCreatePassArrow={handleCreatePassArrow}
            onBallSelect={handleBallSelect}
            onArrowSelect={handleArrowSelect}
            onPlayerDragStart={handlePlayerDragStart}
            onPlayerDrag={handlePlayerDrag}
            onPlayerDragEnd={handlePlayerDragEnd}
            onBallDragStart={handleBallDragStart}
            onBallDrag={handleBallDrag}
            onBallDragEnd={handleBallDragEnd}
            onPhaseDragStart={handlePhaseDragStart}
            onPhaseDrag={handlePhaseDrag}
            onPhaseDragEnd={handlePhaseDragEnd}
            onConeDragStart={handleConeDragStart}
            onConeDrag={handleConeDrag}
            onConeDragEnd={handleConeDragEnd}
            onLabelDragStart={handleLabelDragStart}
            onLabelDrag={handleLabelDrag}
            onLabelDragEnd={handleLabelDragEnd}
            onDeletePlayer={handleDeletePlayer}
            onDeleteBall={handleDeleteBall}
            onDeletePhase={handleDeletePhase}
            onDeleteCone={handleDeleteCone}
            onDeleteLabel={handleDeleteLabel}
            onClearPlayerArrows={handleClearPlayerArrows}
            onClearBallArrows={handleClearBallArrows}
            onArrowUpdate={handleArrowUpdate}
            onArrowDelete={handleArrowDelete}
            onArrowTypeChange={handleArrowTypeChange}
            onTextLabelCreate={handleTextLabelCreate}
            isAnimating={isAnimating}
            isPaused={isPaused}
            animationSpeed={animationSpeed}
            onAnimationComplete={handleAnimationComplete}
            />
          </div>
          {isPresentationMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-2">
              <span className="text-[11px] text-foreground max-w-[200px] truncate">
                {playName || "Untitled Play"}
              </span>
              {!isAnimating ? (
                <button
                  onClick={handlePlayAnimation}
                  className="px-2 py-1 text-[11px] rounded border border-border bg-emerald-600/80 text-white"
                >
                  ▶ Play
                </button>
              ) : (
                <button
                  onClick={handlePauseAnimation}
                  className="px-2 py-1 text-[11px] rounded border border-border bg-amber-500/90 text-black"
                >
                  ⏸ Pause
                </button>
              )}
              <button
                onClick={handleResetAnimation}
                className="px-2 py-1 text-[11px] rounded border border-border bg-muted/70 text-foreground"
              >
                ⏹ Reset
              </button>
              <select
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value) as 0.5 | 1 | 2)}
                className="h-7 rounded border border-border bg-background px-1 text-[11px]"
              >
                {[0.5, 1, 2].map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>
              <button
                onClick={handleExitPresentation}
                className="px-2 py-1 text-[11px] rounded border border-border bg-muted/70 text-foreground"
              >
                ✕ Exit
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Sidebar */}
      {!isPresentationMode && (
      <PlaybookSidebar
        playName={playName}
        playType={playType}
        notes={notes}
        onPlayNameChange={setPlayName}
        onPlayTypeChange={setPlayType}
        onNotesChange={setNotes}
        attackPlayers={RUGBY_POSITIONS}
        defensePlayers={RUGBY_POSITIONS}
        fieldPlayers={fieldPlayers}
        ball={ball}
        cones={cones}
        teamColors={teamColors}
        savedPlays={savedPlays}
        onTeamColorChange={handleTeamColorChange}
        onClearField={handleClearField}
        onSavePlay={handleSavePlay}
        onLoadPlay={handleLoadPlay}
        onDeletePlay={handleDeletePlay}
        onDuplicatePlay={handleDuplicatePlay}
        onExportPNG={handleExportPNG}
        selectedPlacementToken={selectedPlacementToken}
        onSelectPlacementToken={setSelectedPlacementToken}
        onApplyAttackFormation={handleApplyAttackFormation}
        onApplyDefenseFormation={handleApplyDefenseFormation}
        onApplyBothTeamsFormation={handleApplyBothTeamsFormation}
        onApplyLineoutFormation={handleApplyLineoutFormation}
        onApplyScrumFormation={handleApplyScrumFormation}
        onGenerateNotes={handleGenerateNotes}
      />
      )}
    </div>
  )
}
