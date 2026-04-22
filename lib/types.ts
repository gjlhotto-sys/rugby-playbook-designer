export interface PlayerTemplate {
  number: number
  position: string
  abbr: string
}

export interface FieldPlayer {
  id: string
  number: number
  position: string
  abbr: string
  team: "attack" | "defense"
  x: number
  y: number
}

export interface BallToken {
  id: string
  x: number
  y: number
}

export interface PhaseMarker {
  id: string
  phase: number
  x: number
  y: number
}

export interface ConeMarker {
  id: string
  x: number
  y: number
}

export interface TextLabel {
  id: string
  text: string
  x: number
  y: number
}

export type ArrowType = "run" | "decoy" | "curve" | "pass" | "z-left" | "z-right" | "loop" | "short"

export interface Arrow {
  id: string
  playerId: string
  team: "attack" | "defense" | "ball"
  fromX: number
  fromY: number
  toX: number
  toY: number
  arrowType: ArrowType
  receiverId?: string
}

export type InteractionMode = "move" | "draw" | "text"

export interface TeamColors {
  attack: string
  defense: string
}

export type PlayType = "Lineout" | "Scrum" | "Backline Move" | "Kick-off" | "Restart" | "Penalty" | "Free Play"

export interface SavedPlay {
  id: string
  name: string
  playType: PlayType
  notes: string
  timestamp: string
  teamColors: TeamColors
  players: FieldPlayer[]
  arrows: Arrow[]
  ball: BallToken | null
  phases: PhaseMarker[]
  cones: ConeMarker[]
  labels: TextLabel[]
}

export type UndoAction =
  | { type: "add_player"; player: FieldPlayer }
  | { type: "batch_add_players"; playerIds: string[] }
  | { type: "remove_player"; player: FieldPlayer; arrows: Arrow[] }
  | { type: "move_player"; playerId: string; prevX: number; prevY: number; prevArrows: Arrow[] }
  | { type: "add_arrow"; arrow: Arrow }
  | { type: "edit_arrow"; arrow: Arrow; prevArrow: Arrow }
  | { type: "delete_arrow"; arrow: Arrow }
  | { type: "add_ball"; ball: BallToken }
  | { type: "move_ball"; prevX: number; prevY: number; prevArrows: Arrow[] }
  | { type: "add_phase"; phase: PhaseMarker }
  | { type: "move_phase"; phaseId: string; prevX: number; prevY: number }
  | { type: "add_cone"; cone: ConeMarker }
  | { type: "move_cone"; coneId: string; prevX: number; prevY: number }
  | { type: "add_label"; label: TextLabel }
  | { type: "move_label"; labelId: string; prevX: number; prevY: number }

export const PLAY_TYPES: PlayType[] = [
  "Lineout",
  "Scrum", 
  "Backline Move",
  "Kick-off",
  "Restart",
  "Penalty",
  "Free Play",
]

export const PLAY_TYPE_COLORS: Record<PlayType, string> = {
  "Lineout": "#8B5CF6",
  "Scrum": "#F59E0B",
  "Backline Move": "#10B981",
  "Kick-off": "#3B82F6",
  "Restart": "#6366F1",
  "Penalty": "#EF4444",
  "Free Play": "#6B7280",
}

export const ARROW_TYPES: { type: ArrowType; label: string; description: string }[] = [
  { type: "run", label: "Run", description: "Solid straight arrow" },
  { type: "decoy", label: "Decoy", description: "Dashed straight arrow" },
  { type: "curve", label: "Curve", description: "Curved arc arrow" },
  { type: "pass", label: "Pass", description: "Yellow pass arrow" },
  { type: "z-left", label: "Z-Left", description: "Z-shape cut left" },
  { type: "z-right", label: "Z-Right", description: "Z-shape cut right" },
  { type: "loop", label: "Loop", description: "Looping run" },
  { type: "short", label: "Short", description: "Short gain with tick" },
]

export const RUGBY_POSITIONS: PlayerTemplate[] = [
  { number: 1, position: "Loosehead Prop", abbr: "LP" },
  { number: 2, position: "Hooker", abbr: "HK" },
  { number: 3, position: "Tighthead Prop", abbr: "TP" },
  { number: 4, position: "Lock", abbr: "LK" },
  { number: 5, position: "Lock", abbr: "LK" },
  { number: 6, position: "Blindside Flanker", abbr: "BF" },
  { number: 7, position: "Openside Flanker", abbr: "OF" },
  { number: 8, position: "Number 8", abbr: "N8" },
  { number: 9, position: "Scrum-half", abbr: "SH" },
  { number: 10, position: "Fly-half", abbr: "FH" },
  { number: 11, position: "Left Wing", abbr: "LW" },
  { number: 12, position: "Inside Centre", abbr: "IC" },
  { number: 13, position: "Outside Centre", abbr: "OC" },
  { number: 14, position: "Right Wing", abbr: "RW" },
  { number: 15, position: "Fullback", abbr: "FB" },
]
