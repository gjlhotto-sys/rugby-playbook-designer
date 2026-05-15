'use client'

import {
  Cone,
  Tag,
  Plus,
  Redo2,
  Undo2,
  Zap,
} from 'lucide-react'
import type { PlayerTemplate, FieldPlayer } from '@/lib/types'
import type { FormationId } from '@/lib/play-metadata'
import type { SidebarPlacementToken } from './playbook-sidebar'

export type { FormationId }

function PlayerToken({
  player,
  team,
  selected,
  onSelect,
}: {
  player: PlayerTemplate
  team: 'attack' | 'defense'
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
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'move'
  }

  const isAttack = team === 'attack'

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`flex w-[40px] flex-col items-center gap-[3px] rounded-md transition-all ${
        selected ? 'ring-1 ring-[#C0392B]' : 'hover:bg-white/5'
      }`}
      style={{ padding: '2px 8px' }}
    >
      <div
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border text-[9px] font-bold ${
          isAttack
            ? 'border-[#2563eb] bg-[#1a3a6e] text-[#93c5fd]'
            : 'border-[#dc2626] bg-[#6e1a1a] text-[#fca5a5]'
        }`}
        style={{ borderWidth: '0.5px' }}
      >
        {player.number}
      </div>
      <span className="text-[6px] font-medium text-[#888]">{player.abbr}</span>
    </button>
  )
}

interface PlaybookLeftSidebarProps {
  attackPlayers: PlayerTemplate[]
  defensePlayers: PlayerTemplate[]
  fieldPlayers: FieldPlayer[]
  selectedPlacementToken: SidebarPlacementToken | null
  onSelectPlacementToken: (token: SidebarPlacementToken | null) => void
  activeFormation: FormationId | null
  onFormationSelect: (id: FormationId) => void
  onApplyScrumFormation: () => void
  onApplyLineoutFormation: () => void
  onApplyBothTeamsFormation: () => void
  onApplyKickoffFormation: () => void
  onApplyFreePlayFormation: () => void
  currentPhase: number
  onPhaseSelect: (phase: number) => void
  onAddPhase: () => void
  onUndo: () => void
  canUndo: boolean
  onLabelTool: () => void
  onConeTool: () => void
}

const FORMATIONS: { id: FormationId; label: string }[] = [
  { id: 'scrum', label: 'Scrum' },
  { id: 'lineout', label: 'Lineout' },
  { id: 'both', label: 'Both Teams' },
  { id: 'kickoff', label: 'Kickoff' },
  { id: 'free-play', label: 'Free Play' },
]

export function PlaybookLeftSidebar({
  attackPlayers,
  defensePlayers,
  fieldPlayers,
  selectedPlacementToken,
  onSelectPlacementToken,
  activeFormation,
  onFormationSelect,
  onApplyScrumFormation,
  onApplyLineoutFormation,
  onApplyBothTeamsFormation,
  onApplyKickoffFormation,
  onApplyFreePlayFormation,
  currentPhase,
  onPhaseSelect,
  onAddPhase,
  onUndo,
  canUndo,
  onLabelTool,
  onConeTool,
}: PlaybookLeftSidebarProps) {
  const attackOnField = fieldPlayers.filter((p) => p.team === 'attack').length
  const defenseOnField = fieldPlayers.filter((p) => p.team === 'defense').length

  const applyFormation = (id: FormationId) => {
    onFormationSelect(id)
    switch (id) {
      case 'scrum':
        onApplyScrumFormation()
        break
      case 'lineout':
        onApplyLineoutFormation()
        break
      case 'both':
        onApplyBothTeamsFormation()
        break
      case 'kickoff':
        onApplyKickoffFormation()
        break
      case 'free-play':
        onApplyFreePlayFormation()
        break
    }
  }

  return (
    <aside
      className="hidden h-full w-[220px] shrink-0 flex-col overflow-hidden border-r border-[#2a2a2a] bg-[#161616] lg:flex"
      style={{ borderRightWidth: '0.5px' }}
    >
      <div
        className="shrink-0 border-b border-[#2a2a2a] px-3 py-3"
        style={{ borderBottomWidth: '0.5px' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[#C0392B] text-white"
          >
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">PlayForge</p>
            <p className="text-[9px] uppercase tracking-widest text-[#666]">Play Designer</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          Formation
        </p>
        <div className="mb-4 grid grid-cols-2 gap-1.5">
          {FORMATIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => applyFormation(f.id)}
              className={`rounded-md border px-2 py-2 text-[10px] font-medium transition-colors ${
                f.id === 'free-play' ? 'col-span-2' : ''
              } ${
                activeFormation === f.id
                  ? 'border-[#C0392B] bg-[#C0392B] text-white'
                  : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#aaa] hover:text-white'
              }`}
              style={{ borderWidth: '0.5px' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          className="mb-3 border-t border-[#2a2a2a]"
          style={{ borderTopWidth: '0.5px' }}
        />

        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-[#60a5fa]">ATTACK</p>
          <span className="text-[9px] text-[#555]">{attackOnField}/15</span>
        </div>
        <p className="mb-1 text-[8px] uppercase text-[#555]">Forwards</p>
        <div className="mb-2 flex flex-wrap gap-[3px]">
          {attackPlayers
            .filter((p) => p.number <= 8)
            .map((player) => (
              <PlayerToken
                key={`a-${player.number}`}
                player={player}
                team="attack"
                selected={
                  selectedPlacementToken?.type === 'player' &&
                  selectedPlacementToken.team === 'attack' &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === 'player' &&
                      selectedPlacementToken.team === 'attack' &&
                      selectedPlacementToken.number === player.number
                      ? null
                      : { type: 'player', team: 'attack', number: player.number }
                  )
                }
              />
            ))}
        </div>
        <p className="mb-1 text-[8px] uppercase text-[#555]">Backs</p>
        <div className="mb-3 flex flex-wrap gap-[3px]">
          {attackPlayers
            .filter((p) => p.number > 8)
            .map((player) => (
              <PlayerToken
                key={`a-${player.number}`}
                player={player}
                team="attack"
                selected={
                  selectedPlacementToken?.type === 'player' &&
                  selectedPlacementToken.team === 'attack' &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === 'player' &&
                      selectedPlacementToken.team === 'attack' &&
                      selectedPlacementToken.number === player.number
                      ? null
                      : { type: 'player', team: 'attack', number: player.number }
                  )
                }
              />
            ))}
        </div>

        <div
          className="mb-3 border-t border-[#2a2a2a]"
          style={{ borderTopWidth: '0.5px' }}
        />

        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-[#f87171]">DEFENCE</p>
          <span className="text-[9px] text-[#555]">{defenseOnField}/15</span>
        </div>
        <p className="mb-1 text-[8px] uppercase text-[#555]">Forwards</p>
        <div className="mb-2 flex flex-wrap gap-[3px]">
          {defensePlayers
            .filter((p) => p.number <= 8)
            .map((player) => (
              <PlayerToken
                key={`d-${player.number}`}
                player={player}
                team="defense"
                selected={
                  selectedPlacementToken?.type === 'player' &&
                  selectedPlacementToken.team === 'defense' &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === 'player' &&
                      selectedPlacementToken.team === 'defense' &&
                      selectedPlacementToken.number === player.number
                      ? null
                      : { type: 'player', team: 'defense', number: player.number }
                  )
                }
              />
            ))}
        </div>
        <p className="mb-1 text-[8px] uppercase text-[#555]">Backs</p>
        <div className="mb-4 flex flex-wrap gap-[3px]">
          {defensePlayers
            .filter((p) => p.number > 8)
            .map((player) => (
              <PlayerToken
                key={`d-${player.number}`}
                player={player}
                team="defense"
                selected={
                  selectedPlacementToken?.type === 'player' &&
                  selectedPlacementToken.team === 'defense' &&
                  selectedPlacementToken.number === player.number
                }
                onSelect={() =>
                  onSelectPlacementToken(
                    selectedPlacementToken?.type === 'player' &&
                      selectedPlacementToken.team === 'defense' &&
                      selectedPlacementToken.number === player.number
                      ? null
                      : { type: 'player', team: 'defense', number: player.number }
                  )
                }
              />
            ))}
        </div>

        <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          Phases
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => onPhaseSelect(phase)}
              className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                currentPhase === phase
                  ? 'bg-[#C0392B] text-white'
                  : 'border border-[#2a2a2a] bg-[#1f1f1f] text-[#888]'
              }`}
              style={currentPhase === phase ? undefined : { borderWidth: '0.5px' }}
            >
              {phase}
            </button>
          ))}
          <button
            type="button"
            onClick={onAddPhase}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-dashed border-[#444] text-[#666] hover:border-[#888] hover:text-[#aaa]"
            title="Add phase marker"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onConeTool}
            className={`inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#1f1f1f] px-2 py-1 text-[10px] text-[#888] hover:text-white ${
              selectedPlacementToken?.type === 'cone' ? 'ring-1 ring-[#C0392B]' : ''
            }`}
            style={{ borderWidth: '0.5px' }}
          >
            <Cone className="h-3 w-3" />
            Cone
          </button>
          <button
            type="button"
            onClick={onLabelTool}
            className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#1f1f1f] px-2 py-1 text-[10px] text-[#888] hover:text-white"
            style={{ borderWidth: '0.5px' }}
          >
            <Tag className="h-3 w-3" />
            Label
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#1f1f1f] px-2 py-1 text-[10px] text-[#888] hover:text-white disabled:opacity-40"
            style={{ borderWidth: '0.5px' }}
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-[#2a2a2a] bg-[#1f1f1f] px-2 py-1 text-[10px] text-[#555] opacity-50"
            style={{ borderWidth: '0.5px' }}
            title="Redo not available"
          >
            <Redo2 className="h-3 w-3" />
            Redo
          </button>
        </div>
      </div>
    </aside>
  )
}
