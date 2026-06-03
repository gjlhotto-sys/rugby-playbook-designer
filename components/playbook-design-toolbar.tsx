'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Eraser,
  Maximize2,
  Minus,
  MousePointer2,
  Pause,
  PenLine,
  Pencil,
  Play,
  Plus,
  Rows3,
  Shield,
  Trash2,
  Users,
  ArrowLeftRight,
  Layers,
} from 'lucide-react'
import { ARROW_TYPES, type ArrowType } from '@/lib/types'
import type { FieldZone } from '@/lib/field-zones'
import type { Sport } from '@/lib/sport-context'
import type { LayerToggleKey, LayerVisibility } from '@/lib/layer-visibility'
import { PlaybookColorPickerPopover } from './playbook-color-picker-popover'
import { PlaybookLayersPopover } from './playbook-layers-popover'

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
  layerVisibility: LayerVisibility
  onToggleLayer: (key: LayerToggleKey) => void
  onResetLayers: () => void
  onArrowOpacityChange: (opacity: number) => void
  isTouch?: boolean
  compactPortrait?: boolean
  isMobile?: boolean
  sport?: Sport
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
  layerVisibility,
  onToggleLayer,
  onResetLayers,
  onArrowOpacityChange,
  isTouch = false,
  compactPortrait = false,
  isMobile = false,
  sport = 'rugby',
}: PlaybookDesignToolbarProps) {
  const isNetball = sport === 'netball'
  const zoneButtons: {
    id: FieldZone
    label: string
    icon: typeof Maximize2
  }[] = isNetball
    ? [
        { id: 'full', label: 'Full Court', icon: Maximize2 },
        { id: 'attack', label: 'Attacking Third', icon: ArrowUp },
        { id: 'mid', label: 'Centre Third', icon: Rows3 },
        { id: 'defence', label: 'Defending Third', icon: Shield },
      ]
    : [
        { id: 'full', label: 'Full Field', icon: Maximize2 },
        { id: 'attack', label: 'Attack Zone', icon: ArrowUp },
        { id: 'mid', label: 'Mid Zone', icon: Rows3 },
        { id: 'defence', label: 'Defence Zone', icon: Shield },
      ]
  const [arrowColorOpen, setArrowColorOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const arrowColorBtnRef = useRef<HTMLButtonElement>(null)
  const layersBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (toolbarTool !== 'draw') {
      setArrowColorOpen(false)
    }
  }, [toolbarTool])

  useEffect(() => {
    if (!layersOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLayersOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [layersOpen])

  const arrowColorPopoverPos = arrowColorBtnRef.current
    ? {
        left: arrowColorBtnRef.current.getBoundingClientRect().left,
        top: arrowColorBtnRef.current.getBoundingClientRect().bottom + 6,
      }
    : { left: 0, top: 0 }

  return (
    <div
      className={`flex shrink-0 flex-wrap items-center gap-3 border-b border-[#2a2a2a] bg-[#161616] px-3.5 py-2 ${
        compactPortrait ? 'flex-col items-stretch' : ''
      }`}
      style={{ borderBottomWidth: '0.5px' }}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
              className={`flex items-center gap-1 rounded-md font-medium transition-colors md:max-lg:min-h-10 md:max-lg:px-3 md:max-lg:py-2 ${
                compactPortrait || isMobile
                  ? 'min-h-10 px-3 py-2 text-[11px]'
                  : 'px-2.5 py-1.5 text-[11px]'
              } ${
                toolbarTool === id
                  ? 'bg-[#C0392B] text-white'
                  : 'text-[#888] hover:text-[#ccc]'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className={isMobile ? 'sr-only' : undefined}>{label}</span>
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
                className={`flex items-center gap-1 rounded-md font-medium transition-colors md:max-lg:min-h-10 md:max-lg:px-3 md:max-lg:py-2 ${
                  compactPortrait || isMobile
                    ? 'min-h-10 px-3 py-2 text-[10px]'
                    : 'px-2 py-1.5 text-[10px]'
                } ${
                  isActive
                    ? 'border border-[#2563eb] bg-[#1a2a3a] text-[#93c5fd]'
                    : 'border border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-[#ccc]'
                }`}
                style={{ borderWidth: '0.5px' }}
                title={label}
              >
                <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
                <span className={compactPortrait ? 'sr-only' : 'hidden sm:inline'}>
                  {label}
                </span>
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
          className={`flex shrink-0 items-center gap-1 rounded-md border border-[#2a2a2a] bg-[#1f1f1f] font-medium text-[#f87171] transition-colors hover:bg-[#2a1a1a] md:max-lg:min-h-10 md:max-lg:px-3 md:max-lg:py-2 ${
            compactPortrait || isMobile
              ? 'min-h-10 px-3 py-2 text-[11px]'
              : 'px-2.5 py-1.5 text-[11px]'
          }`}
          style={{ borderWidth: '0.5px' }}
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className={isMobile ? 'sr-only' : undefined}>Clear Field</span>
        </button>

        {toolbarTool === 'draw' && !compactPortrait ? (
          <>
            <div className="flex flex-wrap gap-1">
              {ARROW_TYPES.map((at) => {
                if (isTouch && at.type === 'freedraw') return null
                if (isNetball && at.type === 'ruck') return null
                if (isNetball && at.type === 'kick') return null
                const isRuck = at.type === 'ruck'
                const isReposition = at.type === 'reposition'
                const isFreeDraw = at.type === 'freedraw'
                const isActive = arrowType === at.type
                return (
                  <button
                    key={at.type}
                    type="button"
                    onClick={() => onArrowTypeChange(at.type)}
                    className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                      isActive
                        ? isRuck
                          ? 'border-[#ec4899] bg-[#2a0a1a] text-[#ec4899]'
                          : isReposition
                            ? 'border-[#f59e0b] bg-[#1a1a2a] text-[#fcd34d]'
                            : isFreeDraw
                              ? 'border-[#a855f7] bg-[#1a1a2e] text-[#c084fc]'
                              : 'border-[#2563eb] bg-[#0f1e3a] text-[#93c5fd]'
                        : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#777] hover:text-[#aaa]'
                    }`}
                    style={{ borderWidth: '0.5px' }}
                    title={at.description}
                  >
                    {isRuck ? (
                      <Users className="h-3 w-3 shrink-0" strokeWidth={2} />
                    ) : isReposition ? (
                      <ArrowLeftRight className="h-3 w-3 shrink-0" strokeWidth={2} />
                    ) : isFreeDraw ? (
                      <PenLine className="h-3 w-3 shrink-0" strokeWidth={2} />
                    ) : null}
                    {at.label}
                  </button>
                )
              })}
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

      <div
        className={`ml-auto flex shrink-0 items-center gap-2 ${
          compactPortrait ? 'hidden' : ''
        }`}
      >
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

        <div className="relative">
          <button
            ref={layersBtnRef}
            type="button"
            onClick={() => setLayersOpen((open) => !open)}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              layersOpen
                ? 'border-[#555] bg-[#252525] text-[#ccc]'
                : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-[#ccc]'
            }`}
            style={{ borderWidth: '0.5px' }}
          >
            <Layers className="h-3.5 w-3.5" strokeWidth={2} />
            Layers
          </button>
          {layersOpen ? (
            <PlaybookLayersPopover
              layerVisibility={layerVisibility}
              onToggleLayer={onToggleLayer}
              onResetLayers={onResetLayers}
              onArrowOpacityChange={onArrowOpacityChange}
              onClose={() => setLayersOpen(false)}
              anchorRef={layersBtnRef}
            />
          ) : null}
        </div>

        {!compactPortrait ? (
          <>
            <button
              type="button"
              onClick={onAnimate}
              disabled={!canAnimate}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40 md:max-lg:min-h-10 md:max-lg:px-3 md:max-lg:py-2 ${
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
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#1f1f1f] text-[#888] hover:text-white md:max-lg:min-h-10 md:max-lg:min-w-10"
              style={{ borderWidth: '0.5px' }}
              aria-label="Present fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>

      {compactPortrait ? (
        <div className="flex w-full shrink-0 items-center gap-2 border-t border-[#2a2a2a] pt-2 md:max-lg:min-h-10">
          <button
            type="button"
            onClick={onAnimate}
            disabled={!canAnimate}
            className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-semibold disabled:opacity-40 ${
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
        </div>
      ) : null}
    </div>
  )
}
