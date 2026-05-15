'use client'

import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'

export const COLOR_PRESETS = [
  '#2563eb',
  '#dc2626',
  '#f59e0b',
  '#16a34a',
  '#ffffff',
  '#000000',
  '#a855f7',
  '#f97316',
] as const

interface PlaybookColorPickerPopoverProps {
  color: string
  onChange: (color: string) => void
  onClose: () => void
  position: { left: number; top: number }
  showDelete?: boolean
  onDelete?: () => void
}

export function PlaybookColorPickerPopover({
  color,
  onChange,
  onClose,
  position,
  showDelete = false,
  onDelete,
}: PlaybookColorPickerPopoverProps) {
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

  return (
    <div
      ref={ref}
      className="fixed z-[60] rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-2 shadow-xl"
      style={{ left: position.left, top: position.top, borderWidth: '0.5px' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-4 gap-1.5">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`h-5 w-5 rounded-full border ${
              color.toLowerCase() === preset.toLowerCase()
                ? 'border-white ring-1 ring-white/50'
                : 'border-[#444]'
            }`}
            style={{ backgroundColor: preset, borderWidth: '0.5px' }}
            aria-label={`Set colour ${preset}`}
          />
        ))}
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-7 w-full cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label="Custom colour"
      />
      {showDelete && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-[#2a2a2a] bg-[#1f1f1f] py-1.5 text-[10px] text-[#f87171] hover:bg-[#2a1a1a]"
          style={{ borderWidth: '0.5px' }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      ) : null}
    </div>
  )
}
