'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Trash2, X } from 'lucide-react'
import type { FormationId } from '@/lib/play-metadata'
import { FORMATION_LABELS } from '@/lib/play-metadata'
import type { SavedFormation } from '@/lib/saved-formations'

function ModalBackdrop({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
    </div>
  )
}

function useEscapeClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])
}

interface SaveFormationModalProps {
  open: boolean
  baseFormation: FormationId
  saving: boolean
  onClose: () => void
  onSave: (name: string) => Promise<boolean>
}

export function SaveFormationModal({
  open,
  baseFormation,
  saving,
  onClose,
  onSave,
}: SaveFormationModalProps) {
  const [name, setName] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEscapeClose(open, onClose)

  useEffect(() => {
    if (open) {
      setName('')
      setSavedFlash(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    if (!name.trim() || saving || savedFlash) return
    const ok = await onSave(name.trim())
    if (!ok) return
    setSavedFlash(true)
    window.setTimeout(() => {
      onClose()
    }, 1500)
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="w-[320px] rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 shadow-xl"
        style={{ borderWidth: '0.5px' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm font-medium text-white">Save Formation</h3>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Our Lineout Setup"
          disabled={saving || savedFlash}
          className="mb-2 w-full rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-xs text-white placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#16a34a] disabled:opacity-60"
          style={{ borderWidth: '0.5px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSave()
          }}
        />
        <p className="mb-4 text-[10px] text-[#666]">
          Base: {FORMATION_LABELS[baseFormation]}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!name.trim() || saving || savedFlash}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#16a34a] py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : savedFlash ? (
              '✓ Saved'
            ) : (
              'Save'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full rounded-md border border-[#2a2a2a] bg-transparent py-2 text-xs text-[#888] hover:text-white disabled:opacity-50"
            style={{ borderWidth: '0.5px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

interface ManageFormationsModalProps {
  open: boolean
  formations: SavedFormation[]
  deletingId: string | null
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}

export function ManageFormationsModal({
  open,
  formations,
  deletingId,
  onClose,
  onDelete,
}: ManageFormationsModalProps) {
  useEscapeClose(open, onClose)

  if (!open) return null

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="relative w-[320px] max-h-[70vh] overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] shadow-xl"
        style={{ borderWidth: '0.5px' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b border-[#2a2a2a] px-5 py-4"
          style={{ borderBottomWidth: '0.5px' }}
        >
          <h3 className="text-sm font-medium text-white">My Formations</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#666] hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto px-3 py-2">
          {formations.length === 0 ? (
            <li className="px-2 py-6 text-center text-xs text-[#666]">No saved formations yet.</li>
          ) : (
            formations.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-2.5 hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white">{f.name}</p>
                  <p className="text-[10px] text-[#666]">{FORMATION_LABELS[f.baseFormation]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('Delete this formation?')) return
                    void onDelete(f.id)
                  }}
                  disabled={deletingId === f.id}
                  className="shrink-0 rounded p-1.5 text-[#dc2626] hover:bg-[#dc2626]/10 disabled:opacity-50"
                  aria-label={`Delete ${f.name}`}
                >
                  {deletingId === f.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </ModalBackdrop>
  )
}
