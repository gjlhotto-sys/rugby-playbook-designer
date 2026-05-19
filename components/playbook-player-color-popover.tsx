'use client'

import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'

const PLAYER_COLOR_PRESETS_ROW_1 = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#f59e0b',
] as const

const PLAYER_COLOR_PRESETS_ROW_2 = [
  '#ffffff',
  '#000000',
  '#a855f7',
  '#f97316',
] as const

const POPOVER_WIDTH = 168
const POPOVER_HEIGHT = 196

export function clampPlayerColorPopoverPosition(
  anchor: { left: number; top: number },
  preferBelow = false
): { left: number; top: number } {
  const margin = 12
  const tokenOffset = 18
  let left = anchor.left - POPOVER_WIDTH / 2
  let top = preferBelow
    ? anchor.top + tokenOffset + margin
    : anchor.top - POPOVER_HEIGHT - margin

  if (!preferBelow && top < 8) {
    top = anchor.top + tokenOffset + margin
  }

  left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8))
  top = Math.max(8, Math.min(top, window.innerHeight - POPOVER_HEIGHT - 8))

  return { left, top }
}

interface PlaybookPlayerColorPopoverProps {
  color: string
  onChange: (color: string) => void
  onClose: () => void
  onRemove: () => void
  position: { left: number; top: number }
}

export function PlaybookPlayerColorPopover({
  color,
  onChange,
  onClose,
  onRemove,
  position,
}: PlaybookPlayerColorPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const isActive = (preset: string) =>
    color.toLowerCase() === preset.toLowerCase()

  return (
    <div
      ref={ref}
      className="fixed z-[60]"
      style={{
        left: position.left,
        top: position.top,
        width: POPOVER_WIDTH,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-[10px] px-3 py-2.5 shadow-lg"
        style={{
          backgroundColor: '#1e1e1e',
          border: '0.5px solid #3a3a3a',
        }}
      >
        <p className="mb-2 text-[9px] font-medium uppercase tracking-wide text-[#666]">
          Player colour
        </p>

        <div className="space-y-1.5">
          {[PLAYER_COLOR_PRESETS_ROW_1, PLAYER_COLOR_PRESETS_ROW_2].map(
            (row, rowIndex) => (
              <div key={rowIndex} className="flex justify-between gap-1.5">
                {row.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange(preset)}
                    className={`h-5 w-5 shrink-0 rounded-full transition-transform hover:scale-[1.15] ${
                      isActive(preset) ? 'ring-2 ring-white' : ''
                    }`}
                    style={{
                      backgroundColor: preset,
                      border:
                        preset === '#ffffff'
                          ? '0.5px solid #555'
                          : '0.5px solid transparent',
                    }}
                    aria-label={`Set colour ${preset}`}
                  />
                ))}
              </div>
            )
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="cursor-pointer rounded border-0 bg-transparent p-0"
            style={{ width: 28, height: 20 }}
            aria-label="Custom colour"
          />
          <span className="text-[9px] text-[#666]">Custom</span>
        </div>

        <div className="my-2.5 bg-[#3a3a3a]" style={{ height: '0.5px' }} />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-[#f87171] transition-opacity hover:opacity-80"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[10px]">Remove</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-[#888] transition-colors hover:text-[#ccc]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
