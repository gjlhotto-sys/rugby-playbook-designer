'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserProfile, isPremiumProfile } from '@/lib/auth'
import {
  ArrowLeft,
  Pause,
  Play,
  Square,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  GOAL_STATS,
  MatchData,
  NEGATIVE_STATS,
  NetballPosition,
  NETBALL_POSITIONS_ORDER,
  NETBALL_POSITION_LABELS,
  PlayerEntry,
  POSITIVE_STATS,
  SavedTeam,
  StatEntry,
  StatType,
  STAT_LABELS,
  getActivePlayer,
  loadCurrentMatch,
  loadSavedTeams,
  persistCurrentMatch,
  persistSavedTeams,
} from '@/lib/stats-types'
import {
  buildReportHtml,
  buildReportText,
  computeGoalScoring,
  computeMatchTotals,
  computePlayerStatLines,
  formatPct,
  getSubstitutionLog,
  scoringColor,
} from './report-utils'

type Screen = 'setup' | 'live' | 'report'

const ACCENT = '#a855f7'

function emptyPlayersRecord(): Record<NetballPosition, PlayerEntry[]> {
  return NETBALL_POSITIONS_ORDER.reduce(
    (acc, pos) => {
      acc[pos] = []
      return acc
    },
    {} as Record<NetballPosition, PlayerEntry[]>
  )
}

function emptyScores() {
  return {
    1: { us: 0, them: 0 },
    2: { us: 0, them: 0 },
    3: { us: 0, them: 0 },
    4: { us: 0, them: 0 },
  } as Record<number, { us: number; them: number }>
}

function formatClock(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60)
  const s = Math.floor(Math.max(0, seconds) % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function StatsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const checkAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        router.push('/login')
        return
      }
      const profile = await getUserProfile()
      if (cancelled) return
      if (!isPremiumProfile(profile)) {
        router.push('/?upgrade=stats')
        return
      }
      setAuthed(true)
      setAuthChecked(true)
    }
    checkAccess()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="mb-2 animate-bounce text-4xl">🏐</div>
          <p className="text-sm text-gray-400">Loading Match Stats…</p>
        </div>
      </div>
    )
  }

  if (!authed) return null

  return <StatsApp />
}

function StatsApp() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('setup')
  const [match, setMatch] = useState<MatchData | null>(null)

  // Restore an in-progress match if present.
  useEffect(() => {
    const existing = loadCurrentMatch()
    if (existing && !existing.matchComplete) {
      setMatch(existing)
      setScreen('live')
    } else if (existing && existing.matchComplete) {
      setMatch(existing)
      setScreen('report')
    }
  }, [])

  // Persist match whenever it changes.
  useEffect(() => {
    if (match) persistCurrentMatch(match)
  }, [match])

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="mx-auto w-full max-w-[480px]">
        {screen === 'setup' && (
          <SetupScreen
            onBack={() => router.push('/')}
            onStart={(m) => {
              setMatch(m)
              setScreen('live')
            }}
          />
        )}
        {screen === 'live' && match && (
          <LiveScreen
            match={match}
            setMatch={setMatch}
            onViewReport={() => setScreen('report')}
          />
        )}
        {screen === 'report' && match && (
          <ReportScreen
            match={match}
            onNewMatch={(keepRoster) => {
              const roster = keepRoster ? match : null
              persistCurrentMatch(null)
              setMatch(null)
              setScreen('setup')
              if (roster) {
                // stash roster names for setup to pre-fill
                sessionStorage.setItem(
                  'playforge-stats-prefill',
                  JSON.stringify(buildRosterPrefill(roster))
                )
              }
            }}
            onBackToLive={() => setScreen('live')}
          />
        )}
      </div>
    </div>
  )
}

function buildRosterPrefill(match: MatchData) {
  const names: Record<string, string> = {}
  for (const pos of NETBALL_POSITIONS_ORDER) {
    const active = getActivePlayer(match, pos)
    names[pos] = active?.name ?? ''
  }
  return { teamName: match.teamName, oppositionName: match.oppositionName, names }
}

/* -------------------------------------------------------------------------- */
/* SCREEN 1: SETUP                                                            */
/* -------------------------------------------------------------------------- */

const DURATION_PRESETS = [6, 10, 15]

function SetupScreen({
  onBack,
  onStart,
}: {
  onBack: () => void
  onStart: (match: MatchData) => void
}) {
  const [teamName, setTeamName] = useState('')
  const [oppositionName, setOppositionName] = useState('')
  const [duration, setDuration] = useState(6)
  const [customDuration, setCustomDuration] = useState('')
  const [names, setNames] = useState<Record<NetballPosition, string>>(() =>
    NETBALL_POSITIONS_ORDER.reduce(
      (acc, p) => {
        acc[p] = ''
        return acc
      },
      {} as Record<NetballPosition, string>
    )
  )
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')

  useEffect(() => {
    setSavedTeams(loadSavedTeams())
    try {
      const raw = sessionStorage.getItem('playforge-stats-prefill')
      if (raw) {
        const data = JSON.parse(raw) as {
          teamName: string
          oppositionName: string
          names: Record<string, string>
        }
        setTeamName(data.teamName ?? '')
        setOppositionName(data.oppositionName ?? '')
        setNames((prev) => ({ ...prev, ...(data.names as Record<NetballPosition, string>) }))
        sessionStorage.removeItem('playforge-stats-prefill')
      }
    } catch {
      /* ignore */
    }
  }, [])

  const effectiveDuration = customDuration
    ? Math.max(1, parseInt(customDuration, 10) || duration)
    : duration

  const allNamesFilled = NETBALL_POSITIONS_ORDER.every((p) => names[p].trim())
  const canStart = teamName.trim() !== '' && allNamesFilled

  const handleLoadTeam = (id: string) => {
    setSelectedTeamId(id)
    const team = savedTeams.find((t) => t.id === id)
    if (team) {
      setNames((prev) => ({ ...prev, ...team.players }))
    }
  }

  const handleSaveTeam = () => {
    if (!teamName.trim()) {
      alert('Enter a team name before saving.')
      return
    }
    const team: SavedTeam = {
      id: `team-${Date.now()}`,
      name: teamName.trim(),
      players: { ...names },
      lastUsed: new Date().toISOString(),
    }
    const next = [team, ...savedTeams.filter((t) => t.name !== team.name)]
    persistSavedTeams(next)
    setSavedTeams(next)
    setSelectedTeamId(team.id)
  }

  const handleStart = () => {
    if (!canStart) return
    const players = emptyPlayersRecord()
    for (const pos of NETBALL_POSITIONS_ORDER) {
      players[pos] = [{ position: pos, name: names[pos].trim(), isOnField: true }]
    }
    const match: MatchData = {
      id: `match-${Date.now()}`,
      teamName: teamName.trim(),
      oppositionName: oppositionName.trim() || 'Opposition',
      quarterDuration: effectiveDuration,
      date: new Date().toLocaleDateString(),
      players,
      stats: [],
      scores: emptyScores(),
      currentQuarter: 1,
      matchComplete: false,
    }
    onStart(match)
  }

  const inputClass =
    'w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-white placeholder-[#555] focus:border-[#a855f7] focus:outline-none'

  return (
    <div className="px-4 pb-32 pt-4">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#161616] text-[#aaa]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#a855f7] text-white">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <h1 className="text-[18px] font-semibold text-white">Match Setup</h1>
      </div>

      <div className="space-y-3">
        <input
          className={inputClass}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. Leeuwenhof 1st Team"
          aria-label="Your team name"
        />
        <input
          className={inputClass}
          value={oppositionName}
          onChange={(e) => setOppositionName(e.target.value)}
          placeholder="e.g. Paarl Gim"
          aria-label="Opposition team name"
        />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-[13px] font-medium text-[#ccc]">Quarter Duration</p>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((d) => {
            const active = !customDuration && duration === d
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDuration(d)
                  setCustomDuration('')
                }}
                className="min-h-[48px] flex-1 rounded-md border px-3 text-[14px] font-medium transition-colors"
                style={{
                  background: active ? ACCENT : '#1f1f1f',
                  borderColor: active ? ACCENT : '#2a2a2a',
                  borderWidth: '0.5px',
                  color: active ? '#fff' : '#888',
                }}
              >
                {d} min
              </button>
            )
          })}
          <input
            type="number"
            inputMode="numeric"
            value={customDuration}
            onChange={(e) => setCustomDuration(e.target.value)}
            placeholder="Custom"
            className="min-h-[48px] w-24 rounded-md border border-[#2a2a2a] bg-[#1f1f1f] px-3 text-center text-[14px] text-white placeholder-[#555] focus:border-[#a855f7] focus:outline-none"
            aria-label="Custom quarter duration in minutes"
          />
        </div>
      </div>

      {savedTeams.length > 0 && (
        <div className="mt-6">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#666]">
            Load Previous Team
          </p>
          <select
            value={selectedTeamId}
            onChange={(e) => handleLoadTeam(e.target.value)}
            className="w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-white focus:border-[#a855f7] focus:outline-none"
          >
            <option value="">Select a saved team…</option>
            {savedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[#555]">Or enter new team below</p>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {NETBALL_POSITIONS_ORDER.map((pos) => (
          <div key={pos} className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[12px] font-bold"
              style={{
                background: '#1a1a2a',
                border: '0.5px solid #a855f7',
                color: '#c084fc',
              }}
              title={NETBALL_POSITION_LABELS[pos]}
            >
              {pos}
            </div>
            <input
              className={inputClass}
              value={names[pos]}
              onChange={(e) =>
                setNames((prev) => ({ ...prev, [pos]: e.target.value }))
              }
              placeholder="Player name"
              aria-label={`${NETBALL_POSITION_LABELS[pos]} name`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSaveTeam}
        className="mt-4 min-h-[48px] w-full rounded-md border border-[#2a2a2a] bg-transparent text-[13px] text-[#666] transition-colors hover:text-[#999]"
      >
        Save Team for Next Time
      </button>

      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className="mt-3 min-h-[56px] w-full rounded-lg text-[16px] font-semibold transition-opacity"
        style={{
          background: canStart ? ACCENT : '#2a2a2a',
          color: canStart ? '#fff' : '#666',
          padding: '16px',
        }}
      >
        Start Match
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* SCREEN 2: LIVE MATCH                                                       */
/* -------------------------------------------------------------------------- */

function LiveScreen({
  match,
  setMatch,
  onViewReport,
}: {
  match: MatchData
  setMatch: React.Dispatch<React.SetStateAction<MatchData | null>>
  onViewReport: () => void
}) {
  const totalSeconds = match.quarterDuration * 60
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [selectedPos, setSelectedPos] = useState<NetballPosition | null>(null)
  const [flashStat, setFlashStat] = useState<StatType | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const [viewingQuarter, setViewingQuarter] = useState(match.currentQuarter)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isViewingCurrent = viewingQuarter === match.currentQuarter

  useEffect(() => {
    setViewingQuarter(match.currentQuarter)
  }, [match.currentQuarter])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= totalSeconds) {
            setRunning(false)
            return totalSeconds
          }
          return e + 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, totalSeconds])

  const remaining = totalSeconds - elapsed

  const recordStat = (stat: StatType) => {
    if (!isViewingCurrent || !selectedPos) return
    const active = getActivePlayer(match, selectedPos)
    if (!active) return
    const entry: StatEntry = {
      id: `stat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      quarter: match.currentQuarter,
      timeInQuarter: elapsed,
      playerId: selectedPos,
      playerName: active.name,
      stat,
      timestamp: Date.now(),
    }
    setMatch((prev) => (prev ? { ...prev, stats: [...prev.stats, entry] } : prev))
    setFlashStat(stat)
    setTimeout(() => setFlashStat(null), 300)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50)
    }
    setSelectedPos(null)
  }

  const deleteStat = (id: string) => {
    if (!confirm('Delete this stat entry?')) return
    setMatch((prev) =>
      prev ? { ...prev, stats: prev.stats.filter((s) => s.id !== id) } : prev
    )
  }

  const adjustScore = (team: 'us' | 'them', delta: number) => {
    setMatch((prev) => {
      if (!prev) return prev
      const q = prev.currentQuarter
      const cur = prev.scores[q] ?? { us: 0, them: 0 }
      const updated = {
        ...cur,
        [team]: Math.max(0, cur[team] + delta),
      }
      return { ...prev, scores: { ...prev.scores, [q]: updated } }
    })
  }

  const endQuarter = () => {
    setRunning(false)
    if (match.currentQuarter >= 4) {
      setMatch((prev) => (prev ? { ...prev, matchComplete: true } : prev))
      onViewReport()
      return
    }
    setMatch((prev) =>
      prev ? { ...prev, currentQuarter: prev.currentQuarter + 1 } : prev
    )
    setElapsed(0)
    setSelectedPos(null)
  }

  const totals = computeMatchTotals(match)
  const recentStats = [...match.stats].slice(-5).reverse()

  const playerSummary = (pos: NetballPosition) => {
    const active = getActivePlayer(match, pos)
    if (!active) return { name: '', faults: 0, goals: 0, positives: 0 }
    let faults = 0
    let goals = 0
    let positives = 0
    for (const s of match.stats) {
      if (s.playerId === pos && s.playerName === active.name) {
        if (NEGATIVE_STATS.includes(s.stat)) faults += 1
        if (s.stat === 'goal_shot') goals += 1
        else if (POSITIVE_STATS.includes(s.stat)) positives += 1
      }
    }
    return { name: active.name, faults, goals, positives }
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b bg-[#161616] px-3 py-2"
        style={{ borderBottomWidth: '0.5px', borderColor: '#2a2a2a' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-10 text-[20px] font-bold" style={{ color: ACCENT }}>
            Q{match.currentQuarter}
          </span>
          <span className="flex-1 text-center font-mono text-[36px] font-bold leading-none text-white tabular-nums">
            {formatClock(remaining)}
          </span>
          <span className="w-10" />
        </div>

        {/* Score controls directly below the timer */}
        <div className="mt-2 flex justify-center">
          <div
            className="flex items-center gap-4 rounded-xl bg-[#1a1a1a]"
            style={{ padding: '12px 20px' }}
          >
            <TeamScore
              name={match.teamName}
              value={match.scores[match.currentQuarter]?.us ?? 0}
              onAdd={() => adjustScore('us', 1)}
              onSub={() => adjustScore('us', -1)}
            />
            <span className="text-[20px] text-[#555]">—</span>
            <TeamScore
              name={match.oppositionName}
              value={match.scores[match.currentQuarter]?.them ?? 0}
              onAdd={() => adjustScore('them', 1)}
              onSub={() => adjustScore('them', -1)}
            />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setRunning(true)}
            disabled={running || remaining <= 0}
            className="flex items-center gap-1 rounded-md border border-[#16a34a] bg-[#0a1f0a] px-3 py-1.5 text-[12px] text-[#86efac] disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5" /> Start
          </button>
          <button
            type="button"
            onClick={() => setRunning(false)}
            disabled={!running}
            className="flex items-center gap-1 rounded-md border border-[#f59e0b] bg-[#1a1a0a] px-3 py-1.5 text-[12px] text-[#fcd34d] disabled:opacity-40"
          >
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
          <button
            type="button"
            onClick={endQuarter}
            className="flex items-center gap-1 rounded-md border border-[#a855f7] bg-[#1a0a2a] px-3 py-1.5 text-[12px] text-[#c084fc]"
          >
            <Square className="h-3.5 w-3.5" /> End Quarter
          </button>
        </div>
      </div>

      <div className="px-3 pt-3">
        {/* Quarter navigation */}
        <div className="mb-3 flex gap-1.5">
          {[1, 2, 3, 4].map((q) => {
            const completed = q < match.currentQuarter
            const active = q === viewingQuarter
            return (
              <button
                key={q}
                type="button"
                onClick={() => setViewingQuarter(q)}
                disabled={q > match.currentQuarter}
                className="flex-1 rounded-md py-2 text-[13px] font-medium transition-colors"
                style={{
                  background: active ? ACCENT : '#1f1f1f',
                  color: active
                    ? '#fff'
                    : completed
                      ? '#555'
                      : q > match.currentQuarter
                        ? '#444'
                        : '#888',
                }}
              >
                Q{q}
              </button>
            )
          })}
        </div>

        {!isViewingCurrent && (
          <div className="mb-3 rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-center text-[12px] text-[#888]">
            Viewing Q{viewingQuarter} (read only).{' '}
            <button
              type="button"
              className="underline"
              style={{ color: ACCENT }}
              onClick={() => setViewingQuarter(match.currentQuarter)}
            >
              Back to live
            </button>
          </div>
        )}

        {/* Player selector */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {NETBALL_POSITIONS_ORDER.map((pos) => {
            const summary = playerSummary(pos)
            const selected = selectedPos === pos
            return (
              <button
                key={pos}
                type="button"
                onClick={() =>
                  isViewingCurrent &&
                  setSelectedPos((cur) => (cur === pos ? null : pos))
                }
                className="flex h-[64px] min-w-[76px] flex-1 flex-col items-center justify-center rounded-xl px-1 text-center"
                style={{
                  background: selected ? '#1a0a2a' : '#1a1a1a',
                  border: selected ? `2px solid ${ACCENT}` : '0.5px solid #2a2a2a',
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: ACCENT }}>
                  {pos}
                </span>
                <span className="w-full truncate px-0.5 text-[13px] text-white">
                  {summary.name}
                </span>
                <span className="text-[9px]">
                  {summary.goals > 0 && (
                    <span className="text-[#86efac]">{summary.goals} goal{summary.goals > 1 ? 's' : ''} </span>
                  )}
                  {summary.faults > 0 && (
                    <span className="text-[#f87171]">{summary.faults} fault{summary.faults > 1 ? 's' : ''}</span>
                  )}
                  {summary.goals === 0 && summary.faults === 0 && (
                    <span className="text-[#555]">—</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stat buttons */}
        {selectedPos && isViewingCurrent && (
          <div className="mb-4 space-y-2">
            <div>
              <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-[#f87171]">
                Faults
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {NEGATIVE_STATS.filter((s) => !GOAL_STATS.includes(s)).map((stat) => (
                  <StatButton
                    key={stat}
                    label={STAT_LABELS[stat]}
                    flash={flashStat === stat}
                    variant="negative"
                    heightPx={48}
                    fontPx={13}
                    onClick={() => recordStat(stat)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-[#86efac]">
                Positive
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {POSITIVE_STATS.filter((s) => !GOAL_STATS.includes(s)).map((stat) => (
                  <StatButton
                    key={stat}
                    label={STAT_LABELS[stat]}
                    flash={flashStat === stat}
                    variant="positive"
                    heightPx={48}
                    fontPx={13}
                    onClick={() => recordStat(stat)}
                  />
                ))}
              </div>
            </div>
            {(selectedPos === 'GS' || selectedPos === 'GA') && (
              <div>
                <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-[#f59e0b]">
                  Goals
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <StatButton
                    label="Goal Shot ✓"
                    flash={flashStat === 'goal_shot'}
                    variant="positive"
                    heightPx={64}
                    fontPx={15}
                    bold
                    onClick={() => recordStat('goal_shot')}
                  />
                  <StatButton
                    label="Goal Missed ✗"
                    flash={flashStat === 'goal_missed'}
                    variant="negative"
                    heightPx={64}
                    fontPx={15}
                    bold
                    onClick={() => recordStat('goal_missed')}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent feed */}
        {recentStats.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#666]">
              Recent
            </p>
            <div className="space-y-1">
              {recentStats.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => deleteStat(s.id)}
                  className="flex w-full items-center justify-between rounded-md border border-[#2a2a2a] bg-[#161616] px-2.5 py-2 text-left text-[12px]"
                >
                  <span className="text-[#bbb]">
                    {formatClock(s.timeInQuarter)} — {s.playerName} ({s.playerId}) —{' '}
                    <span
                      className={
                        POSITIVE_STATS.includes(s.stat)
                          ? 'text-[#86efac]'
                          : 'text-[#f87171]'
                      }
                    >
                      {STAT_LABELS[s.stat]}
                    </span>
                  </span>
                  <Trash2 className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mb-4 text-center text-[11px] text-[#555]">
          Faults: {totals.totalFaults} · Positives: {totals.totalPositives}
        </p>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px] space-y-2 bg-[#0f0f0f] px-3 pb-3 pt-2">
        {match.matchComplete ? (
          <button
            type="button"
            onClick={onViewReport}
            className="min-h-[48px] w-full rounded-lg text-[15px] font-semibold text-white"
            style={{ background: ACCENT }}
          >
            View Match Report
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRunning(false)
              setSubOpen(true)
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-[#f59e0b] bg-[#1a1a0a] text-[15px] font-medium text-[#fcd34d]"
          >
            <Users className="h-4 w-4" /> Sub Player
          </button>
        )}
      </div>

      {subOpen && (
        <SubstitutionOverlay
          match={match}
          onClose={() => setSubOpen(false)}
          onConfirm={(pos, newName) => {
            setMatch((prev) => {
              if (!prev) return prev
              const entries = [...(prev.players[pos] ?? [])]
              const activeIdx = entries.findIndex((e) => e.isOnField)
              if (activeIdx >= 0) {
                entries[activeIdx] = {
                  ...entries[activeIdx],
                  isOnField: false,
                  substitutedAt: prev.currentQuarter,
                }
              }
              entries.push({ position: pos, name: newName, isOnField: true })
              return {
                ...prev,
                players: { ...prev.players, [pos]: entries },
              }
            })
            setSubOpen(false)
          }}
        />
      )}
    </div>
  )
}

function TeamScore({
  name,
  value,
  onAdd,
  onSub,
}: {
  name: string
  value: number
  onAdd: () => void
  onSub: () => void
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 max-w-[120px] truncate text-[11px] text-[#888]">{name}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSub}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2a2a2a] text-[20px] leading-none text-[#aaa] active:opacity-80"
          aria-label={`Decrease ${name} score`}
        >
          −
        </button>
        <span className="min-w-[28px] text-center text-[28px] font-bold text-white tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2a2a2a] text-[20px] leading-none text-[#aaa] active:opacity-80"
          aria-label={`Increase ${name} score`}
        >
          +
        </button>
      </div>
    </div>
  )
}

function StatButton({
  label,
  variant,
  flash,
  onClick,
  heightPx = 56,
  fontPx = 14,
  bold = false,
}: {
  label: string
  variant: 'negative' | 'positive'
  flash: boolean
  onClick: () => void
  heightPx?: number
  fontPx?: number
  bold?: boolean
}) {
  const negative = variant === 'negative'
  const base = negative ? '#1f0a0a' : '#0a1f0a'
  const flashBg = negative ? '#3a1212' : '#123a12'
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border transition-colors active:opacity-80"
      style={{
        height: heightPx,
        fontSize: fontPx,
        fontWeight: bold ? 600 : 500,
        background: flash ? flashBg : base,
        borderColor: negative ? '#f87171' : '#16a34a',
        borderWidth: '0.5px',
        color: negative ? '#f87171' : '#86efac',
      }}
    >
      {label}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* SCREEN 3: SUBSTITUTION OVERLAY                                             */
/* -------------------------------------------------------------------------- */

function SubstitutionOverlay({
  match,
  onClose,
  onConfirm,
}: {
  match: MatchData
  onClose: () => void
  onConfirm: (pos: NetballPosition, newName: string) => void
}) {
  const [selectedPos, setSelectedPos] = useState<NetballPosition | null>(null)
  const [newName, setNewName] = useState('')

  const canConfirm = selectedPos !== null && newName.trim() !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full max-w-[480px] rounded-t-2xl border-t border-[#2a2a2a] bg-[#161616] p-4 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white">Player Substitution</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2a2a2a] text-[#aaa]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-[12px] font-medium text-[#ccc]">Player coming OFF</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {NETBALL_POSITIONS_ORDER.map((pos) => {
            const active = getActivePlayer(match, pos)
            const selected = selectedPos === pos
            return (
              <button
                key={pos}
                type="button"
                onClick={() => setSelectedPos(pos)}
                className="flex min-h-[48px] items-center gap-2 rounded-md border px-2.5 py-2 text-left"
                style={{
                  background: selected ? '#1a0a2a' : '#1a1a1a',
                  borderColor: selected ? ACCENT : '#2a2a2a',
                  borderWidth: selected ? '2px' : '0.5px',
                }}
              >
                <span className="text-[11px] font-bold" style={{ color: ACCENT }}>
                  {pos}
                </span>
                <span className="truncate text-[13px] text-white">
                  {active?.name ?? '—'}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mb-2 text-[12px] font-medium text-[#ccc]">New Player Name</p>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Replacement player name"
          className="mb-4 w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-white placeholder-[#555] focus:border-[#a855f7] focus:outline-none"
        />

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => canConfirm && onConfirm(selectedPos!, newName.trim())}
          className="mb-2 min-h-[48px] w-full rounded-lg text-[15px] font-semibold text-white disabled:opacity-40"
          style={{ background: '#f59e0b' }}
        >
          Confirm Substitution
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] w-full rounded-lg border border-[#2a2a2a] bg-transparent text-[14px] text-[#888]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* SCREEN 4: REPORT                                                          */
/* -------------------------------------------------------------------------- */

function ReportScreen({
  match,
  onNewMatch,
  onBackToLive,
}: {
  match: MatchData
  onNewMatch: (keepRoster: boolean) => void
  onBackToLive: () => void
}) {
  const totals = computeMatchTotals(match)
  const lines = computePlayerStatLines(match)
  const subs = getSubstitutionLog(match)
  const scoring = computeGoalScoring(match)
  const [activeQuarter, setActiveQuarter] = useState(1)
  const allStats: StatType[] = [...NEGATIVE_STATS, ...POSITIVE_STATS]

  const shareWhatsApp = () => {
    const text = encodeURIComponent(buildReportText(match))
    const win = window.open(`whatsapp://send?text=${text}`, '_blank')
    if (!win) {
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }
  }

  const exportPdf = () => {
    const html = buildReportHtml(match)
    const win = window.open('', '_blank')
    if (!win) {
      alert('Please allow pop-ups to export the report.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  const emailReport = () => {
    const subject = encodeURIComponent(
      `Match Report — ${match.teamName} vs ${match.oppositionName}`
    )
    const body = encodeURIComponent(buildReportText(match))
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleNewMatch = () => {
    const keep = confirm('Start a new match with the same team roster?')
    onNewMatch(keep)
  }

  const quarterLines = lines
    .map((line) => ({
      line,
      counts: line.byQuarter[activeQuarter],
    }))
    .filter((l) => l.counts)
    .map((l) => {
      let faults = 0
      let positives = 0
      for (const s of NEGATIVE_STATS) faults += l.counts![s] ?? 0
      for (const s of POSITIVE_STATS) positives += l.counts![s] ?? 0
      const goals = l.counts!.goal_shot ?? 0
      return { ...l, faults, positives, goals }
    })
    .sort((a, b) => b.faults + b.positives - (a.faults + a.positives))

  return (
    <div className="px-4 pb-32 pt-4">
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToLive}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#161616] text-[#aaa]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[18px] font-semibold text-white">Match Report</h1>
      </div>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 text-center">
        <p className="text-[14px] text-[#ccc]">
          {match.teamName} <span className="text-[#666]">vs</span>{' '}
          {match.oppositionName}
        </p>
        <p className="mb-2 text-[11px] text-[#666]">{match.date}</p>
        <p className="text-[40px] font-extrabold leading-none text-white tabular-nums">
          {totals.usGoals} <span className="text-[#555]">—</span> {totals.themGoals}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <SummaryCard label="Goals" value={totals.usGoals} color="#86efac" />
        <SummaryCard label="Faults" value={totals.totalFaults} color="#f87171" />
        <SummaryCard label="Positives" value={totals.totalPositives} color="#86efac" />
      </div>

      {/* Goal scoring card */}
      <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
        <p className="mb-3 text-[16px] font-semibold text-white">Goal Scoring</p>
        <GoalScoringRow
          label={`GS — ${scoring.GS.names.join(' / ') || '—'}`}
          pct={scoring.GS.pct}
        />
        <div className="my-2 border-t border-[#2a2a2a]" />
        <GoalScoringRow
          label={`GA — ${scoring.GA.names.join(' / ') || '—'}`}
          pct={scoring.GA.pct}
        />
        <div className="my-2 border-t border-[#2a2a2a]" />
        <GoalScoringRow label="Overall" pct={scoring.overall.pct} emphasis />
      </div>

      {/* Per quarter */}
      <h2 className="mb-2 mt-6 text-[10px] font-medium uppercase tracking-wider text-[#666]">
        Per Quarter
      </h2>
      <div className="mb-2 flex gap-1.5">
        {[1, 2, 3, 4].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setActiveQuarter(q)}
            className="flex-1 rounded-md py-2 text-[13px] font-medium"
            style={{
              background: activeQuarter === q ? ACCENT : '#1f1f1f',
              color: activeQuarter === q ? '#fff' : '#888',
            }}
          >
            Q{q}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
        <p className="mb-2 text-center text-[13px] text-[#ccc]">
          Q{activeQuarter} Score: {match.scores[activeQuarter]?.us ?? 0} —{' '}
          {match.scores[activeQuarter]?.them ?? 0}
        </p>
        {quarterLines.length === 0 ? (
          <p className="py-2 text-center text-[12px] text-[#555]">No stats recorded</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[#666]">
                <th className="py-1 text-left">Player</th>
                <th className="py-1">Faults</th>
                <th className="py-1">Positives</th>
                <th className="py-1">Goals</th>
              </tr>
            </thead>
            <tbody>
              {quarterLines.map(({ line, faults, positives, goals }) => (
                <tr key={`${line.position}-${line.name}`} className="border-t border-[#2a2a2a]">
                  <td className="py-1.5 text-left text-white">
                    {line.position} {line.name}
                  </td>
                  <td className="py-1.5 text-center text-[#f87171]">{faults}</td>
                  <td className="py-1.5 text-center text-[#86efac]">{positives}</td>
                  <td className="py-1.5 text-center text-[#86efac]">{goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Full table */}
      <h2 className="mb-2 mt-6 text-[10px] font-medium uppercase tracking-wider text-[#666]">
        Full Player Stats
      </h2>
      <div className="overflow-x-auto rounded-xl border border-[#2a2a2a] bg-[#161616]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[#666]">
              <th className="px-2 py-2 text-left">Player</th>
              {allStats.map((s) => (
                <th key={s} className="px-1 py-2 text-center whitespace-nowrap">
                  {STAT_LABELS[s]}
                </th>
              ))}
              <th className="px-2 py-2 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={`${line.position}-${line.name}`} className="border-t border-[#2a2a2a]">
                <td className="px-2 py-2 text-left font-semibold text-white whitespace-nowrap">
                  {line.position} {line.name}
                </td>
                {allStats.map((s) => {
                  const v = line.counts[s]
                  const positive = POSITIVE_STATS.includes(s)
                  return (
                    <td
                      key={s}
                      className="px-1 py-2 text-center"
                      style={{ color: v === 0 ? '#555' : positive ? '#86efac' : '#f87171' }}
                    >
                      {v}
                    </td>
                  )
                })}
                <td className="px-2 py-2 text-center font-bold text-white">
                  {line.faults + line.positives}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {subs.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-[10px] font-medium uppercase tracking-wider text-[#666]">
            Substitutions
          </h2>
          <ul className="space-y-1">
            {subs.map((s, i) => (
              <li
                key={i}
                className="rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-[12px] text-[#bbb]"
              >
                {s}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Fixed bottom share bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto grid w-full max-w-[480px] grid-cols-4 gap-1.5 border-t border-[#2a2a2a] bg-[#0f0f0f] px-2 py-2">
        <ShareButton label="WhatsApp" emoji="📤" onClick={shareWhatsApp} />
        <ShareButton label="PDF" emoji="📄" onClick={exportPdf} />
        <ShareButton label="Email" emoji="📧" onClick={emailReport} />
        <ShareButton label="New" emoji="🔄" onClick={handleNewMatch} />
      </div>
    </div>
  )
}

function GoalScoringRow({
  label,
  pct,
  emphasis = false,
}: {
  label: string
  pct: number | null
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-[#aaa]">{label}</span>
      <span
        className="font-semibold tabular-nums"
        style={{
          fontSize: emphasis ? 18 : 16,
          fontWeight: emphasis ? 700 : 600,
          color: scoringColor(pct),
        }}
      >
        {formatPct(pct)}
      </span>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] py-3">
      <p className="text-[22px] font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-[#666]">{label}</p>
    </div>
  )
}

function ShareButton({
  label,
  emoji,
  onClick,
}: {
  label: string
  emoji: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] flex-col items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#161616] text-[11px] text-[#ccc] active:opacity-80"
    >
      <span className="text-[16px]">{emoji}</span>
      {label}
    </button>
  )
}
