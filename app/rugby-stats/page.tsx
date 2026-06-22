'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  BACKS,
  FORWARDS,
  MatchMode,
  RUGBY_POSITIONS_STATS,
  RUGBY_STAT_GROUPS,
  RUGBY_STAT_GROUP_ORDER,
  RUGBY_STAT_LABELS,
  RugbyMatchData,
  RugbyPlayerEntry,
  RugbySavedTeam,
  RugbyStatEntry,
  RugbyStatGroupId,
  RugbyStatType,
  buildRugbyReportHtml,
  buildRugbyReportText,
  calculateUsScore,
  computeRugbyKpis,
  computeRugbyStatLines,
  formatRugbyPct,
  getActiveRugbyPlayer,
  getRugbySubstitutionLog,
  loadRugbyCurrentMatch,
  loadRugbySavedTeams,
  periodLabel,
  persistRugbyCurrentMatch,
  persistRugbySavedTeams,
  playerSummaryText,
  rankTopPerformers,
  rugbyPctColor,
} from '@/lib/rugby-stats-types'

type Screen = 'setup' | 'live' | 'report'
type Group = 'forwards' | 'backs'

const ACCENT = '#16a34a'

const SCORE_POINTS: Partial<Record<RugbyStatType, number>> = {
  try_scored: 5,
  conversion_made: 2,
  penalty_kick_made: 3,
}

function formatClock(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60)
  const s = Math.floor(Math.max(0, seconds) % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function RugbyStatsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (!session) router.push('/login')
      else setAuthed(true)
      setAuthChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="mb-2 animate-bounce text-4xl">🏉</div>
          <p className="text-sm text-gray-400">Loading Match Stats…</p>
        </div>
      </div>
    )
  }

  if (!authed) return null

  return <RugbyStatsApp />
}

function RugbyStatsApp() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('setup')
  const [match, setMatch] = useState<RugbyMatchData | null>(null)

  useEffect(() => {
    const existing = loadRugbyCurrentMatch()
    if (existing && !existing.matchComplete) {
      setMatch(existing)
      setScreen('live')
    } else if (existing && existing.matchComplete) {
      setMatch(existing)
      setScreen('report')
    }
  }, [])

  useEffect(() => {
    if (match) persistRugbyCurrentMatch(match)
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
            onBackToLive={() => setScreen('live')}
            onNewMatch={(keepRoster) => {
              if (keepRoster) {
                sessionStorage.setItem(
                  'playforge-rugby-stats-prefill',
                  JSON.stringify(buildRosterPrefill(match))
                )
              }
              persistRugbyCurrentMatch(null)
              setMatch(null)
              setScreen('setup')
            }}
          />
        )}
      </div>
    </div>
  )
}

function buildRosterPrefill(match: RugbyMatchData) {
  const names: Record<number, string> = {}
  for (const meta of RUGBY_POSITIONS_STATS) {
    const active = getActiveRugbyPlayer(match, meta.number)
    names[meta.number] = active?.name ?? ''
  }
  return {
    mode: match.mode,
    teamName: match.teamName,
    oppositionName: match.oppositionName,
    names,
  }
}

/* -------------------------------------------------------------------------- */
/* SCREEN 1: SETUP                                                            */
/* -------------------------------------------------------------------------- */

function SetupScreen({
  onBack,
  onStart,
}: {
  onBack: () => void
  onStart: (match: RugbyMatchData) => void
}) {
  const [mode, setMode] = useState<MatchMode>('match')
  const [teamName, setTeamName] = useState('')
  const [oppositionName, setOppositionName] = useState('')
  const [totalPeriods, setTotalPeriods] = useState<2 | 4>(2)
  const [duration, setDuration] = useState(25)
  const [names, setNames] = useState<Record<number, string>>(() =>
    RUGBY_POSITIONS_STATS.reduce(
      (acc, p) => {
        acc[p.number] = ''
        return acc
      },
      {} as Record<number, string>
    )
  )
  const [savedTeams, setSavedTeams] = useState<RugbySavedTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [tab, setTab] = useState<Group>('forwards')

  useEffect(() => {
    setSavedTeams(loadRugbySavedTeams())
    try {
      const raw = sessionStorage.getItem('playforge-rugby-stats-prefill')
      if (raw) {
        const data = JSON.parse(raw) as {
          mode: MatchMode
          teamName: string
          oppositionName: string
          names: Record<number, string>
        }
        setMode(data.mode ?? 'match')
        setTeamName(data.teamName ?? '')
        setOppositionName(data.oppositionName ?? '')
        setNames((prev) => ({ ...prev, ...data.names }))
        sessionStorage.removeItem('playforge-rugby-stats-prefill')
      }
    } catch {
      /* ignore */
    }
  }, [])

  const setFormat = (periods: 2 | 4) => {
    setTotalPeriods(periods)
    setDuration(periods === 2 ? 25 : 15)
  }

  const allNamesFilled = RUGBY_POSITIONS_STATS.every((p) => names[p.number].trim())
  const canStart = teamName.trim() !== '' && allNamesFilled

  const handleLoadTeam = (id: string) => {
    setSelectedTeamId(id)
    const team = savedTeams.find((t) => t.id === id)
    if (team) {
      setNames((prev) => {
        const next = { ...prev }
        for (const p of team.players) next[p.number] = p.name
        return next
      })
    }
  }

  const handleSaveTeam = () => {
    if (!teamName.trim()) {
      alert('Enter a team name before saving.')
      return
    }
    const team: RugbySavedTeam = {
      id: `rteam-${Date.now()}`,
      name: teamName.trim(),
      players: RUGBY_POSITIONS_STATS.map((p) => ({
        number: p.number,
        name: names[p.number].trim(),
      })),
      lastUsed: new Date().toISOString(),
    }
    const next = [team, ...savedTeams.filter((t) => t.name !== team.name)]
    persistRugbySavedTeams(next)
    setSavedTeams(next)
    setSelectedTeamId(team.id)
  }

  const handleStart = () => {
    if (!canStart) return
    const players: RugbyPlayerEntry[] = RUGBY_POSITIONS_STATS.map((p) => ({
      number: p.number,
      position: p.position,
      abbr: p.abbr,
      name: names[p.number].trim(),
      isOnField: true,
    }))
    const periods = mode === 'trial' ? 1 : totalPeriods
    const scores: Record<number, { us: number; them: number }> = {}
    for (let i = 1; i <= periods; i++) scores[i] = { us: 0, them: 0 }
    const match: RugbyMatchData = {
      id: `rmatch-${Date.now()}`,
      mode,
      teamName: teamName.trim(),
      oppositionName: mode === 'trial' ? '' : oppositionName.trim() || 'Opposition',
      periodDuration: duration,
      totalPeriods: periods,
      date: new Date().toLocaleDateString(),
      players,
      stats: [],
      scores,
      currentPeriod: 1,
      matchComplete: false,
    }
    onStart(match)
  }

  const inputClass =
    'w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-white placeholder-[#555] focus:border-[#16a34a] focus:outline-none'

  const numbers = tab === 'forwards' ? FORWARDS : BACKS

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
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#16a34a] text-white">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <h1 className="text-[18px] font-semibold text-white">Match Setup</h1>
      </div>

      {/* Mode selector */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <ModeButton
          active={mode === 'match'}
          label="🏉 Match"
          activeBg="#1a2a1a"
          activeBorder="#16a34a"
          activeColor="#86efac"
          onClick={() => setMode('match')}
        />
        <ModeButton
          active={mode === 'trial'}
          label="📋 Trial/Training"
          activeBg="#1a1a2a"
          activeBorder="#2563eb"
          activeColor="#93c5fd"
          onClick={() => setMode('trial')}
        />
      </div>

      {mode === 'trial' && (
        <p className="mb-3 text-[13px] font-medium text-[#93c5fd]">
          Trial/Training Session
        </p>
      )}

      <div className="space-y-3">
        <input
          className={inputClass}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. Leeuwenhof 1st XV"
          aria-label="Your team name"
        />
        {mode === 'match' && (
          <input
            className={inputClass}
            value={oppositionName}
            onChange={(e) => setOppositionName(e.target.value)}
            placeholder="e.g. Paarl Gim"
            aria-label="Opposition team name"
          />
        )}
      </div>

      {mode === 'match' && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium text-[#ccc]">Format</p>
          <div className="mb-3 flex gap-2">
            {[
              { p: 2 as const, label: '2 Halves' },
              { p: 4 as const, label: '4 Quarters' },
            ].map(({ p, label }) => {
              const active = totalPeriods === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormat(p)}
                  className="min-h-[48px] flex-1 rounded-md border text-[14px] font-medium"
                  style={{
                    background: active ? ACCENT : '#1f1f1f',
                    borderColor: active ? ACCENT : '#2a2a2a',
                    borderWidth: '0.5px',
                    color: active ? '#fff' : '#888',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <p className="mb-2 text-[13px] font-medium text-[#ccc]">
            {totalPeriods === 2 ? 'Half Duration' : 'Quarter Duration'}
          </p>
          <input
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="min-h-[48px] w-28 rounded-md border border-[#2a2a2a] bg-[#1f1f1f] px-3 text-center text-[14px] text-white focus:border-[#16a34a] focus:outline-none"
            aria-label="Period duration in minutes"
          />
          <span className="ml-2 text-[13px] text-[#666]">minutes</span>
        </div>
      )}

      {savedTeams.length > 0 && (
        <div className="mt-6">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#666]">
            Load Previous Team
          </p>
          <select
            value={selectedTeamId}
            onChange={(e) => handleLoadTeam(e.target.value)}
            className="w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-white focus:border-[#16a34a] focus:outline-none"
          >
            <option value="">Load Previous Team…</option>
            {savedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[#555]">Or enter new team</p>
        </div>
      )}

      {/* Player setup tabs */}
      <div className="mt-6 mb-2 flex gap-2">
        <TabPill active={tab === 'forwards'} label="Forwards 1-8" onClick={() => setTab('forwards')} />
        <TabPill active={tab === 'backs'} label="Backs 9-15" onClick={() => setTab('backs')} />
      </div>
      <div className="space-y-2">
        {numbers.map((num) => {
          const meta = RUGBY_POSITIONS_STATS.find((p) => p.number === num)!
          return (
            <div key={num} className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#1f1f1f] text-[12px] font-bold text-[#888]">
                {num}
              </div>
              <div
                className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                style={{ background: '#1a2a1a', border: '0.5px solid #16a34a', color: '#86efac' }}
                title={meta.position}
              >
                {meta.abbr}
              </div>
              <input
                className={inputClass}
                value={names[num]}
                onChange={(e) => setNames((prev) => ({ ...prev, [num]: e.target.value }))}
                placeholder="Player name"
                aria-label={`${meta.position} name`}
              />
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleSaveTeam}
        className="mt-4 min-h-[48px] w-full rounded-md border border-[#2a2a2a] bg-transparent text-[13px] text-[#555] transition-colors hover:text-[#999]"
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
        {mode === 'match' ? 'Kick Off 🏉' : 'Start Session 📋'}
      </button>
    </div>
  )
}

function ModeButton({
  active,
  label,
  activeBg,
  activeBorder,
  activeColor,
  onClick,
}: {
  active: boolean
  label: string
  activeBg: string
  activeBorder: string
  activeColor: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[56px] rounded-lg border text-[15px] font-medium"
      style={{
        background: active ? activeBg : '#1f1f1f',
        borderColor: active ? activeBorder : '#2a2a2a',
        borderWidth: '0.5px',
        color: active ? activeColor : '#666',
      }}
    >
      {label}
    </button>
  )
}

function TabPill({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-full py-2 text-[12px] font-medium transition-colors"
      style={{
        background: active ? ACCENT : '#1f1f1f',
        color: active ? '#fff' : '#888',
      }}
    >
      {label}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* SCREEN 2: LIVE                                                             */
/* -------------------------------------------------------------------------- */

function LiveScreen({
  match,
  setMatch,
  onViewReport,
}: {
  match: RugbyMatchData
  setMatch: React.Dispatch<React.SetStateAction<RugbyMatchData | null>>
  onViewReport: () => void
}) {
  const isTrial = match.mode === 'trial'
  const totalSeconds = match.periodDuration * 60
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [group, setGroup] = useState<RugbyStatGroupId>('attacking')
  const [tab, setTab] = useState<Group>('forwards')
  const [flashStat, setFlashStat] = useState<RugbyStatType | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (!isTrial && e + 1 >= totalSeconds) {
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
  }, [running, totalSeconds, isTrial])

  const remaining = totalSeconds - elapsed
  const displayTime = isTrial ? elapsed : remaining

  const recordStat = (stat: RugbyStatType) => {
    if (selectedNumber === null) return
    const active = getActiveRugbyPlayer(match, selectedNumber)
    if (!active) return
    const entry: RugbyStatEntry = {
      id: `rstat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      period: match.currentPeriod,
      timeInPeriod: elapsed,
      playerNumber: selectedNumber,
      playerName: active.name,
      stat,
      timestamp: Date.now(),
    }
    const points = SCORE_POINTS[stat] ?? 0
    setMatch((prev) => {
      if (!prev) return prev
      const scores = { ...prev.scores }
      if (points > 0 && !isTrial) {
        const cur = scores[prev.currentPeriod] ?? { us: 0, them: 0 }
        scores[prev.currentPeriod] = { ...cur, us: cur.us + points }
      }
      return { ...prev, stats: [...prev.stats, entry], scores }
    })
    setFlashStat(stat)
    setTimeout(() => setFlashStat(null), 300)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
    setSelectedNumber(null)
  }

  const deleteStat = (id: string) => {
    if (!confirm('Delete this stat entry?')) return
    setMatch((prev) => {
      if (!prev) return prev
      const entry = prev.stats.find((s) => s.id === id)
      const scores = { ...prev.scores }
      if (entry && !isTrial) {
        const points = SCORE_POINTS[entry.stat] ?? 0
        if (points > 0) {
          const cur = scores[entry.period] ?? { us: 0, them: 0 }
          scores[entry.period] = { ...cur, us: Math.max(0, cur.us - points) }
        }
      }
      return { ...prev, stats: prev.stats.filter((s) => s.id !== id), scores }
    })
  }

  const adjustScore = (team: 'us' | 'them', delta: number) => {
    setMatch((prev) => {
      if (!prev) return prev
      const p = prev.currentPeriod
      const cur = prev.scores[p] ?? { us: 0, them: 0 }
      return {
        ...prev,
        scores: { ...prev.scores, [p]: { ...cur, [team]: Math.max(0, cur[team] + delta) } },
      }
    })
  }

  const endPeriod = () => {
    setRunning(false)
    if (match.currentPeriod >= match.totalPeriods) {
      setMatch((prev) => (prev ? { ...prev, matchComplete: true } : prev))
      onViewReport()
      return
    }
    setMatch((prev) => {
      if (!prev) return prev
      const nextP = prev.currentPeriod + 1
      const scores = { ...prev.scores }
      if (!scores[nextP]) scores[nextP] = { us: 0, them: 0 }
      return { ...prev, currentPeriod: nextP, scores }
    })
    setElapsed(0)
    setSelectedNumber(null)
  }

  const endLabel =
    match.currentPeriod >= match.totalPeriods
      ? isTrial
        ? 'End Session'
        : 'End Match'
      : match.totalPeriods === 2
        ? 'End Half'
        : 'End Quarter'

  // Score indicator (auto vs manual)
  const usDisplayed = match.scores[match.currentPeriod]?.us ?? 0
  const autoUs = calculateUsScore(match, match.currentPeriod)
  const scoreMode = usDisplayed === autoUs ? 'Auto' : 'Manual'

  const lines = computeRugbyStatLines(match)
  const lineFor = (n: number) => lines.find((l) => l.number === n)

  const recentStats = [...match.stats].slice(-5).reverse()
  const numbers = tab === 'forwards' ? FORWARDS : BACKS
  const groupDef = RUGBY_STAT_GROUPS[group]

  return (
    <div className="pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b bg-[#161616] px-3 py-2"
        style={{ borderBottomWidth: '0.5px', borderColor: '#2a2a2a' }}
      >
        <div className="flex items-center gap-2">
          <span className="min-w-[64px] text-[15px] font-bold" style={{ color: ACCENT }}>
            {isTrial ? 'Trial' : periodLabel(match, match.currentPeriod)}
          </span>
          <span className="flex-1 text-center font-mono text-[36px] font-bold leading-none text-white tabular-nums">
            {formatClock(displayTime)}
          </span>
          <span className="min-w-[64px]" />
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setRunning(true)}
            disabled={running || (!isTrial && remaining <= 0)}
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
            onClick={endPeriod}
            className="flex items-center gap-1 rounded-md border border-[#16a34a] bg-[#0a1f0a] px-3 py-1.5 text-[12px] text-[#86efac]"
          >
            <Square className="h-3.5 w-3.5" /> {endLabel}
          </button>
        </div>

        {/* Score (match mode only) */}
        {!isTrial && (
          <div className="mt-2 flex justify-center">
            <div
              className="flex items-center gap-4 rounded-xl bg-[#1a1a1a]"
              style={{ padding: '10px 18px' }}
            >
              <TeamScore
                name={match.teamName}
                value={usDisplayed}
                onAdd={() => adjustScore('us', 1)}
                onSub={() => adjustScore('us', -1)}
                badge={scoreMode === 'Auto' ? 'Auto' : `Auto: ${autoUs}`}
              />
              <span className="text-[20px] text-[#555]">—</span>
              <TeamScore
                name={match.oppositionName}
                value={match.scores[match.currentPeriod]?.them ?? 0}
                onAdd={() => adjustScore('them', 1)}
                onSub={() => adjustScore('them', -1)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pt-3">
        {/* Player selector tabs */}
        <div className="mb-2 flex gap-2">
          <TabPill active={tab === 'forwards'} label="Forwards" onClick={() => setTab('forwards')} />
          <TabPill active={tab === 'backs'} label="Backs" onClick={() => setTab('backs')} />
        </div>

        {/* Player grid */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          {numbers.map((num) => {
            const active = getActiveRugbyPlayer(match, num)
            const line = lineFor(num)
            const selected = selectedNumber === num
            return (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedNumber((c) => (c === num ? null : num))}
                className="flex h-[72px] flex-col items-center justify-center rounded-xl px-1 text-center"
                style={{
                  background: selected ? '#0a1f0a' : '#1a1a1a',
                  border: selected ? `2px solid ${ACCENT}` : '0.5px solid #2a2a2a',
                }}
              >
                <span className="text-[10px] text-[#888]">#{num}</span>
                <span className="w-full truncate px-1 text-[13px] text-white">
                  {active?.name ?? '—'}
                </span>
                <span className="text-[9px] text-[#86efac]">
                  {line ? playerSummaryText(line) || '—' : '—'}
                </span>
              </button>
            )
          })}
          {tab === 'backs' && (
            <button
              type="button"
              onClick={() => {
                setRunning(false)
                setSubOpen(true)
              }}
              className="flex h-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-[#f59e0b] bg-[#1a1a0a] text-[12px] text-[#fcd34d]"
            >
              <Users className="h-4 w-4" />
              Sub
            </button>
          )}
        </div>

        {/* Stat group selector + buttons */}
        {selectedNumber !== null && (
          <div className="mb-4">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {RUGBY_STAT_GROUP_ORDER.map((g) => {
                const def = RUGBY_STAT_GROUPS[g]
                const active = group === g
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroup(g)}
                    className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium"
                    style={{
                      background: active ? def.bg : '#1f1f1f',
                      borderColor: active ? def.borderColor : '#2a2a2a',
                      borderWidth: '0.5px',
                      color: active ? def.color : '#777',
                    }}
                  >
                    {def.label}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {groupDef.stats.map((stat) => (
                <button
                  key={stat}
                  type="button"
                  onClick={() => recordStat(stat)}
                  className="rounded-xl border transition-colors active:opacity-80"
                  style={{
                    height: 48,
                    fontSize: 13,
                    fontWeight: 500,
                    background: flashStat === stat ? lightenBg(groupDef.bg) : groupDef.bg,
                    borderColor: groupDef.borderColor,
                    borderWidth: '0.5px',
                    color: groupDef.color,
                  }}
                >
                  {RUGBY_STAT_LABELS[stat]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live feed */}
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
                    {formatClock(s.timeInPeriod)} — #{s.playerNumber} {s.playerName} —{' '}
                    <span className="text-[#86efac]">{RUGBY_STAT_LABELS[s.stat]}</span>
                  </span>
                  <Trash2 className="h-3.5 w-3.5 shrink-0 text-[#555]" />
                </button>
              ))}
            </div>
          </div>
        )}
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
            View Report
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
          onConfirm={(number, newName, newNumber) => {
            setMatch((prev) => {
              if (!prev) return prev
              const players = prev.players.map((p) => {
                if (p.number === number && p.isOnField) {
                  return { ...p, isOnField: false, substitutedAt: prev.currentPeriod }
                }
                return p
              })
              const meta = RUGBY_POSITIONS_STATS.find((m) => m.number === number)
              players.push({
                number: newNumber,
                position: meta?.position ?? '',
                abbr: meta?.abbr ?? '',
                name: newName,
                isOnField: true,
              })
              return { ...prev, players }
            })
            setSubOpen(false)
          }}
        />
      )}
    </div>
  )
}

function lightenBg(bg: string): string {
  // crude flash: append alpha-ish brightening by swapping to a lighter known set
  const map: Record<string, string> = {
    '#0a1f0a': '#123a12',
    '#0a0f2a': '#16204a',
    '#1f1a0a': '#3a3212',
    '#1f0a0a': '#3a1212',
    '#1a0a2a': '#2e144a',
  }
  return map[bg] ?? bg
}

function TeamScore({
  name,
  value,
  onAdd,
  onSub,
  badge,
}: {
  name: string
  value: number
  onAdd: () => void
  onSub: () => void
  badge?: string
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
        <span className="min-w-[28px] text-center text-[32px] font-bold text-white tabular-nums">
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
      {badge && <div className="mt-0.5 text-[9px] text-[#666]">{badge}</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* SCREEN 3: SUBSTITUTION                                                     */
/* -------------------------------------------------------------------------- */

function SubstitutionOverlay({
  match,
  onClose,
  onConfirm,
}: {
  match: RugbyMatchData
  onClose: () => void
  onConfirm: (number: number, newName: string, newNumber: number) => void
}) {
  const [tab, setTab] = useState<Group>('forwards')
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')

  const numbers = tab === 'forwards' ? FORWARDS : BACKS
  const canConfirm = selectedNumber !== null && newName.trim() !== ''

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
        <div className="mb-2 flex gap-2">
          <TabPill active={tab === 'forwards'} label="Forwards" onClick={() => setTab('forwards')} />
          <TabPill active={tab === 'backs'} label="Backs" onClick={() => setTab('backs')} />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {numbers.map((num) => {
            const active = getActiveRugbyPlayer(match, num)
            const selected = selectedNumber === num
            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setSelectedNumber(num)
                  setNewNumber(String(num))
                }}
                className="flex min-h-[48px] items-center gap-2 rounded-md border px-2.5 py-2 text-left"
                style={{
                  background: selected ? '#0a1f0a' : '#1a1a1a',
                  borderColor: selected ? ACCENT : '#2a2a2a',
                  borderWidth: selected ? '2px' : '0.5px',
                }}
              >
                <span className="text-[11px] font-bold text-[#888]">#{num}</span>
                <span className="truncate text-[13px] text-white">{active?.name ?? '—'}</span>
              </button>
            )
          })}
        </div>

        <p className="mb-2 text-[12px] font-medium text-[#ccc]">Replacement Player Name</p>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Replacement player name"
          className="mb-3 w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-[14px] text-white placeholder-[#555] focus:border-[#16a34a] focus:outline-none"
        />

        <p className="mb-2 text-[12px] font-medium text-[#ccc]">Jersey Number</p>
        <input
          type="number"
          inputMode="numeric"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          placeholder="Jersey number"
          className="mb-4 w-28 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-center text-[14px] text-white placeholder-[#555] focus:border-[#16a34a] focus:outline-none"
        />

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() =>
            canConfirm &&
            onConfirm(
              selectedNumber!,
              newName.trim(),
              parseInt(newNumber, 10) || selectedNumber!
            )
          }
          className="mb-2 min-h-[48px] w-full rounded-lg text-[15px] font-semibold text-white disabled:opacity-40"
          style={{ background: '#f59e0b' }}
        >
          Confirm Sub
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
/* SCREEN 4: REPORT                                                           */
/* -------------------------------------------------------------------------- */

function ReportScreen({
  match,
  onBackToLive,
  onNewMatch,
}: {
  match: RugbyMatchData
  onBackToLive: () => void
  onNewMatch: (keepRoster: boolean) => void
}) {
  const isTrial = match.mode === 'trial'
  const lines = computeRugbyStatLines(match)
  const kpis = computeRugbyKpis(match)
  const subs = getRugbySubstitutionLog(match)
  const [activePeriod, setActivePeriod] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  const us = calculateUsScore(match)
  let them = 0
  for (const q of Object.keys(match.scores)) them += match.scores[Number(q)]?.them ?? 0

  const ranked = rankTopPerformers(lines).filter((l) => l.total > 0)

  const shareWhatsApp = () => {
    const text = encodeURIComponent(buildRugbyReportText(match))
    const win = window.open(`whatsapp://send?text=${text}`, '_blank')
    if (!win) window.open(`https://wa.me/?text=${text}`, '_blank')
  }
  const exportPdf = () => {
    const html = buildRugbyReportHtml(match)
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
      isTrial
        ? `Trial Report — ${match.teamName}`
        : `Match Report — ${match.teamName} vs ${match.oppositionName}`
    )
    const body = encodeURIComponent(buildRugbyReportText(match))
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }
  const handleNewMatch = () => {
    const keep = confirm('Start a new match/session with the same team roster?')
    onNewMatch(keep)
  }

  const periodLines = computeRugbyStatLines(match, activePeriod)
    .filter((l) => l.total > 0)
    .sort((a, b) => b.total - a.total)

  const kpiList = [
    { label: 'Tackle Success', value: kpis.tackleSuccess, green: 80, amber: 60 },
    { label: 'Lineout Success', value: kpis.lineoutSuccess, green: 85, amber: 70 },
    { label: 'Scrum Success', value: kpis.scrumSuccess, green: 85, amber: 70 },
    { label: 'Conversion', value: kpis.conversion, green: 75, amber: 50 },
    { label: 'Penalty Kick', value: kpis.penaltyKick, green: 75, amber: 50 },
    { label: 'Kick From Hand', value: kpis.kickFromHand, green: 60, amber: 40 },
  ]

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
        <h1 className="text-[18px] font-semibold text-white">
          {isTrial ? 'Trial Report' : 'Match Report'}
        </h1>
      </div>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 text-center">
        <p className="text-[14px] text-[#ccc]">
          {isTrial ? (
            <>Trial Session — {match.teamName}</>
          ) : (
            <>
              {match.teamName} <span className="text-[#666]">vs</span> {match.oppositionName}
            </>
          )}
        </p>
        <p className="mb-2 text-[11px] text-[#666]">{match.date}</p>
        {!isTrial && (
          <p className="text-[40px] font-extrabold leading-none text-white tabular-nums">
            {us} <span className="text-[#555]">—</span> {them}
          </p>
        )}
      </div>

      {/* KPI card */}
      <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#161616] p-4">
        <p className="mb-3 text-[16px] font-semibold text-white">Key Performance Indicators</p>
        {kpiList.map((k, i) => (
          <div key={k.label}>
            {i > 0 && <div className="my-2 border-t border-[#2a2a2a]" />}
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#aaa]">{k.label}</span>
              <span
                className="text-[16px] font-semibold tabular-nums"
                style={{ color: rugbyPctColor(k.value, k.green, k.amber) }}
              >
                {formatRugbyPct(k.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Period breakdown (match mode) */}
      {!isTrial && (
        <>
          <h2 className="mb-2 mt-6 text-[10px] font-medium uppercase tracking-wider text-[#666]">
            Period Breakdown
          </h2>
          <div className="mb-2 flex gap-1.5">
            {Array.from({ length: match.totalPeriods }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setActivePeriod(p)}
                className="flex-1 rounded-md py-2 text-[12px] font-medium"
                style={{
                  background: activePeriod === p ? ACCENT : '#1f1f1f',
                  color: activePeriod === p ? '#fff' : '#888',
                }}
              >
                {periodLabel(match, p)}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
            <p className="mb-2 text-center text-[13px] text-[#ccc]">
              {periodLabel(match, activePeriod)} Score:{' '}
              {calculateUsScore(match, activePeriod)} —{' '}
              {match.scores[activePeriod]?.them ?? 0}
            </p>
            {periodLines.length === 0 ? (
              <p className="py-2 text-center text-[12px] text-[#555]">No stats recorded</p>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[#666]">
                    <th className="py-1 text-left">#</th>
                    <th className="py-1 text-left">Player</th>
                    <th className="py-1 text-right">Key Stats</th>
                  </tr>
                </thead>
                <tbody>
                  {periodLines.map((l) => (
                    <tr key={`${l.number}-${l.name}`} className="border-t border-[#2a2a2a]">
                      <td className="py-1.5 text-left text-[#888]">{l.number}</td>
                      <td className="py-1.5 text-left text-white">{l.name}</td>
                      <td className="py-1.5 text-right text-[#86efac]">
                        {playerSummaryText(l) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Trial top performers */}
      {isTrial && (
        <>
          <h2 className="mb-2 mt-6 text-[10px] font-medium uppercase tracking-wider text-[#666]">
            Top Performers
          </h2>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
            {ranked.length === 0 ? (
              <p className="py-2 text-center text-[12px] text-[#555]">No stats recorded</p>
            ) : (
              <ol className="space-y-1.5">
                {ranked.map((l, i) => (
                  <li key={`${l.number}-${l.name}`} className="flex items-center gap-2 text-[13px]">
                    <span className="w-5 text-[#666]">{i + 1}.</span>
                    <span className="text-white">#{l.number} {l.name}</span>
                    <span className="ml-auto text-[11px] text-[#86efac]">
                      {playerSummaryText(l) || '—'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {/* Full player stats */}
      <h2 className="mb-2 mt-6 text-[10px] font-medium uppercase tracking-wider text-[#666]">
        Full Player Stats
      </h2>
      <div className="overflow-x-auto rounded-xl border border-[#2a2a2a] bg-[#161616]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[#666]">
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2 text-left">Player</th>
              <th className="px-1 py-2">Pos</th>
              <th className="px-1 py-2">Carries</th>
              <th className="px-1 py-2">Tackles</th>
              <th className="px-1 py-2">Lineouts</th>
              <th className="px-1 py-2">Scrums</th>
              <th className="px-1 py-2">Faults</th>
              <th className="px-1 py-2">Kicks</th>
              <th className="px-2 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const key = `${l.number}-${l.name}`
              const open = expanded === key
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => setExpanded(open ? null : key)}
                    className="cursor-pointer border-t border-[#2a2a2a]"
                  >
                    <td className="px-2 py-2 text-center text-[#888]">{l.number}</td>
                    <td className="px-2 py-2 text-left font-semibold text-white whitespace-nowrap">
                      {l.name}
                    </td>
                    <td className="px-1 py-2 text-center text-[#86efac]">{l.abbr}</td>
                    <td className="px-1 py-2 text-center text-white">{l.carries}</td>
                    <td className="px-1 py-2 text-center text-white">{l.tackles}</td>
                    <td className="px-1 py-2 text-center text-white">{l.lineouts}</td>
                    <td className="px-1 py-2 text-center text-white">{l.scrums}</td>
                    <td className="px-1 py-2 text-center text-[#f87171]">{l.faults}</td>
                    <td className="px-1 py-2 text-center text-white">{l.kicks}</td>
                    <td className="px-2 py-2 text-center font-bold text-white">{l.total}</td>
                  </tr>
                  {open && (
                    <tr className="border-t border-[#2a2a2a] bg-[#0f0f0f]">
                      <td colSpan={10} className="px-3 py-2">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#aaa]">
                          {Object.entries(l.counts).length === 0 ? (
                            <span className="text-[#555]">No stats</span>
                          ) : (
                            Object.entries(l.counts).map(([stat, count]) => (
                              <span key={stat}>
                                {RUGBY_STAT_LABELS[stat as RugbyStatType]}:{' '}
                                <span className="text-white">{count}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
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
