'use client'

import {
  BookmarkPlus,
  ClipboardList,
  Cone,
  Lock,
  Tag,
  Plus,
  Redo2,
  Undo2,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { PlayerTemplate, FieldPlayer } from '@/lib/types'
import type { FormationId } from '@/lib/play-metadata'
import { formatFormationOptionLabel, type SavedFormation } from '@/lib/saved-formations'
import type { SidebarPlacementToken } from './playbook-sidebar'
import type { Sport } from '@/lib/sport-context'
import { SportSwitcher } from './sport-switcher'

export type { FormationId }

export type SidebarTouchPlacementPayload = {
  id: string
  number: number
  position: string
  abbr: string
  team: 'attack' | 'defense'
}

function PlayerToken({
  player,
  team,
  selected,
  onSelect,
  tokenSize,
  enableTouchPlacement,
  onTouchPlacementDrag,
}: {
  player: PlayerTemplate
  team: 'attack' | 'defense'
  selected: boolean
  onSelect: () => void
  tokenSize: number
  enableTouchPlacement?: boolean
  onTouchPlacementDrag?: (payload: SidebarTouchPlacementPayload | null) => void
}) {
  const handleDragStart = (e: React.DragEvent) => {
    const data: SidebarTouchPlacementPayload = {
      id: `${team}-${player.number}-${Date.now()}`,
      number: player.number,
      position: player.position,
      abbr: player.abbr,
      team,
    }
    e.dataTransfer.setData('application/json', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'move'
  }

  const buildPlacementPayload = (): SidebarTouchPlacementPayload => ({
    id: `${team}-${player.number}-${Date.now()}`,
    number: player.number,
    position: player.position,
    abbr: player.abbr,
    team,
  })

  const isAttack = team === 'attack'

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      onTouchStart={(e) => {
        if (!enableTouchPlacement || !onTouchPlacementDrag) return
        const touch = e.touches[0]
        if (!touch) return
        e.preventDefault()
        onTouchPlacementDrag(buildPlacementPayload())
        e.stopPropagation()
      }}
      onTouchMove={(e) => {
        if (!enableTouchPlacement || !onTouchPlacementDrag) return
        const touch = e.touches[0]
        if (!touch) return
        e.preventDefault()
        onTouchPlacementDrag(buildPlacementPayload())
      }}
      onTouchEnd={() => {
        if (!enableTouchPlacement || !onTouchPlacementDrag) return
      }}
      onTouchCancel={() => {
        if (!enableTouchPlacement) return
        onTouchPlacementDrag?.(null)
      }}
      className={`flex w-[40px] flex-col items-center gap-[3px] rounded-md transition-all ${
        selected ? 'ring-1 ring-[#C0392B]' : 'hover:bg-white/5'
      }`}
      style={{ padding: '2px 8px' }}
    >
      <div
        className={`flex items-center justify-center rounded-full border text-[9px] font-bold ${
          isAttack
            ? 'border-[#2563eb] bg-[#1a3a6e] text-[#93c5fd]'
            : 'border-[#dc2626] bg-[#6e1a1a] text-[#fca5a5]'
        }`}
        style={{
          borderWidth: '0.5px',
          width: tokenSize,
          height: tokenSize,
          fontSize: tokenSize <= 22 ? 8 : 9,
        }}
      >
        {player.number}
      </div>
      <span className="text-[6px] font-medium text-[#888]">{player.abbr}</span>
    </button>
  )
}

export interface PlaybookLeftSidebarProps {
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
  isLoggedIn?: boolean
  savedFormations?: SavedFormation[]
  formationsLoading?: boolean
  formationDropdownValue?: string
  onFormationDropdownChange?: (formationId: string) => void
  onOpenSaveFormation?: () => void
  onOpenManageFormations?: () => void
  /** Desktop sidebar (default) or embedded in mobile drawer */
  variant?: 'desktop' | 'embedded'
  contentMode?: 'full' | 'players' | 'formation'
  tokenSize?: number
  enableTouchPlacement?: boolean
  onTouchPlacementDrag?: (payload: SidebarTouchPlacementPayload | null) => void
  sport?: Sport
  onSportChange?: (sport: Sport) => void
  isPremium?: boolean
  onUpgradeRequest?: () => void
}

const FORMATIONS: { id: FormationId; label: string }[] = [
  { id: 'scrum', label: 'Scrum' },
  { id: 'lineout', label: 'Lineout' },
  { id: 'both', label: 'Both Teams' },
  { id: 'kickoff', label: 'Kickoff' },
  { id: 'free-play', label: 'Free Play' },
]

function MatchStatsButton({
  isNetball,
  isPremium,
  onNavigate,
  onUpgradeRequest,
}: {
  isNetball: boolean
  isPremium: boolean
  onNavigate: () => void
  onUpgradeRequest?: () => void
}) {
  if (!isPremium) {
    return (
      <button
        type="button"
        onClick={() => onUpgradeRequest?.()}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border px-2.5 py-2 text-[11px] font-medium transition-colors hover:opacity-90"
        style={{
          background: '#1a1a1a',
          borderColor: '#2a2a2a',
          borderWidth: '0.5px',
          color: '#444',
        }}
      >
        <Lock className="h-3.5 w-3.5" strokeWidth={2} />
        Match Stats 🔒
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onNavigate}
      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border px-2.5 py-2 text-[11px] font-medium transition-colors hover:opacity-90"
      style={{
        background: isNetball ? '#1a1a2a' : '#1a2a1a',
        borderColor: isNetball ? '#a855f7' : '#16a34a',
        borderWidth: '0.5px',
        color: isNetball ? '#c084fc' : '#86efac',
      }}
    >
      <ClipboardList className="h-3.5 w-3.5" strokeWidth={2} />
      Match Stats
    </button>
  )
}

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
  isLoggedIn = false,
  savedFormations = [],
  formationsLoading = false,
  formationDropdownValue = '',
  onFormationDropdownChange,
  onOpenSaveFormation,
  onOpenManageFormations,
  variant = 'desktop',
  contentMode = 'full',
  tokenSize = 26,
  enableTouchPlacement = false,
  onTouchPlacementDrag,
  sport = 'rugby',
  onSportChange,
  isPremium = false,
  onUpgradeRequest,
}: PlaybookLeftSidebarProps) {
  const router = useRouter()
  const isNetball = sport === 'netball'
  const attackOnField = fieldPlayers.filter((p) => p.team === 'attack').length
  const defenseOnField = fieldPlayers.filter((p) => p.team === 'defense').length
  const canSaveFormation = fieldPlayers.length > 0

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

  const showPlayers = contentMode === 'full' || contentMode === 'players'
  const showFormation = contentMode === 'full' || contentMode === 'formation'
  const showHeader = variant === 'desktop'
  const showTools = contentMode === 'full' || contentMode === 'formation'

  const inner = (
    <>
      {showHeader ? (
        <div
          className="shrink-0 border-b border-[#2a2a2a] px-3 py-3"
          style={{ borderBottomWidth: '0.5px' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#C0392B] text-white">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">PlayForge</p>
              <p className="text-[9px] uppercase tracking-widest text-[#666]">
                Play Designer
              </p>
            </div>
          </div>
          {onSportChange ? (
            <div className="mt-2.5">
              <SportSwitcher sport={sport} onSportChange={onSportChange} />
            </div>
          ) : null}
          <MatchStatsButton
            isNetball={isNetball}
            isPremium={isPremium}
            onNavigate={() => router.push(isNetball ? '/stats' : '/rugby-stats')}
            onUpgradeRequest={onUpgradeRequest}
          />
        </div>
      ) : null}

      {variant === 'embedded' && onSportChange ? (
        <div className="px-3 pt-3">
          <SportSwitcher sport={sport} onSportChange={onSportChange} />
          <MatchStatsButton
            isNetball={isNetball}
            isPremium={isPremium}
            onNavigate={() => router.push(isNetball ? '/stats' : '/rugby-stats')}
            onUpgradeRequest={onUpgradeRequest}
          />
        </div>
      ) : null}

      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {showFormation ? (
          <>
        <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          Formation
        </p>
        <div className="mb-4 grid grid-cols-2 gap-1.5">
          {FORMATIONS.filter((f) => !isNetball || f.id === 'free-play').map((f) => (
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

        {isLoggedIn && (
          <div className="mb-4">
            <button
              type="button"
              onClick={onOpenSaveFormation}
              disabled={!canSaveFormation}
              className={`mb-3 flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-[11px] font-medium transition-colors ${
                canSaveFormation
                  ? 'cursor-pointer border-[#16a34a] bg-[#1f1f1f] text-[#86efac] hover:bg-[#252525]'
                  : 'cursor-not-allowed border-[#2a2a2a] bg-[#1a1a1a] text-[#555] opacity-60'
              }`}
              style={{ borderWidth: '0.5px' }}
            >
              <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={2} />
              Save Formation
            </button>

            <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-[#555]">
              My Formations
            </p>
            <select
              value={formationDropdownValue}
              onChange={(e) => onFormationDropdownChange?.(e.target.value)}
              disabled={formationsLoading}
              className="w-full rounded-md border border-[#2a2a2a] bg-[#1f1f1f] px-2 py-2 text-[11px] text-[#aaa] focus:outline-none focus:ring-1 focus:ring-[#444] disabled:opacity-60"
              style={{ borderWidth: '0.5px' }}
            >
              <option value="" disabled>
                {formationsLoading ? 'Loading...' : 'Load a formation...'}
              </option>
              {savedFormations.map((f) => (
                <option key={f.id} value={f.id}>
                  {formatFormationOptionLabel(f)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onOpenManageFormations}
              className="mt-1.5 text-[9px] text-[#555] hover:text-[#888]"
            >
              Manage
            </button>
          </div>
        )}
          </>
        ) : null}

        {showPlayers && showFormation ? (
          <div
            className="mb-3 border-t border-[#2a2a2a]"
            style={{ borderTopWidth: '0.5px' }}
          />
        ) : null}

        {showPlayers ? (
          <>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-[#60a5fa]">ATTACK</p>
          <span className="text-[9px] text-[#555]">
            {attackOnField}/{isNetball ? 7 : 15}
          </span>
        </div>
        {!isNetball ? (
          <p className="mb-1 text-[8px] uppercase text-[#555]">Forwards</p>
        ) : null}
        <div className="mb-2 flex flex-wrap gap-[3px]">
          {attackPlayers
            .filter((p) => (isNetball ? true : p.number <= 8))
            .map((player) => (
              <PlayerToken
                key={`a-${player.number}`}
                player={player}
                team="attack"
                tokenSize={tokenSize}
                enableTouchPlacement={enableTouchPlacement}
                onTouchPlacementDrag={onTouchPlacementDrag}
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
        {!isNetball ? (
          <p className="mb-1 text-[8px] uppercase text-[#555]">Backs</p>
        ) : null}
        <div className={`${isNetball ? 'hidden' : 'mb-3'} flex flex-wrap gap-[3px]`}>
          {attackPlayers
            .filter((p) => p.number > 8)
            .map((player) => (
              <PlayerToken
                key={`a-${player.number}`}
                player={player}
                team="attack"
                tokenSize={tokenSize}
                enableTouchPlacement={enableTouchPlacement}
                onTouchPlacementDrag={onTouchPlacementDrag}
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
          <span className="text-[9px] text-[#555]">
            {defenseOnField}/{isNetball ? 7 : 15}
          </span>
        </div>
        {!isNetball ? (
          <p className="mb-1 text-[8px] uppercase text-[#555]">Forwards</p>
        ) : null}
        <div className="mb-2 flex flex-wrap gap-[3px]">
          {defensePlayers
            .filter((p) => (isNetball ? true : p.number <= 8))
            .map((player) => (
              <PlayerToken
                key={`d-${player.number}`}
                player={player}
                team="defense"
                tokenSize={tokenSize}
                enableTouchPlacement={enableTouchPlacement}
                onTouchPlacementDrag={onTouchPlacementDrag}
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
        {!isNetball ? (
          <p className="mb-1 text-[8px] uppercase text-[#555]">Backs</p>
        ) : null}
        <div className={`${isNetball ? 'hidden' : 'mb-4'} flex flex-wrap gap-[3px]`}>
          {defensePlayers
            .filter((p) => p.number > 8)
            .map((player) => (
              <PlayerToken
                key={`d-${player.number}`}
                player={player}
                team="defense"
                tokenSize={tokenSize}
                enableTouchPlacement={enableTouchPlacement}
                onTouchPlacementDrag={onTouchPlacementDrag}
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
          </>
        ) : null}

        {showFormation ? (
          <>
        <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          Phases
        </p>
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
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
            title="Next phase"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mb-3 text-[9px] text-[#555]">Tap to switch phase</p>

        <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          Breakdown
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5].map((phase) => {
            const selected =
              selectedPlacementToken?.type === 'phase' &&
              selectedPlacementToken.phase === phase
            return (
              <button
                key={`breakdown-${phase}`}
                type="button"
                onClick={() =>
                  onSelectPlacementToken(
                    selected ? null : { type: 'phase', phase }
                  )
                }
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] font-bold text-black transition-all hover:opacity-80 ${
                  selected ? 'ring-1 ring-[#C0392B]' : ''
                }`}
                style={{ borderWidth: '0.5px' }}
                title={`Place breakdown marker ${phase} on field`}
              >
                {phase}
              </button>
            )
          })}
        </div>

        {showTools ? (
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
        ) : null}
          </>
        ) : null}
      </div>
    </>
  )

  if (variant === 'embedded') {
    return <div className="flex h-full w-full flex-col overflow-hidden">{inner}</div>
  }

  return (
    <aside
      className="hidden h-full w-[220px] shrink-0 flex-col overflow-hidden border-r border-[#2a2a2a] bg-[#161616] lg:flex"
      style={{ borderRightWidth: '0.5px' }}
    >
      {inner}
    </aside>
  )
}
