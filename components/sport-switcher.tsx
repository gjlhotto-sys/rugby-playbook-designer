'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { Sport } from '@/lib/sport-context'

const SPORTS: { id: Sport; label: string; emoji: string }[] = [
  { id: 'rugby', label: 'Rugby', emoji: '🏉' },
  { id: 'netball', label: 'Netball', emoji: '🏀' },
]

interface SportSwitcherProps {
  sport: Sport
  onSportChange: (sport: Sport) => void
}

export function SportSwitcher({ sport, onSportChange }: SportSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const current = SPORTS.find((s) => s.id === sport) ?? SPORTS[0]
  const isNetball = sport === 'netball'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
        style={{
          background: isNetball ? '#1a1a2a' : '#1a2a1a',
          borderColor: isNetball ? '#a855f7' : '#16a34a',
          borderWidth: '0.5px',
          color: isNetball ? '#c084fc' : '#86efac',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current.emoji}</span>
        <span>{current.label}</span>
        <span className="text-[8px] opacity-70">▾</span>
      </button>

      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] shadow-lg"
          style={{ borderWidth: '0.5px' }}
          role="listbox"
        >
          {SPORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={s.id === sport}
              onClick={() => {
                setOpen(false)
                if (s.id !== sport) onSportChange(s.id)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-[12px] text-[#ccc] transition-colors hover:bg-[#2a2a2a]"
            >
              <span className="flex items-center gap-2">
                <span>{s.emoji}</span>
                {s.label}
              </span>
              {s.id === sport ? (
                <Check className="h-3.5 w-3.5 text-[#86efac]" strokeWidth={2.5} />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
