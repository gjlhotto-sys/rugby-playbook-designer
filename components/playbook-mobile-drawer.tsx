'use client'

import { useState } from 'react'
import {
  ArrowLeftRight,
  PenLine,
  Save,
  Share2,
  Users,
  Video,
} from 'lucide-react'
import { ARROW_TYPES, type ArrowType } from '@/lib/types'
import {
  PlaybookLeftSidebar,
  type PlaybookLeftSidebarProps,
} from './playbook-left-sidebar'

type DrawerTab = 'players' | 'formation' | 'play'

interface PlaybookMobileDrawerPlayProps {
  playName: string
  notes: string
  onPlayNameChange: (name: string) => void
  onNotesChange: (notes: string) => void
  onSavePlay: () => void | Promise<void>
  onSharePlay: () => void
  onExportVideo: () => void
  onAnimate: () => void
  canSave: boolean
  isSharing: boolean
  isExportingVideo: boolean
  exportVideoProgress: number
  canExportVideo: boolean
  isPremium: boolean
}

interface PlaybookMobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
  isTouch: boolean
  arrowType: ArrowType
  onArrowTypeChange: (type: ArrowType) => void
  leftSidebarProps: PlaybookLeftSidebarProps
  playProps: PlaybookMobileDrawerPlayProps
}

const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'players', label: 'Players' },
  { id: 'formation', label: 'Formation' },
  { id: 'play', label: 'Play' },
]

export function PlaybookMobileDrawer({
  open,
  onOpenChange,
  isMobile,
  isTouch,
  arrowType,
  onArrowTypeChange,
  leftSidebarProps,
  playProps,
}: PlaybookMobileDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('players')
  const drawerHeight = isMobile ? '55vh' : '50vh'

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col lg:hidden"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="mx-auto mb-0 flex w-full max-w-md flex-col items-center rounded-t-xl border border-b-0 border-[#2a2a2a] bg-[#161616] px-4 py-2"
        style={{ borderWidth: '0.5px', pointerEvents: 'auto' }}
        aria-expanded={open}
        aria-label={open ? 'Close tools drawer' : 'Open tools drawer'}
      >
        <span className="mb-1 h-1 w-10 rounded-full bg-[#444]" />
        <span className="text-[10px] text-[#666]">
          {open ? 'Swipe down to close' : 'Swipe up for tools'}
        </span>
      </button>

      <div
        className="flex flex-col overflow-hidden border-t border-[#2a2a2a] bg-[#161616] transition-[height] duration-300 ease-out"
        style={{
          borderTopWidth: '0.5px',
          height: open ? drawerHeight : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div
          className="flex shrink-0 border-b border-[#2a2a2a]"
          style={{ borderBottomWidth: '0.5px' }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-center text-[12px] font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-[#C0392B] text-white'
                  : 'text-[#888]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {tab === 'players' ? (
            <PlaybookLeftSidebar
              {...leftSidebarProps}
              variant="embedded"
              contentMode="players"
              tokenSize={isMobile ? 22 : 26}
              enableTouchPlacement
            />
          ) : null}

          {tab === 'formation' ? (
            <div className="px-1 pb-4">
              <PlaybookLeftSidebar
                {...leftSidebarProps}
                variant="embedded"
                contentMode="formation"
                tokenSize={isMobile ? 22 : 26}
              />
              <div className="border-t border-[#2a2a2a] px-3 pt-3" style={{ borderTopWidth: '0.5px' }}>
                <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#666]">
                  Arrow types
                </p>
                <div className="flex flex-wrap gap-1">
                  {ARROW_TYPES.map((at) => {
                    if (isTouch && at.type === 'freedraw') return null
                    if (leftSidebarProps.sport === 'netball' && at.type === 'ruck')
                      return null
                    const isRuck = at.type === 'ruck'
                    const isReposition = at.type === 'reposition'
                    const isFreeDraw = at.type === 'freedraw'
                    const isActive = arrowType === at.type
                    return (
                      <button
                        key={at.type}
                        type="button"
                        onClick={() => onArrowTypeChange(at.type)}
                        className={`flex shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-[11px] font-medium ${
                          isActive
                            ? isRuck
                              ? 'border-[#ec4899] bg-[#2a0a1a] text-[#ec4899]'
                              : isReposition
                                ? 'border-[#f59e0b] bg-[#1a1a2a] text-[#fcd34d]'
                                : isFreeDraw
                                  ? 'border-[#a855f7] bg-[#1a1a2e] text-[#c084fc]'
                                  : 'border-[#2563eb] bg-[#0f1e3a] text-[#93c5fd]'
                            : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#777]'
                        }`}
                        style={{ borderWidth: '0.5px' }}
                      >
                        {isRuck ? (
                          <Users className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : isReposition ? (
                          <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : isFreeDraw ? (
                          <PenLine className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : null}
                        {at.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'play' ? (
            <div className="space-y-3 px-3 py-3">
              <input
                type="text"
                value={playProps.playName}
                onChange={(e) => playProps.onPlayNameChange(e.target.value)}
                placeholder="Play name"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 py-2.5 text-[13px] text-white placeholder:text-[#555] focus:border-[#C0392B] focus:outline-none"
                style={{ borderWidth: '0.5px' }}
              />
              <textarea
                value={playProps.notes}
                onChange={(e) => playProps.onNotesChange(e.target.value)}
                placeholder="Coaching notes..."
                className="h-20 w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-[12px] text-white placeholder:text-[#555] focus:border-[#C0392B] focus:outline-none"
                style={{ borderWidth: '0.5px' }}
              />
              <button
                type="button"
                onClick={() => void playProps.onSavePlay()}
                disabled={!playProps.canSave}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C0392B] py-3 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                Save Play
              </button>
              <button
                type="button"
                onClick={playProps.onSharePlay}
                disabled={playProps.isSharing}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2563eb] bg-[#0f1e3a] py-3 text-[13px] font-medium text-[#93c5fd] disabled:opacity-40"
                style={{ borderWidth: '0.5px' }}
              >
                <Share2 className="h-4 w-4" />
                {playProps.isSharing ? 'Sharing…' : 'Share Play'}
              </button>
              <button
                type="button"
                onClick={playProps.onExportVideo}
                disabled={playProps.isExportingVideo || !playProps.canExportVideo}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#16a34a] bg-[#1a2a1a] py-3 text-[13px] font-medium text-[#86efac] disabled:opacity-40"
                style={{ borderWidth: '0.5px' }}
              >
                <Video className="h-4 w-4" />
                {playProps.isExportingVideo
                  ? `Exporting… ${playProps.exportVideoProgress}%`
                  : 'Export MP4'}
              </button>
              <button
                type="button"
                onClick={playProps.onAnimate}
                disabled={!playProps.canExportVideo}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#f59e0b] bg-[#2a1f0a] py-3 text-[13px] font-medium text-[#fcd34d] disabled:opacity-40"
                style={{ borderWidth: '0.5px' }}
              >
                Animate play
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
