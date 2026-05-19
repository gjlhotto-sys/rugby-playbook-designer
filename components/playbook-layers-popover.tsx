'use client'

import type { RefObject } from 'react'
import type { LayerToggleKey, LayerVisibility } from '@/lib/layer-visibility'

interface LayerRow {
  key: LayerToggleKey
  label: string
  dotColor: string
}

const LAYER_ROWS: LayerRow[] = [
  { key: 'runArrows', label: 'Run arrows', dotColor: '#2563eb' },
  { key: 'passArrows', label: 'Pass arrows', dotColor: '#f59e0b' },
  { key: 'kickArrows', label: 'Kick arrows', dotColor: '#f97316' },
  { key: 'decoyArrows', label: 'Decoy arrows', dotColor: '#888888' },
  { key: 'ruckArrows', label: 'Ruck arrows', dotColor: '#ec4899' },
  { key: 'repositionArrows', label: 'Reposition arrows', dotColor: '#f59e0b' },
  { key: 'freeDrawArrows', label: 'FreeDraw arrows', dotColor: '#a855f7' },
  { key: 'defencePlayers', label: 'Defence players', dotColor: '#dc2626' },
]

interface PlaybookLayersPopoverProps {
  layerVisibility: LayerVisibility
  onToggleLayer: (key: LayerToggleKey) => void
  onResetLayers: () => void
  onArrowOpacityChange: (opacity: number) => void
  onClose: () => void
  anchorRef: RefObject<HTMLButtonElement | null>
}

function LayerToggle({
  on,
  onToggle,
}: {
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
        on ? 'bg-[#2563eb]' : 'bg-[#2a2a2a]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
          on ? 'left-3.5 bg-white' : 'left-0.5 bg-[#555]'
        }`}
      />
    </button>
  )
}

export function PlaybookLayersPopover({
  layerVisibility,
  onToggleLayer,
  onResetLayers,
  onArrowOpacityChange,
  onClose,
  anchorRef,
}: PlaybookLayersPopoverProps) {
  const rect = anchorRef.current?.getBoundingClientRect()
  if (!rect) return null

  const panelStyle = {
    position: 'fixed' as const,
    top: rect.bottom + 6,
    right: window.innerWidth - rect.right,
    zIndex: 50,
    borderWidth: '0.5px',
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        style={panelStyle}
        className="w-[220px] rounded-[10px] border border-[#2a2a2a] bg-[#1a1a1a] p-3"
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#666]">
            Layers
          </span>
          <button
            type="button"
            onClick={onResetLayers}
            className="text-[9px] text-[#555] hover:text-[#888]"
          >
            Reset All
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {LAYER_ROWS.map((row) => {
            const on = layerVisibility[row.key]
            return (
              <div key={row.key} className="flex items-center gap-2">
                <LayerToggle on={on} onToggle={() => onToggleLayer(row.key)} />
                <span
                  className="h-2 w-2 shrink-0 rounded-full transition-colors"
                  style={{ backgroundColor: on ? row.dotColor : '#333333' }}
                />
                <span
                  className={`text-[11px] transition-colors ${
                    on ? 'text-[#ccc]' : 'text-[#444]'
                  }`}
                >
                  {row.label}
                </span>
              </div>
            )
          })}
        </div>

        <div
          className="my-3 border-t border-[#2a2a2a]"
          style={{ borderTopWidth: '0.5px' }}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#888]">Arrow opacity</span>
            <span className="text-[10px] text-[#666]">
              {Math.round(layerVisibility.arrowOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.1}
            value={layerVisibility.arrowOpacity}
            onChange={(e) => onArrowOpacityChange(parseFloat(e.target.value))}
            className="h-1 w-full cursor-pointer accent-[#2563eb]"
          />
        </div>
      </div>
    </>
  )
}
