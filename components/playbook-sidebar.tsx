"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Save, Copy } from "lucide-react"
import type { PlayerTemplate, FieldPlayer, TeamColors, SavedPlay, PlayType, BallToken, ConeMarker } from "@/lib/types"
import { PLAY_TYPES, PLAY_TYPE_COLORS } from "@/lib/types"

export type SidebarPlacementToken =
  | { type: "player"; team: "attack" | "defense"; number: number }
  | { type: "ball" }
  | { type: "cone" }
  | { type: "phase"; phase: number }

interface PlaybookSidebarProps {
  playName: string
  playType: PlayType
  notes: string
  onPlayNameChange: (name: string) => void
  onPlayTypeChange: (type: PlayType) => void
  onNotesChange: (notes: string) => void
  attackPlayers: PlayerTemplate[]
  defensePlayers: PlayerTemplate[]
  fieldPlayers: FieldPlayer[]
  ball: BallToken | null
  cones: ConeMarker[]
  teamColors: TeamColors
  savedPlays: SavedPlay[]
  onTeamColorChange: (team: "attack" | "defense" | "attackArrow" | "defenceArrow", color: string) => void
  onClearField: () => void
  onSavePlay: () => void
  onLoadPlay: (play: SavedPlay) => void
  onDeletePlay: (playId: string) => void
  onDuplicatePlay: (play: SavedPlay) => void
  onExportPDF: () => void
  selectedPlacementToken: SidebarPlacementToken | null
  onSelectPlacementToken: (token: SidebarPlacementToken | null) => void
  onApplyAttackFormation: () => void
  onApplyDefenseFormation: () => void
  onApplyBothTeamsFormation: () => void
  onApplyLineoutFormation: () => void
  onApplyScrumFormation: () => void
  onGenerateNotes: () => void
}

function PlayerToken({ 
  player, 
  team, 
  color,
  selected,
  onSelect,
}: { 
  player: PlayerTemplate
  team: "attack" | "defense"
  color: string 
  selected: boolean
  onSelect: () => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const data = {
      id: `${team}-${player.number}-${Date.now()}`,
      number: player.number,
      position: player.position,
      abbr: player.abbr,
      team,
    }
    e.dataTransfer.setData("application/json", JSON.stringify(data))
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`flex items-center gap-0.5 px-0.5 py-0.5 rounded cursor-pointer transition-all hover:opacity-80 border ${
        selected ? "border-primary ring-2 ring-primary/70 shadow-[0_0_10px_rgba(59,130,246,0.7)]" : "border-white/10"
      }`}
      style={{ backgroundColor: `${color}20` }}
    >
      <div
        className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <span className="text-[9px] font-bold text-white leading-none">{player.number}</span>
      </div>
      <span className="text-[7px] text-foreground font-medium truncate">{player.abbr}</span>
    </div>
  )
}

function BallTokenSidebar({ hasBall, selected, onSelect }: { hasBall: boolean; selected: boolean; onSelect: () => void }) {
  const handleDragStart = (e: React.DragEvent) => {
    const data = { type: "ball" }
    e.dataTransfer.setData("application/json", JSON.stringify(data))
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable={!hasBall}
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`flex items-center gap-1 px-1 py-1 rounded transition-all border border-yellow-500/30 ${
        hasBall 
          ? "opacity-40 cursor-not-allowed bg-yellow-500/10" 
          : "cursor-grab active:cursor-grabbing hover:opacity-80 bg-yellow-500/20"
      } ${selected ? "ring-2 ring-primary/70 shadow-[0_0_10px_rgba(59,130,246,0.7)]" : ""}`}
    >
      <div className="w-[20px] h-[14px] rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
        <span className="text-[6px] font-bold text-black leading-none">BALL</span>
      </div>
      <span className="text-[8px] text-foreground font-medium">Ball</span>
    </div>
  )
}

function ConeTokenSidebar({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  const handleDragStart = (e: React.DragEvent) => {
    const data = { type: "cone" }
    e.dataTransfer.setData("application/json", JSON.stringify(data))
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`flex items-center gap-1 px-1 py-1 rounded transition-all border border-orange-500/30 cursor-pointer hover:opacity-80 bg-orange-500/20 ${
        selected ? "ring-2 ring-primary/70 shadow-[0_0_10px_rgba(59,130,246,0.7)]" : ""
      }`}
    >
      <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
        <svg viewBox="0 0 20 20" className="w-full h-full">
          <polygon points="10,2 18,16 2,16" fill="#F97316" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        </svg>
      </div>
      <span className="text-[8px] text-foreground font-medium">Cone</span>
    </div>
  )
}

function PhaseTokenSidebar({ phase, selected, onSelect }: { phase: number; selected: boolean; onSelect: () => void }) {
  const handleDragStart = (e: React.DragEvent) => {
    const data = { type: "phase", phase }
    e.dataTransfer.setData("application/json", JSON.stringify(data))
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`flex items-center justify-center w-[24px] h-[24px] rounded-full bg-white cursor-pointer hover:opacity-80 transition-all border border-gray-300 ${
        selected ? "ring-2 ring-primary/70 shadow-[0_0_10px_rgba(59,130,246,0.7)]" : ""
      }`}
    >
      <span className="text-[10px] font-bold text-black leading-none">{phase}</span>
    </div>
  )
}

export function PlaybookSidebar({
  playName,
  playType,
  notes,
  onPlayNameChange,
  onPlayTypeChange,
  onNotesChange,
  attackPlayers,
  defensePlayers,
  fieldPlayers,
  ball,
  cones,
  teamColors,
  savedPlays,
  onTeamColorChange,
  onClearField,
  onSavePlay,
  onLoadPlay,
  onDeletePlay,
  onDuplicatePlay,
  onExportPDF,
  selectedPlacementToken,
  onSelectPlacementToken,
  onApplyAttackFormation,
  onApplyDefenseFormation,
  onApplyBothTeamsFormation,
  onApplyLineoutFormation,
  onApplyScrumFormation,
  onGenerateNotes,
}: PlaybookSidebarProps) {
  const [attackArrowPickerOpen, setAttackArrowPickerOpen] = useState(false)
  const [defenceArrowPickerOpen, setDefenceArrowPickerOpen] = useState(false)
  const [tempAttackArrowColor, setTempAttackArrowColor] = useState(teamColors.attackArrow ?? teamColors.attack)
  const [tempDefenceArrowColor, setTempDefenceArrowColor] = useState(teamColors.defenceArrow ?? teamColors.defense)
  const [arrowColorWarning, setArrowColorWarning] = useState<string | null>(null)
  const attackOnField = fieldPlayers.filter(p => p.team === "attack").length
  const defenseOnField = fieldPlayers.filter(p => p.team === "defense").length
  const hasContent = fieldPlayers.length > 0 || ball !== null || cones.length > 0

  const getHue = (hex: string) => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    if (d === 0) return 0
    let h = 0
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    const hue = h * 60
    return hue < 0 ? hue + 360 : hue
  }

  const hueDistance = (a: number, b: number) => {
    const raw = Math.abs(a - b)
    return Math.min(raw, 360 - raw)
  }

  const isReservedArrowColor = (color: string) => {
    const hue = getHue(color.toLowerCase())
    const yellowHue = getHue("#EAB308")
    const orangeHue = getHue("#F97316")

    if (hueDistance(hue, yellowHue) <= 20) {
      return "Yellow is reserved for passes"
    }
    if (hueDistance(hue, orangeHue) <= 20) {
      return "Orange is reserved for kicks"
    }
    return null
  }

  const applyArrowColor = (team: "attackArrow" | "defenceArrow", color: string, close: () => void) => {
    const warning = isReservedArrowColor(color)
    if (warning) {
      setArrowColorWarning(warning)
      return
    }
    setArrowColorWarning(null)
    onTeamColorChange(team, color)
    close()
  }

  return (
    <aside className="w-[160px] bg-sidebar border-l border-sidebar-border flex flex-col h-full shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-sidebar-border shrink-0">
        <h1 className="text-[10px] font-bold text-foreground">TryLine</h1>
        <p className="text-[8px] text-muted-foreground">Rugby Playbook Designer</p>
      </div>

      {/* Play Name, Type & Notes */}
      <div className="px-2 py-1.5 border-b border-sidebar-border space-y-1 shrink-0">
        <div>
          <label className="text-[8px] uppercase tracking-wider text-muted-foreground mb-0.5 block">
            Play Name
          </label>
          <Input
            value={playName}
            onChange={(e) => onPlayNameChange(e.target.value)}
            placeholder="Enter play name..."
            className="h-6 text-[10px] px-1.5"
          />
        </div>
        <div>
          <label className="text-[8px] uppercase tracking-wider text-muted-foreground mb-0.5 block">
            Play Type
          </label>
          <select
            value={playType}
            onChange={(e) => onPlayTypeChange(e.target.value as PlayType)}
            className="w-full h-6 text-[10px] px-1.5 rounded-md border border-input bg-background text-foreground"
          >
            {PLAY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[8px] uppercase tracking-wider text-muted-foreground block">
              Notes
            </label>
            <Button
              onClick={onGenerateNotes}
              size="sm"
              disabled={attackOnField === 0}
              title="AI generates coaching notes based on your drawn play"
              className="h-5 px-1.5 text-[8px] bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
            >
              📋 Generate Notes
            </Button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Coaching cues, call words..."
            className="w-full h-12 text-[9px] px-1.5 py-1 rounded-md border border-input bg-background text-foreground resize-none"
          />
        </div>
      </div>

      {/* Team Color Pickers */}
      <div className="px-2 py-1.5 border-b border-sidebar-border space-y-1 shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-[8px] text-muted-foreground">Attack Color</label>
          <input
            type="color"
            value={teamColors.attack}
            onChange={(e) => onTeamColorChange("attack", e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[8px] text-muted-foreground">Defence Color</label>
          <input
            type="color"
            value={teamColors.defense}
            onChange={(e) => onTeamColorChange("defense", e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] text-muted-foreground">Attack Arrow Color</span>
            <button
              className="w-5 h-5 rounded border border-border"
              style={{ background: teamColors.attackArrow ?? teamColors.attack }}
              onClick={() => {
                setTempAttackArrowColor(teamColors.attackArrow ?? teamColors.attack)
                setArrowColorWarning(null)
                setAttackArrowPickerOpen(true)
              }}
            />
          </div>
          {attackArrowPickerOpen && (
            <div className="absolute right-0 z-50 mt-1 bg-card border border-border rounded-md p-2 shadow-lg min-w-[120px]">
              <input
                type="color"
                value={tempAttackArrowColor}
                onChange={(e) => setTempAttackArrowColor(e.target.value)}
                className="w-full h-8 cursor-pointer rounded"
              />
              <div className="mt-1 text-[8px] text-muted-foreground flex items-center gap-1">
                <span>Preview</span>
                <span className="inline-block w-3 h-3 rounded border border-border" style={{ background: tempAttackArrowColor }} />
              </div>
              {arrowColorWarning && (
                <div className="text-[8px] text-amber-400 mt-1">{arrowColorWarning}</div>
              )}
              <div className="flex gap-1 mt-2">
                <button
                  className="flex-1 text-[10px] py-1 bg-primary text-primary-foreground rounded"
                  onClick={() => applyArrowColor("attackArrow", tempAttackArrowColor, () => setAttackArrowPickerOpen(false))}
                >Apply</button>
                <button
                  className="flex-1 text-[10px] py-1 bg-muted rounded"
                  onClick={() => {
                    setArrowColorWarning(null)
                    setAttackArrowPickerOpen(false)
                  }}
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] text-muted-foreground">Defence Arrow Color</span>
            <button
              className="w-5 h-5 rounded border border-border"
              style={{ background: teamColors.defenceArrow ?? teamColors.defense }}
              onClick={() => {
                setTempDefenceArrowColor(teamColors.defenceArrow ?? teamColors.defense)
                setArrowColorWarning(null)
                setDefenceArrowPickerOpen(true)
              }}
            />
          </div>
          {defenceArrowPickerOpen && (
            <div className="absolute right-0 z-50 mt-1 bg-card border border-border rounded-md p-2 shadow-lg min-w-[120px]">
              <input
                type="color"
                value={tempDefenceArrowColor}
                onChange={(e) => setTempDefenceArrowColor(e.target.value)}
                className="w-full h-8 cursor-pointer rounded"
              />
              <div className="mt-1 text-[8px] text-muted-foreground flex items-center gap-1">
                <span>Preview</span>
                <span className="inline-block w-3 h-3 rounded border border-border" style={{ background: tempDefenceArrowColor }} />
              </div>
              {arrowColorWarning && (
                <div className="text-[8px] text-amber-400 mt-1">{arrowColorWarning}</div>
              )}
              <div className="flex gap-1 mt-2">
                <button
                  className="flex-1 text-[10px] py-1 bg-primary text-primary-foreground rounded"
                  onClick={() => applyArrowColor("defenceArrow", tempDefenceArrowColor, () => setDefenceArrowPickerOpen(false))}
                >Apply</button>
                <button
                  className="flex-1 text-[10px] py-1 bg-muted rounded"
                  onClick={() => {
                    setArrowColorWarning(null)
                    setDefenceArrowPickerOpen(false)
                  }}
                >Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ball, Cone & Phase Tokens */}
      <div className="px-2 py-1.5 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <BallTokenSidebar
            hasBall={ball !== null}
            selected={selectedPlacementToken?.type === "ball"}
            onSelect={() =>
              onSelectPlacementToken(selectedPlacementToken?.type === "ball" ? null : { type: "ball" })
            }
          />
          <ConeTokenSidebar
            selected={selectedPlacementToken?.type === "cone"}
            onSelect={() =>
              onSelectPlacementToken(selectedPlacementToken?.type === "cone" ? null : { type: "cone" })
            }
          />
        </div>
        <p className="text-[7px] uppercase tracking-wider text-muted-foreground mb-0.5">Phase Markers</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(phase => (
            <PhaseTokenSidebar
              key={phase}
              phase={phase}
              selected={selectedPlacementToken?.type === "phase" && selectedPlacementToken.phase === phase}
              onSelect={() =>
                onSelectPlacementToken(
                  selectedPlacementToken?.type === "phase" && selectedPlacementToken.phase === phase
                    ? null
                    : { type: "phase", phase }
                )
              }
            />
          ))}
        </div>
      </div>

      {/* Formation presets */}
      <div className="px-2 py-1.5 border-b border-sidebar-border shrink-0">
        <p className="text-[8px] uppercase tracking-wider text-muted-foreground mb-1">Formations</p>
        <div className="space-y-1">
          <Button onClick={onApplyAttackFormation} variant="secondary" size="sm" className="w-full h-6 text-[9px] justify-start px-2">
            ⚡ Attack XV
          </Button>
          <Button onClick={onApplyDefenseFormation} variant="secondary" size="sm" className="w-full h-6 text-[9px] justify-start px-2">
            🛡 Defence XV
          </Button>
          <Button onClick={onApplyBothTeamsFormation} variant="secondary" size="sm" className="w-full h-6 text-[9px] justify-start px-2">
            ⚔ Both Teams
          </Button>
          <Button onClick={onApplyLineoutFormation} variant="secondary" size="sm" className="w-full h-6 text-[9px] justify-start px-2">
            🔄 Lineout
          </Button>
          <Button onClick={onApplyScrumFormation} variant="secondary" size="sm" className="w-full h-6 text-[9px] justify-start px-2">
            Scrum
          </Button>
        </div>
      </div>

      {/* Players section - scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 min-h-0">
        {/* Attack Team */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-[9px] font-semibold flex items-center gap-1" style={{ color: teamColors.attack }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: teamColors.attack }} />
              Attack
            </h2>
            <span className="text-[8px] text-muted-foreground">{attackOnField}/15</span>
          </div>
          
          <p className="text-[7px] uppercase tracking-wider text-muted-foreground mb-0.5">Forwards</p>
          <div className="grid grid-cols-2 gap-px mb-1">
            {attackPlayers.filter(p => p.number <= 8).map((player) => (
              <PlayerToken
                key={player.number}
                player={player}
                team="attack"
                color={teamColors.attack}
                selected={
                  selectedPlacementToken?.type === "player" &&
                  selectedPlacementToken.team === "attack" &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === "player" &&
                    selectedPlacementToken.team === "attack" &&
                    selectedPlacementToken.number === player.number
                      ? null
                      : { type: "player", team: "attack", number: player.number }
                  )
                }
              />
            ))}
          </div>
          
          <p className="text-[7px] uppercase tracking-wider text-muted-foreground mb-0.5">Backs</p>
          <div className="grid grid-cols-2 gap-px">
            {attackPlayers.filter(p => p.number > 8).map((player) => (
              <PlayerToken
                key={player.number}
                player={player}
                team="attack"
                color={teamColors.attack}
                selected={
                  selectedPlacementToken?.type === "player" &&
                  selectedPlacementToken.team === "attack" &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === "player" &&
                    selectedPlacementToken.team === "attack" &&
                    selectedPlacementToken.number === player.number
                      ? null
                      : { type: "player", team: "attack", number: player.number }
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Defense Team */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-[9px] font-semibold flex items-center gap-1" style={{ color: teamColors.defense }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: teamColors.defense }} />
              Defence
            </h2>
            <span className="text-[8px] text-muted-foreground">{defenseOnField}/15</span>
          </div>
          
          <p className="text-[7px] uppercase tracking-wider text-muted-foreground mb-0.5">Forwards</p>
          <div className="grid grid-cols-2 gap-px mb-1">
            {defensePlayers.filter(p => p.number <= 8).map((player) => (
              <PlayerToken
                key={player.number}
                player={player}
                team="defense"
                color={teamColors.defense}
                selected={
                  selectedPlacementToken?.type === "player" &&
                  selectedPlacementToken.team === "defense" &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === "player" &&
                    selectedPlacementToken.team === "defense" &&
                    selectedPlacementToken.number === player.number
                      ? null
                      : { type: "player", team: "defense", number: player.number }
                  )
                }
              />
            ))}
          </div>
          
          <p className="text-[7px] uppercase tracking-wider text-muted-foreground mb-0.5">Backs</p>
          <div className="grid grid-cols-2 gap-px">
            {defensePlayers.filter(p => p.number > 8).map((player) => (
              <PlayerToken
                key={player.number}
                player={player}
                team="defense"
                color={teamColors.defense}
                selected={
                  selectedPlacementToken?.type === "player" &&
                  selectedPlacementToken.team === "defense" &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === "player" &&
                    selectedPlacementToken.team === "defense" &&
                    selectedPlacementToken.number === player.number
                      ? null
                      : { type: "player", team: "defense", number: player.number }
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Saved Plays Section */}
        {savedPlays.length > 0 && (
          <div className="mt-2 pt-2 border-t border-sidebar-border">
            <h2 className="text-[9px] font-semibold text-foreground mb-1">My Plays</h2>
            <div className="space-y-1">
              {savedPlays.map((play) => (
                <div
                  key={play.id}
                  className="group flex items-center gap-1 p-1 rounded bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onLoadPlay(play)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-foreground truncate font-medium">{play.name}</span>
                    </div>
                    <span
                      className="text-[6px] px-1 py-0.5 rounded-sm font-medium text-white"
                      style={{ backgroundColor: PLAY_TYPE_COLORS[play.playType] }}
                    >
                      {play.playType}
                    </span>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicatePlay(play)
                      }}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Duplicate play"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePlay(play.id)
                      }}
                      className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      title="Delete play"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-2 py-1.5 border-t border-sidebar-border space-y-1 shrink-0">
        <Button
          onClick={onSavePlay}
          size="sm"
          className="w-full h-6 text-[9px] bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={!hasContent}
        >
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <div className="flex flex-col gap-1 mt-1">
          <Button
            onClick={onExportPDF}
            size="sm"
            variant="secondary"
            className="w-full h-6 text-[9px] px-2 justify-start"
            disabled={!hasContent}
            title="Export as PDF"
          >
            📄 Export PDF
          </Button>
        </div>
        <Button
          onClick={onClearField}
          variant="outline"
          size="sm"
          className="w-full h-6 text-[9px] border-destructive/50 text-destructive hover:bg-destructive/10"
          disabled={!hasContent}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear Field
        </Button>
      </div>
    </aside>
  )
}
