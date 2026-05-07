'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { loadPlayFromCloud } from '@/lib/play-sharing'
import { RugbyField } from '@/components/rugby-field'
import type { PlayData } from '@/lib/play-sharing'

export default function PlayViewPage() {
  const params = useParams()
  const shareId = params.shareId as string
  const [play, setPlay] = useState<PlayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!shareId) return
    loadPlayFromCloud(shareId).then((data) => {
      if (data) setPlay(data)
      else setError(true)
      setLoading(false)
    })
  }, [shareId])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-2xl mb-2">🏉</div>
        <p className="text-sm text-muted-foreground">Loading play...</p>
      </div>
    </div>
  )

  if (error || !play) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Play not found.</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div>
          <h1 className="text-sm font-bold">
            {play.name || 'Untitled Play'}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {play.play_type} • TryLine
          </p>
        </div>
        <div className="text-lg">🏉</div>
      </div>

      {/* Field - takes most of screen */}
      <div className="flex-1 overflow-hidden p-2">
        <RugbyField
          players={play.players ?? []}
          arrows={play.arrows ?? []}
          ball={play.ball ?? null}
          phases={play.phases ?? []}
          cones={play.cones ?? []}
          labels={play.labels ?? []}
          selectedPlayerId={null}
          selectedBall={false}
          selectedArrowId={null}
          mode="move"
          arrowType="run"
          passerSelected={null}
          teamColors={play.team_colors ?? { attack: '#3B82F6', defense: '#EF4444' }}
          zoom={100}
          animationSpeed={1}
          onFieldClick={() => {}}
          onPlayerDrop={() => {}}
          onBallDrop={() => {}}
          onPhaseDrop={() => {}}
          onConeDrop={() => {}}
          onPlayerSelect={() => {}}
          onPasserSelect={() => {}}
          onCreatePassArrow={() => {}}
          onBallSelect={() => {}}
          onArrowSelect={() => {}}
          onPlayerDragStart={() => {}}
          onPlayerDrag={() => {}}
          onPlayerDragEnd={() => {}}
          onBallDragStart={() => {}}
          onBallDrag={() => {}}
          onBallDragEnd={() => {}}
          onPhaseDragStart={() => {}}
          onPhaseDrag={() => {}}
          onPhaseDragEnd={() => {}}
          onConeDragStart={() => {}}
          onConeDrag={() => {}}
          onConeDragEnd={() => {}}
          onLabelDragStart={() => {}}
          onLabelDrag={() => {}}
          onLabelDragEnd={() => {}}
          onDeletePlayer={() => {}}
          onDeleteBall={() => {}}
          onDeletePhase={() => {}}
          onDeleteCone={() => {}}
          onDeleteLabel={() => {}}
          onClearPlayerArrows={() => {}}
          onClearBallArrows={() => {}}
          onArrowUpdate={() => {}}
          onArrowDelete={() => {}}
          onArrowTypeChange={() => {}}
          onTextLabelCreate={() => {}}
        />
      </div>

      {/* Notes section if present */}
      {play.notes && (
        <div className="px-4 py-2 border-t border-border bg-card">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Coaching Notes
          </p>
          <p className="text-xs text-foreground">{play.notes}</p>
        </div>
      )}
    </div>
  )
}

