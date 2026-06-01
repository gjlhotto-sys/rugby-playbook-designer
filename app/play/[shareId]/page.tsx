'use client'

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ComponentProps,
} from 'react'
import { useParams } from 'next/navigation'
import { loadPlayFromCloud } from '@/lib/play-sharing'
import { RugbyField, type RugbyFieldHandle } from '@/components/rugby-field'
import type { PlayData } from '@/lib/play-sharing'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return isMobile
}

export default function PlayViewPage() {
  const params = useParams()
  const shareId = params.shareId as string
  const isMobile = useIsMobile()
  const [play, setPlay] = useState<PlayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1)
  const [isLandscape, setIsLandscape] = useState(false)
  const fieldRef = useRef<RugbyFieldHandle | null>(null)

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  useEffect(() => {
    if (!shareId) return
    loadPlayFromCloud(shareId).then((data) => {
      if (data) setPlay(data)
      else setError(true)
      setLoading(false)
    })
  }, [shareId])

  const sportEmoji = play?.sport === 'netball' ? '🏐' : '🏉'

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: play?.name || 'PlayForge Play',
        text:
          play?.sport === 'netball'
            ? 'Check out this netball play'
            : 'Check out this rugby play',
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied!')
    }
  }, [play?.name])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mb-3 text-4xl animate-bounce">🏉</div>
          <p className="text-sm text-gray-400">Loading play...</p>
        </div>
      </div>
    )
  }

  if (error || !play) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="px-6 text-center">
          <div className="mb-3 text-4xl">😕</div>
          <p className="mb-1 font-semibold text-white">Play not found</p>
          <p className="text-sm text-gray-400">This link may have expired or been deleted.</p>
        </div>
      </div>
    )
  }

  const fieldProps: Omit<ComponentProps<typeof RugbyField>, 'ref'> = {
    players: play.players ?? [],
    arrows: play.arrows ?? [],
    ball: play.ball ?? null,
    phases: play.phases ?? [],
    cones: play.cones ?? [],
    labels: play.labels ?? [],
    ruckMarkers: play.ruck_markers ?? [],
    selectedPlayerId: null,
    selectedBall: false,
    selectedArrowId: null,
    mode: 'move',
    arrowType: 'run',
    passerSelected: null,
    teamColors:
      play.team_colors ?? {
        attack: '#3B82F6',
        defense: '#EF4444',
      },
    zoom: 100,
    hideControls: true,
    animationSpeed: speed,
    sport: play.sport ?? 'rugby',
    onFieldClick: () => {},
    onPlayerDrop: () => {},
    onBallDrop: () => {},
    onPhaseDrop: () => {},
    onConeDrop: () => {},
    onPlayerSelect: () => {},
    onPasserSelect: () => {},
    onCreatePassArrow: () => {},
    onBallSelect: () => {},
    onArrowSelect: () => {},
    onPlayerDragStart: () => {},
    onPlayerDrag: () => {},
    onPlayerDragEnd: () => {},
    onBallDragStart: () => {},
    onBallDrag: () => {},
    onBallDragEnd: () => {},
    onPhaseDragStart: () => {},
    onPhaseDrag: () => {},
    onPhaseDragEnd: () => {},
    onConeDragStart: () => {},
    onConeDrag: () => {},
    onConeDragEnd: () => {},
    onLabelDragStart: () => {},
    onLabelDrag: () => {},
    onLabelDragEnd: () => {},
    onDeletePlayer: () => {},
    onDeleteBall: () => {},
    onDeletePhase: () => {},
    onDeleteCone: () => {},
    onDeleteLabel: () => {},
    onClearPlayerArrows: () => {},
    onClearBallArrows: () => {},
    onArrowUpdate: () => {},
    onArrowDelete: () => {},
    onArrowTypeChange: () => {},
    onTextLabelCreate: () => {},
  }

  if (isLandscape) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
        <div className="relative flex-1">
          <RugbyField ref={fieldRef} {...fieldProps} />
        </div>

        <div className="flex w-16 flex-col items-center justify-center gap-4 border-l border-gray-800 bg-gray-900 py-4">
          <button
            type="button"
            onClick={() => fieldRef.current?.play()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 active:bg-green-500"
          >
            <svg
              className="ml-0.5 h-5 w-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => fieldRef.current?.pause()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 active:bg-amber-400"
          >
            <svg
              className="h-4 w-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => fieldRef.current?.reset()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 active:bg-gray-600"
          >
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <div className="h-px w-8 bg-gray-700" />

          {([0.5, 1, 2] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`h-8 w-10 rounded text-[10px] font-medium transition-colors ${
                speed === s
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {s}x
            </button>
          ))}

          <div className="flex-1" />
          <button
            type="button"
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 active:bg-gray-600"
          >
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col bg-gray-950"
      style={{ height: '100dvh' }}
    >
      {/* HEADER */}
      <div
        className={`flex flex-shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 ${
          isMobile ? 'pt-[max(8px,env(safe-area-inset-top))]' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{sportEmoji}</span>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white">
              {play.name || 'Untitled Play'}
            </h1>
            <p className="text-[10px] text-gray-400">
              {play.play_type} • PlayForge
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="rounded-full bg-gray-800 p-2 transition-colors active:bg-gray-700"
        >
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>

      {/* FIELD - takes remaining space */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <RugbyField ref={fieldRef} {...fieldProps} />
      </div>

      {/* PLAYBACK CONTROLS - big thumb friendly */}
      <div
        className={`flex-shrink-0 border-t border-gray-800 bg-gray-900 px-4 py-3 ${
          isMobile
            ? 'pb-[max(12px,env(safe-area-inset-bottom))]'
            : ''
        }`}
      >
        <div className="mb-3 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => fieldRef.current?.reset()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 transition-colors active:bg-gray-600"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => fieldRef.current?.play()}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 shadow-lg transition-colors active:bg-green-500"
          >
            <svg
              className="ml-1 h-7 w-7 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => fieldRef.current?.pause()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 transition-colors active:bg-amber-400"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[10px] text-gray-400">Speed:</span>
            {([0.5, 1, 2] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  speed === s
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 active:bg-gray-600'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {play.notes && (
            <button
              type="button"
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex items-center gap-1 rounded bg-gray-700 px-3 py-1 transition-colors active:bg-gray-600"
            >
              <span className="text-[11px] text-gray-300">
                {notesExpanded ? 'Hide Notes' : 'Show Notes'}
              </span>
              <svg
                className={`h-3 w-3 text-gray-300 transition-transform ${
                  notesExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {notesExpanded && play.notes && (
          <div className="mt-2 rounded-lg border border-gray-700 bg-gray-800 p-3">
            <p className="text-[11px] leading-relaxed text-gray-300">
              {play.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
