"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Save, Copy } from "lucide-react"
import type { FieldPlayer, TeamColors, SavedPlay, PlayType } from "@/lib/types"
import { PLAY_TYPES, PLAY_TYPE_COLORS } from "@/lib/types"

interface PlaybookRightSidebarProps {
  playName: string
  playType: PlayType
  notes: string
  onPlayNameChange: (name: string) => void
  onPlayTypeChange: (type: PlayType) => void
  onNotesChange: (notes: string) => void
  fieldPlayers: FieldPlayer[]
  teamColors: TeamColors
  savedPlays: SavedPlay[]
  onTeamColorChange: (team: "attack" | "defense" | "attackArrow" | "defenceArrow", color: string) => void
  onSavePlay: () => void
  onLoadPlay: (play: SavedPlay) => void
  onDeletePlay: (playId: string) => void
  onDuplicatePlay: (play: SavedPlay) => void
  onExportPDF: () => void
  onExportVideo: () => void
  isExportingVideo: boolean
  exportVideoProgress: number
  canExportVideo: boolean
  onGenerateNotes: () => void
}

export function PlaybookRightSidebar({
  playName,
  playType,
  notes,
  onPlayNameChange,
  onPlayTypeChange,
  onNotesChange,
  fieldPlayers,
  teamColors,
  savedPlays,
  onTeamColorChange,
  onSavePlay,
  onLoadPlay,
  onDeletePlay,
  onDuplicatePlay,
  onExportPDF,
  onExportVideo,
  isExportingVideo,
  exportVideoProgress,
  canExportVideo,
  onGenerateNotes,
}: PlaybookRightSidebarProps) {
  const [attackArrowPickerOpen, setAttackArrowPickerOpen] = useState(false)
  const [defenceArrowPickerOpen, setDefenceArrowPickerOpen] = useState(false)
  const [tempAttackArrowColor, setTempAttackArrowColor] = useState(teamColors.attackArrow ?? teamColors.attack)
  const [tempDefenceArrowColor, setTempDefenceArrowColor] = useState(teamColors.defenceArrow ?? teamColors.defense)
  const [arrowColorWarning, setArrowColorWarning] = useState<string | null>(null)

  const attackOnField = fieldPlayers.filter((p) => p.team === "attack").length
  const hasContent = fieldPlayers.length > 0

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
    <aside className="w-[200px] bg-sidebar border-l border-sidebar-border flex flex-col h-full shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-3 py-2 border-b border-sidebar-border">
          <h1 className="text-[11px] font-bold text-foreground">TryLine</h1>
          <p className="text-[9px] text-muted-foreground">Rugby Playbook Designer</p>
        </div>

        <div className="px-3 py-2 border-b border-sidebar-border space-y-2">
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block">Play Name</label>
            <Input value={playName} onChange={(e) => onPlayNameChange(e.target.value)} placeholder="Enter play name..." className="h-8 text-sm px-2" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block">Play Type</label>
            <select
              value={playType}
              onChange={(e) => onPlayTypeChange(e.target.value as PlayType)}
              className="w-full h-8 text-sm px-2 rounded-md border border-input bg-background text-foreground"
            >
              {PLAY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] uppercase tracking-wider text-muted-foreground block">Notes</label>
              <Button
                onClick={onGenerateNotes}
                size="sm"
                disabled={attackOnField === 0}
                title="AI generates coaching notes based on your drawn play"
                className="h-7 px-2 text-[10px] bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
              >
                📋 Generate Notes
              </Button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Coaching cues, call words..."
              className="w-full h-24 text-sm px-2 py-2 rounded-md border border-input bg-background text-foreground resize-none"
            />
          </div>
        </div>

        <div className="px-3 py-2 border-b border-sidebar-border space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground">Attack Color</label>
            <input
              type="color"
              value={teamColors.attack}
              onChange={(e) => onTeamColorChange("attack", e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground">Defence Color</label>
            <input
              type="color"
              value={teamColors.defense}
              onChange={(e) => onTeamColorChange("defense", e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>

          <div className="border-t border-sidebar-border my-2" />

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Attack Arrow Color</span>
              <button
                className="w-6 h-6 rounded border border-border"
                style={{ background: teamColors.attackArrow ?? teamColors.attack }}
                onClick={() => {
                  setTempAttackArrowColor(teamColors.attackArrow ?? teamColors.attack)
                  setArrowColorWarning(null)
                  setAttackArrowPickerOpen(true)
                }}
              />
            </div>
            {attackArrowPickerOpen && (
              <div className="absolute right-0 z-50 mt-1 bg-card border border-border rounded-md p-2 shadow-lg min-w-[140px]">
                <input type="color" value={tempAttackArrowColor} onChange={(e) => setTempAttackArrowColor(e.target.value)} className="w-full h-8 cursor-pointer rounded" />
                <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                  <span>Preview</span>
                  <span className="inline-block w-3 h-3 rounded border border-border" style={{ background: tempAttackArrowColor }} />
                </div>
                {arrowColorWarning && <div className="text-[10px] text-amber-400 mt-1">{arrowColorWarning}</div>}
                <div className="flex gap-1 mt-2">
                  <button className="flex-1 text-[11px] py-1 bg-primary text-primary-foreground rounded" onClick={() => applyArrowColor("attackArrow", tempAttackArrowColor, () => setAttackArrowPickerOpen(false))}>
                    Apply
                  </button>
                  <button
                    className="flex-1 text-[11px] py-1 bg-muted rounded"
                    onClick={() => {
                      setArrowColorWarning(null)
                      setAttackArrowPickerOpen(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Defence Arrow Color</span>
              <button
                className="w-6 h-6 rounded border border-border"
                style={{ background: teamColors.defenceArrow ?? teamColors.defense }}
                onClick={() => {
                  setTempDefenceArrowColor(teamColors.defenceArrow ?? teamColors.defense)
                  setArrowColorWarning(null)
                  setDefenceArrowPickerOpen(true)
                }}
              />
            </div>
            {defenceArrowPickerOpen && (
              <div className="absolute right-0 z-50 mt-1 bg-card border border-border rounded-md p-2 shadow-lg min-w-[140px]">
                <input type="color" value={tempDefenceArrowColor} onChange={(e) => setTempDefenceArrowColor(e.target.value)} className="w-full h-8 cursor-pointer rounded" />
                <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                  <span>Preview</span>
                  <span className="inline-block w-3 h-3 rounded border border-border" style={{ background: tempDefenceArrowColor }} />
                </div>
                {arrowColorWarning && <div className="text-[10px] text-amber-400 mt-1">{arrowColorWarning}</div>}
                <div className="flex gap-1 mt-2">
                  <button className="flex-1 text-[11px] py-1 bg-primary text-primary-foreground rounded" onClick={() => applyArrowColor("defenceArrow", tempDefenceArrowColor, () => setDefenceArrowPickerOpen(false))}>
                    Apply
                  </button>
                  <button
                    className="flex-1 text-[11px] py-1 bg-muted rounded"
                    onClick={() => {
                      setArrowColorWarning(null)
                      setDefenceArrowPickerOpen(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-3 py-2 border-b border-sidebar-border space-y-2">
          <Button onClick={onSavePlay} size="sm" className="w-full h-8 text-sm bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!hasContent}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={onExportPDF} size="sm" variant="secondary" className="w-full h-8 text-sm justify-start px-3" disabled={!hasContent} title="Export as PDF">
            📄 Export PDF
          </Button>
          <button
            onClick={onExportVideo}
            disabled={isExportingVideo || !canExportVideo}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export animation as GIF"
          >
            {isExportingVideo ? (
              <>
                <span className="animate-spin">⟳</span>
                Exporting... {exportVideoProgress}%
              </>
            ) : (
              <>🎬 Export Video</>
            )}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">Exports as GIF — share via WhatsApp</p>
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">My Plays</h2>
          </div>
          {savedPlays.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No saved plays yet.</p>
          ) : (
            <div className="space-y-1">
              {savedPlays.map((play) => (
                <div
                  key={play.id}
                  className="group flex items-center gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onLoadPlay(play)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-foreground truncate font-medium">{play.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium text-white" style={{ backgroundColor: PLAY_TYPE_COLORS[play.playType] }}>
                      {play.playType}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicatePlay(play)
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Duplicate play"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePlay(play.id)
                      }}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      title="Delete play"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

