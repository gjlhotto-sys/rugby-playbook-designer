'use client'

import { useRouter } from 'next/navigation'
import {
  Copy,
  FileType,
  Save,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/auth'
import type { FieldPlayer, TeamColors, SavedPlay, PlayType } from '@/lib/types'

const ATTACK_SWATCHES = ['#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA', '#93C5FD']
const DEFENCE_SWATCHES = ['#EF4444', '#DC2626', '#B91C1C', '#F87171', '#FCA5A5']

const PLAY_TYPE_CHIPS: { label: string; value: PlayType }[] = [
  { label: 'Attack', value: 'Backline Move' },
  { label: 'Defence', value: 'Free Play' },
  { label: 'Set Piece', value: 'Lineout' },
]

function PlayThumbnail({ play }: { play: SavedPlay }) {
  const scale = 36 / 70
  const h = 26
  return (
    <svg
      width={36}
      height={h}
      viewBox="0 0 36 26"
      className="shrink-0 rounded border border-[#2a2a2a] bg-[#14532d]"
      style={{ borderWidth: '0.5px' }}
    >
      <rect x="1" y="1" width="34" height="24" fill="#166534" rx="1" />
      {play.players.slice(0, 8).map((p, i) => (
        <circle
          key={p.id ?? i}
          cx={4 + (p.x * scale) % 30}
          cy={4 + (p.y / 110) * 18}
          r="1.8"
          fill={p.team === 'attack' ? '#3b82f6' : '#ef4444'}
        />
      ))}
    </svg>
  )
}

function playTypeTagColor(playType: PlayType): string {
  if (playType === 'Backline Move' || playType === 'Kick-off') return '#60a5fa'
  if (playType === 'Lineout' || playType === 'Scrum') return '#4ade80'
  if (playType === 'Penalty' || playType === 'Restart') return '#f87171'
  return '#9ca3af'
}

interface PlaybookRightSidebarProps {
  user: User
  profile: UserProfile | null
  isPremium: boolean
  playName: string
  playType: PlayType
  notes: string
  activePlayId: string | null
  onPlayNameChange: (name: string) => void
  onPlayTypeChange: (type: PlayType) => void
  onNotesChange: (notes: string) => void
  fieldPlayers: FieldPlayer[]
  teamColors: TeamColors
  savedPlays: SavedPlay[]
  cloudSavedPlays: SavedPlay[]
  onTeamColorChange: (
    team: 'attack' | 'defense' | 'attackArrow' | 'defenceArrow',
    color: string
  ) => void
  onSavePlay: () => void
  onLoadPlay: (play: SavedPlay) => void
  onDeletePlay: (playId: string) => void
  onDuplicatePlay: (play: SavedPlay) => void
  onExportPDF: () => void
  onExportVideo: () => void
  onSharePlay: () => void
  isSharing: boolean
  isExportingVideo: boolean
  exportVideoProgress: number
  canExportVideo: boolean
  onGenerateNotes: () => void
  onSignOut: () => void
}

export function PlaybookRightSidebar({
  user,
  profile,
  isPremium,
  playName,
  playType,
  notes,
  activePlayId,
  onPlayNameChange,
  onPlayTypeChange,
  onNotesChange,
  fieldPlayers,
  teamColors,
  savedPlays,
  cloudSavedPlays,
  onTeamColorChange,
  onSavePlay,
  onLoadPlay,
  onDeletePlay,
  onDuplicatePlay,
  onExportPDF,
  onExportVideo,
  onSharePlay,
  isSharing,
  isExportingVideo,
  exportVideoProgress,
  canExportVideo,
  onGenerateNotes,
  onSignOut,
}: PlaybookRightSidebarProps) {
  const router = useRouter()
  const hasContent = fieldPlayers.length > 0
  const allPlays = [...savedPlays, ...cloudSavedPlays]

  return (
    <aside
      className="hidden h-full w-[220px] shrink-0 flex-col overflow-hidden border-l border-[#2a2a2a] bg-[#161616] lg:flex"
      style={{ borderLeftWidth: '0.5px' }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <input
          type="text"
          value={playName}
          onChange={(e) => onPlayNameChange(e.target.value)}
          placeholder="e.g. Blindside Blitz..."
          className="mb-2 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 py-2 text-[12px] text-white placeholder:text-[#555] focus:border-[#C0392B] focus:outline-none"
          style={{ borderWidth: '0.5px' }}
        />
        <div className="mb-4 flex flex-wrap gap-1">
          {PLAY_TYPE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onPlayTypeChange(chip.value)}
              className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                playType === chip.value
                  ? 'border-[#C0392B] bg-[#C0392B] text-white'
                  : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-white'
              }`}
              style={{ borderWidth: '0.5px' }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          Team colours
        </p>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#888]">Attack</span>
          <div className="flex gap-1">
            {ATTACK_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onTeamColorChange('attack', c)}
                className="h-[18px] w-[18px] rounded-md transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  border:
                    teamColors.attack.toLowerCase() === c.toLowerCase()
                      ? '1.5px solid white'
                      : '1px solid #333',
                }}
                aria-label={`Attack colour ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#888]">Defence</span>
          <div className="flex gap-1">
            {DEFENCE_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onTeamColorChange('defense', c)}
                className="h-[18px] w-[18px] rounded-md transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  border:
                    teamColors.defense.toLowerCase() === c.toLowerCase()
                      ? '1.5px solid white'
                      : '1px solid #333',
                }}
                aria-label={`Defence colour ${c}`}
              />
            ))}
          </div>
        </div>

        <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          Coaching notes
        </p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Call words, cues, key reads..."
          className="mb-2 h-16 w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5 text-[11px] text-white placeholder:text-[#555] focus:border-[#C0392B] focus:outline-none"
          style={{ borderWidth: '0.5px' }}
        />
        <button
          type="button"
          onClick={onGenerateNotes}
          disabled={fieldPlayers.filter((p) => p.team === 'attack').length === 0}
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#4a3a9a] bg-[#1a1230] px-2 py-2 text-[11px] font-medium text-[#a78bfa] transition-opacity disabled:opacity-40"
          style={{ borderWidth: '0.5px' }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate notes with AI
        </button>

        <button
          type="button"
          onClick={onSavePlay}
          disabled={!hasContent}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C0392B] px-2 py-2.5 text-[12px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          Save Play
        </button>
        <button
          type="button"
          onClick={onExportVideo}
          disabled={isExportingVideo || (isPremium && !canExportVideo)}
          className={`mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#16a34a] bg-[#1a2a1a] px-2 py-2.5 text-[12px] font-medium text-[#86efac] disabled:opacity-40 ${!isPremium ? 'opacity-75' : ''}`}
          style={{ borderWidth: '0.5px' }}
        >
          {isExportingVideo ? (
            <>Exporting… {exportVideoProgress}%</>
          ) : (
            <>
              <Video className="h-4 w-4" />
              Export MP4{!isPremium ? ' 🔒' : ''}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSharePlay}
          disabled={isSharing || (isPremium && fieldPlayers.length === 0)}
          className={`mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2563eb] bg-[#0f1e3a] px-2 py-2.5 text-[12px] font-medium text-[#93c5fd] disabled:opacity-40 ${!isPremium ? 'opacity-75' : ''}`}
          style={{ borderWidth: '0.5px' }}
        >
          <Share2 className="h-4 w-4" />
          {isSharing ? 'Sharing…' : `Share Play${!isPremium ? ' 🔒' : ''}`}
        </button>
        <button
          type="button"
          onClick={onExportPDF}
          disabled={!hasContent}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1f1f1f] px-2 py-2.5 text-[12px] font-medium text-[#aaa] hover:text-white disabled:opacity-40"
          style={{ borderWidth: '0.5px' }}
        >
          <FileType className="h-4 w-4" />
          Export PDF
        </button>

        {profile?.role === 'admin' ? (
          <>
            <div
              className="mb-3 border-t border-[#2a2a2a]"
              style={{ borderTopWidth: '0.5px' }}
            />
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#6d28d9] bg-[#1f1230] px-2 py-2.5 text-[12px] font-medium text-[#c4b5fd]"
              style={{ borderWidth: '0.5px' }}
            >
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </button>
          </>
        ) : null}

        <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#666]">
          My plays
        </p>
        {allPlays.length === 0 ? (
          <p className="text-[10px] text-[#555]">No saved plays yet.</p>
        ) : (
          <div className="space-y-0">
            {allPlays.map((play) => {
              const isActive = activePlayId === play.id
              return (
                <div
                  key={play.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onLoadPlay(play)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onLoadPlay(play)
                  }}
                  className={`group flex cursor-pointer items-center gap-2 border-b border-[#2a2a2a] py-2 pr-1 transition-colors hover:bg-[#1a1a1a] ${
                    isActive ? 'border-l-2 border-l-[#C0392B] bg-[#1a1a1a] pl-2' : 'pl-2.5'
                  }`}
                  style={{ borderBottomWidth: '0.5px' }}
                >
                  <PlayThumbnail play={play} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-white">
                      {play.name}
                      {play.id.startsWith('cloud:') ? ' ☁' : ''}
                    </p>
                    <p
                      className="text-[9px] font-medium"
                      style={{ color: playTypeTagColor(play.playType) }}
                    >
                      {play.playType}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicatePlay(play)
                      }}
                      className="rounded p-1 text-[#666] hover:bg-[#2a2a2a] hover:text-white"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {!play.id.startsWith('cloud:') ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeletePlay(play.id)
                        }}
                        className="rounded p-1 text-[#666] hover:bg-red-900/30 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div
        className="shrink-0 border-t border-[#2a2a2a] px-3 py-2"
        style={{ borderTopWidth: '0.5px' }}
      >
        <button
          type="button"
          onClick={onSignOut}
          className="w-full text-center text-[10px] text-[#555] hover:text-[#aaa]"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
