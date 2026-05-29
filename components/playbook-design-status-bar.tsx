'use client'

interface PlaybookDesignStatusBarProps {
  hasUnsavedChanges: boolean
  playerCount: number
  arrowCount: number
  currentPhase: number
  totalPhases: number
  onCyclePhase: () => void
  userLabel: string
  compactPortrait?: boolean
  tabletLandscape?: boolean
}

export function PlaybookDesignStatusBar({
  hasUnsavedChanges,
  playerCount,
  arrowCount,
  currentPhase,
  totalPhases,
  onCyclePhase,
  userLabel,
  compactPortrait = false,
  tabletLandscape = false,
}: PlaybookDesignStatusBarProps) {
  if (compactPortrait) {
    return null
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-between gap-3 border-t border-[#2a2a2a] bg-[#161616] px-3.5 ${
        tabletLandscape ? 'py-1' : 'py-1.5'
      }`}
      style={{ borderTopWidth: '0.5px' }}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] text-[#888]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasUnsavedChanges ? 'bg-amber-400' : 'bg-green-400'
            }`}
          />
          {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
        </span>
        <span className="text-[#444]">|</span>
        <span>{playerCount} players on field</span>
        <span className="text-[#444]">|</span>
        <span>{arrowCount} arrows</span>
        <span className="text-[#444]">|</span>
        <button
          type="button"
          onClick={onCyclePhase}
          className="rounded px-1 text-[#aaa] transition-colors hover:bg-[#1f1f1f] hover:text-white"
        >
          Phase {currentPhase} of {totalPhases}
        </button>
      </div>
      <p className="max-w-[140px] truncate text-[10px] text-[#555]">{userLabel}</p>
    </div>
  )
}
