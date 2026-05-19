'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Eraser,
  Maximize2,
  Minus,
  MousePointer2,
  Pause,
  Pencil,
  Play,
  Plus,
  Rows3,
  Shield,
  Trash2,
} from 'lucide-react'
import { ARROW_TYPES, type ArrowType } from '@/lib/types'
import type { FieldZone } from '@/lib/field-zones'
import { PlaybookColorPickerPopover } from './playbook-color-picker-popover'

export type ToolbarTool = 'select' | 'draw' | 'erase'

interface PlaybookDesignToolbarProps {
  toolbarTool: ToolbarTool
  onToolbarToolChange: (tool: ToolbarTool) => void
  arrowType: ArrowType
  onArrowTypeChange: (type: ArrowType) => void
  arrowColor: string
  onArrowColorChange: (color: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  isAnimating: boolean
  onAnimate: () => void
  canAnimate: boolean
  onClearField: () => void
  onPresent: () => void
  activeZone: FieldZone
  onZoneChange: (zone: FieldZone) => void
}

export function PlaybookDesignToolbar({
  toolbarTool,
  onToolbarToolChange,
  arrowType,
  onArrowTypeChange,
  arrowColor,
  onArrowColorChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  isAnimating,
  onAnimate,
  canAnimate,
  onClearField,
  onPresent,
  activeZone,
  onZoneChange,
}: PlaybookDesignToolbarProps) {
  const zoneButtons: {
    id: FieldZone
    label: string
    icon: typeof Maximize2
  }[] = [
    { id: 'full', label: 'Full Field', icon: Maximize2 },
    { id: 'attack', label: 'Attack Zone', icon: ArrowUp },
    { id: 'mid', label: 'Mid Zone', icon: Rows3 },
    { id: 'defence', label: 'Defence Zone', icon: Shield },
  ]
  const [arrowColorOpen, setArrowColorOpen] = useState(false)
  const arrowColorBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (toolbarTool !== 'draw') {
      setArrowColorOpen(false)
    }
  }, [toolbarTool])

  const arrowColorPopoverPos = arrowColorBtnRef.current
    ? {
        left: arrowColorBtnRef.current.getBoundingClientRect().left,
        top: arrowColorBtnRef.current.getBoundingClientRect().bottom + 6,
      }
    : { left: 0, top: 0 }

  return (
    <div
      className="flex shrink-0 items-center gap-3 border-b border-[#2a2a2a] bg-[#161616] px-3.5 py-2"
      style={{ borderBottomWidth: '0.5px' }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className="flex overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-0.5"
          style={{ borderWidth: '0.5px' }}
        >
          {(
            [
              { id: 'select' as const, label: 'Select', icon: MousePointer2 },
              { id: 'draw' as const, label: 'Draw', icon: Pencil },
              { id: 'erase' as const, label: 'Erase', icon: Eraser },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onToolbarToolChange(id)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                toolbarTool === id
                  ? 'bg-[#C0392B] text-white'
                  : 'text-[#888] hover:text-[#ccc]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        <div
          className="h-6 w-px shrink-0 bg-[#2a2a2a]"
          style={{ width: '0.5px' }}
          aria-hidden
        />

        <div className="flex items-center gap-0.5">
          {zoneButtons.map(({ id, label, icon: Icon }) => {
            const isActive = activeZone === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onZoneChange(id)}
                className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'border border-[#2563eb] bg-[#1a2a3a] text-[#93c5fd]'
                    : 'border border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-[#ccc]'
                }`}
                style={{ borderWidth: '0.5px' }}
                title={label}
              >
                <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>

        <div
          className="h-6 w-px shrink-0 bg-[#2a2a2a]"
          style={{ width: '0.5px' }}
          aria-hidden
        />

        <button
          type="button"
          onClick={onClearField}
          className="flex shrink-0 items-center gap-1 rounded-md border border-[#2a2a2a] bg-[#1f1f1f] px-2.5 py-1.5 text-[11px] font-medium text-[#f87171] transition-colors hover:bg-[#2a1a1a]"
          style={{ borderWidth: '0.5px' }}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Clear Field
        </button>

        {toolbarTool === 'draw' ? (
          <>
            <div className="flex max-w-[min(52vw,520px)] items-center gap-1 overflow-x-auto">
              {ARROW_TYPES.map((at) => (
                <button
                  key={at.type}
                  type="button"
                  onClick={() => onArrowTypeChange(at.type)}
                  className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                    arrowType === at.type
                      ? 'border-[#2563eb] bg-[#0f1e3a] text-[#93c5fd]'
                      : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#777] hover:text-[#aaa]'
                  }`}
                  style={{ borderWidth: '0.5px' }}
                  title={at.description}
                >
                  {at.label}
                </button>
              ))}
            </div>

            <div
              className="h-5 w-px shrink-0 bg-[#2a2a2a]"
              style={{ width: '0.5px' }}
              aria-hidden
            />

            <button
              ref={arrowColorBtnRef}
              type="button"
              onClick={() => setArrowColorOpen((o) => !o)}
              className="h-4 w-4 shrink-0 rounded-full border border-[#444] transition-transform hover:scale-110"
              style={{ backgroundColor: arrowColor, width: 16, height: 16 }}
              aria-label="Arrow colour"
              title="Arrow colour"
            />
            {arrowColorOpen ? (
              <PlaybookColorPickerPopover
                color={arrowColor}
                onChange={onArrowColorChange}
                onClose={() => setArrowColorOpen(false)}
                position={arrowColorPopoverPos}
              />
            ) : null}
          </>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-white"
            style={{ borderWidth: '0.5px' }}
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[40px] text-center text-[11px] text-[#888]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-white"
            style={{ borderWidth: '0.5px' }}
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {zoom !== 1 ? (
            <button
              type="button"
              onClick={onZoomReset}
              className="rounded-md border border-[#2a2a2a] bg-[#1f1f1f] px-2 py-1 text-[10px] font-medium text-[#a78bfa] hover:text-white"
              style={{ borderWidth: '0.5px' }}
            >
              Reset
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onAnimate}
          disabled={!canAnimate}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${
            isAnimating
              ? 'border-[#f59e0b] bg-[#2a1f0a] text-[#fcd34d]'
              : 'border-[#16a34a] bg-[#1a2a1a] text-[#86efac]'
          }`}
          style={{ borderWidth: '0.5px' }}
        >
          {isAnimating ? (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              Animate
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onPresent}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-white"
          style={{ borderWidth: '0.5px' }}
          aria-label="Present fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
