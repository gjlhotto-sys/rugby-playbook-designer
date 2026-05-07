"use client"

import type { PlayerTemplate, FieldPlayer, TeamColors, BallToken, ConeMarker } from "@/lib/types"
import type { SidebarPlacementToken } from "./playbook-sidebar"
import { Button } from "@/components/ui/button"

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
      <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
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
        hasBall ? "opacity-40 cursor-not-allowed bg-yellow-500/10" : "cursor-grab active:cursor-grabbing hover:opacity-80 bg-yellow-500/20"
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

interface PlaybookLeftSidebarProps {
  attackPlayers: PlayerTemplate[]
  defensePlayers: PlayerTemplate[]
  fieldPlayers: FieldPlayer[]
  ball: BallToken | null
  cones: ConeMarker[]
  teamColors: TeamColors
  selectedPlacementToken: SidebarPlacementToken | null
  onSelectPlacementToken: (token: SidebarPlacementToken | null) => void
  onApplyAttackFormation: () => void
  onApplyDefenseFormation: () => void
  onApplyBothTeamsFormation: () => void
  onApplyLineoutFormation: () => void
  onApplyScrumFormation: () => void
  onApplyKickoffFormation: () => void
}

export function PlaybookLeftSidebar({
  attackPlayers,
  defensePlayers,
  fieldPlayers,
  ball,
  cones,
  teamColors,
  selectedPlacementToken,
  onSelectPlacementToken,
  onApplyAttackFormation,
  onApplyDefenseFormation,
  onApplyBothTeamsFormation,
  onApplyLineoutFormation,
  onApplyScrumFormation,
  onApplyKickoffFormation,
}: PlaybookLeftSidebarProps) {
  const attackOnField = fieldPlayers.filter((p) => p.team === "attack").length
  const defenseOnField = fieldPlayers.filter((p) => p.team === "defense").length

  return (
    <aside className="w-[160px] bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0 space-y-3">
        <div>
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
            <Button onClick={onApplyKickoffFormation} variant="secondary" size="sm" className="w-full h-6 text-[9px] justify-start px-2">
              ⚽ Kick-off
            </Button>
          </div>
        </div>

        <div className="border-t border-sidebar-border" />

        <div>
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground mb-1">Players</p>

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
              {attackPlayers.filter((p) => p.number <= 8).map((player) => (
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
              {attackPlayers.filter((p) => p.number > 8).map((player) => (
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
              {defensePlayers.filter((p) => p.number <= 8).map((player) => (
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
              {defensePlayers.filter((p) => p.number > 8).map((player) => (
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
        </div>

        <div className="flex items-center gap-2">
          <BallTokenSidebar
            hasBall={ball !== null}
            selected={selectedPlacementToken?.type === "ball"}
            onSelect={() => onSelectPlacementToken(selectedPlacementToken?.type === "ball" ? null : { type: "ball" })}
          />
          <ConeTokenSidebar
            selected={selectedPlacementToken?.type === "cone"}
            onSelect={() => onSelectPlacementToken(selectedPlacementToken?.type === "cone" ? null : { type: "cone" })}
          />
        </div>

        <div>
          <p className="text-[7px] uppercase tracking-wider text-muted-foreground mb-0.5">Phase Markers</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((phase) => (
              <PhaseTokenSidebar
                key={phase}
                phase={phase}
                selected={selectedPlacementToken?.type === "phase" && selectedPlacementToken.phase === phase}
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === "phase" && selectedPlacementToken.phase === phase ? null : { type: "phase", phase }
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

