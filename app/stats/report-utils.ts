import {
  MatchData,
  NetballPosition,
  NETBALL_POSITIONS_ORDER,
  NEGATIVE_STATS,
  POSITIVE_STATS,
  GOAL_STATS,
  StatType,
  STAT_LABELS,
  PlayerEntry,
} from '@/lib/stats-types'

export interface PlayerStatLine {
  position: NetballPosition
  name: string
  counts: Record<StatType, number>
  faults: number
  positives: number
  goalShot: number
  goalMissed: number
  byQuarter: Record<number, Record<StatType, number>>
}

function emptyCounts(): Record<StatType, number> {
  const counts = {} as Record<StatType, number>
  for (const s of [...NEGATIVE_STATS, ...POSITIVE_STATS]) counts[s] = 0
  return counts
}

/** All distinct players (incl. substitutes). */
export function getAllPlayers(match: MatchData): PlayerEntry[] {
  const result: PlayerEntry[] = []
  for (const position of NETBALL_POSITIONS_ORDER) {
    for (const entry of match.players[position] ?? []) {
      result.push(entry)
    }
  }
  return result
}

export function computePlayerStatLines(match: MatchData): PlayerStatLine[] {
  const map = new Map<string, PlayerStatLine>()

  const ensure = (position: NetballPosition, name: string): PlayerStatLine => {
    const key = `${position}__${name}`
    let line = map.get(key)
    if (!line) {
      line = {
        position,
        name,
        counts: emptyCounts(),
        faults: 0,
        positives: 0,
        goalShot: 0,
        goalMissed: 0,
        byQuarter: {},
      }
      map.set(key, line)
    }
    return line
  }

  for (const position of NETBALL_POSITIONS_ORDER) {
    for (const entry of match.players[position] ?? []) {
      ensure(position, entry.name)
    }
  }

  for (const stat of match.stats) {
    const line = ensure(stat.playerId as NetballPosition, stat.playerName)
    // Default missing keys to 0 (backwards compat with old saved data).
    line.counts[stat.stat] = (line.counts[stat.stat] ?? 0) + 1
    if (NEGATIVE_STATS.includes(stat.stat)) line.faults += 1
    if (POSITIVE_STATS.includes(stat.stat)) line.positives += 1
    if (stat.stat === 'goal_shot') line.goalShot += 1
    if (stat.stat === 'goal_missed') line.goalMissed += 1
    if (!line.byQuarter[stat.quarter]) line.byQuarter[stat.quarter] = emptyCounts()
    line.byQuarter[stat.quarter][stat.stat] =
      (line.byQuarter[stat.quarter][stat.stat] ?? 0) + 1
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      NETBALL_POSITIONS_ORDER.indexOf(a.position) -
      NETBALL_POSITIONS_ORDER.indexOf(b.position)
  )
}

export interface MatchTotals {
  usGoals: number
  themGoals: number
  totalFaults: number
  totalPositives: number
}

export function computeMatchTotals(match: MatchData): MatchTotals {
  let usGoals = 0
  let themGoals = 0
  for (const q of [1, 2, 3, 4]) {
    const score = match.scores[q]
    if (score) {
      usGoals += score.us
      themGoals += score.them
    }
  }
  let totalFaults = 0
  let totalPositives = 0
  for (const stat of match.stats) {
    if (NEGATIVE_STATS.includes(stat.stat)) totalFaults += 1
    if (POSITIVE_STATS.includes(stat.stat)) totalPositives += 1
  }
  return { usGoals, themGoals, totalFaults, totalPositives }
}

export function getSubstitutionLog(match: MatchData): string[] {
  const log: string[] = []
  for (const position of NETBALL_POSITIONS_ORDER) {
    const entries = match.players[position] ?? []
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.substitutedAt && entries[i + 1]) {
        log.push(
          `Q${entry.substitutedAt}: ${entry.name} replaced by ${entries[i + 1].name} at ${position}`
        )
      }
    }
  }
  return log
}

/* ----------------------------- Goal scoring ----------------------------- */

export interface PositionGoalScoring {
  names: string[]
  shot: number
  missed: number
  /** null when no attempts (display "—"). */
  pct: number | null
}

export interface GoalScoringSummary {
  GS: PositionGoalScoring
  GA: PositionGoalScoring
  overall: PositionGoalScoring
}

function computePct(shot: number, missed: number): number | null {
  const attempts = shot + missed
  if (attempts === 0) return null
  return (shot / attempts) * 100
}

function scoringForPosition(
  match: MatchData,
  position: NetballPosition
): PositionGoalScoring {
  const names = (match.players[position] ?? []).map((p) => p.name)
  let shot = 0
  let missed = 0
  for (const stat of match.stats) {
    if (stat.playerId !== position) continue
    if (stat.stat === 'goal_shot') shot += 1
    if (stat.stat === 'goal_missed') missed += 1
  }
  return { names, shot, missed, pct: computePct(shot, missed) }
}

export function computeGoalScoring(match: MatchData): GoalScoringSummary {
  const gs = scoringForPosition(match, 'GS')
  const ga = scoringForPosition(match, 'GA')
  const shot = gs.shot + ga.shot
  const missed = gs.missed + ga.missed
  return {
    GS: gs,
    GA: ga,
    overall: {
      names: [...gs.names, ...ga.names],
      shot,
      missed,
      pct: computePct(shot, missed),
    },
  }
}

export function formatPct(pct: number | null): string {
  return pct === null ? '—' : `${pct.toFixed(1)}%`
}

/** Colour coding: green ≥ 60, amber 40–59, red < 40, muted when no attempts. */
export function scoringColor(pct: number | null): string {
  if (pct === null) return '#888'
  if (pct >= 60) return '#86efac'
  if (pct >= 40) return '#fcd34d'
  return '#f87171'
}

/* ------------------------------- Exports -------------------------------- */

/** Plain-text summary used for WhatsApp / email sharing. */
export function buildReportText(match: MatchData): string {
  const totals = computeMatchTotals(match)
  const lines = computePlayerStatLines(match)
  const scoring = computeGoalScoring(match)

  const out: string[] = []
  out.push('PlayForge Match Report')
  out.push(`${match.teamName} vs ${match.oppositionName} — ${match.date}`)
  out.push(`Final Score: ${totals.usGoals} — ${totals.themGoals}`)
  out.push('')
  out.push('Player Stats:')

  const nonGoalStats: StatType[] = [...NEGATIVE_STATS, ...POSITIVE_STATS].filter(
    (s) => !GOAL_STATS.includes(s)
  )

  for (const line of lines) {
    const parts: string[] = []
    if (line.position === 'GS' || line.position === 'GA') {
      const pct = formatPct(computePct(line.goalShot, line.goalMissed))
      parts.push(`${line.goalShot} shots, ${line.goalMissed} missed (${pct})`)
    }
    for (const stat of nonGoalStats) {
      const count = line.counts[stat] ?? 0
      if (count > 0) parts.push(`${count} ${STAT_LABELS[stat]}`)
    }
    out.push(`${line.position} ${line.name}: ${parts.length > 0 ? parts.join(', ') : '—'}`)
  }

  const subs = getSubstitutionLog(match)
  if (subs.length > 0) {
    out.push('')
    out.push('Substitutions:')
    subs.forEach((s) => out.push(s))
  }

  out.push('')
  out.push('GOAL SCORING:')
  out.push(`GS: ${formatPct(scoring.GS.pct)}`)
  out.push(`GA: ${formatPct(scoring.GA.pct)}`)
  out.push(`Overall: ${formatPct(scoring.overall.pct)}`)

  return out.join('\n')
}

/** Print-friendly HTML for PDF export via window.print(). */
export function buildReportHtml(match: MatchData): string {
  const totals = computeMatchTotals(match)
  const lines = computePlayerStatLines(match)
  const subs = getSubstitutionLog(match)
  const scoring = computeGoalScoring(match)
  const allStats: StatType[] = [...NEGATIVE_STATS, ...POSITIVE_STATS]

  const headerCells = allStats.map((s) => `<th>${STAT_LABELS[s]}</th>`).join('')

  const bodyRows = lines
    .map((line) => {
      const cells = allStats
        .map((s) => {
          const v = line.counts[s] ?? 0
          const positive = POSITIVE_STATS.includes(s)
          const color = v === 0 ? '#999' : positive ? '#16a34a' : '#dc2626'
          return `<td style="color:${color}">${v}</td>`
        })
        .join('')
      return `<tr><td style="text-align:left;font-weight:600">${line.position} ${escapeHtml(
        line.name
      )}</td>${cells}<td style="font-weight:700">${line.faults + line.positives}</td></tr>`
    })
    .join('')

  const quarterRows = [1, 2, 3, 4]
    .map((q) => {
      const score = match.scores[q]
      return `<tr><td>Q${q}</td><td>${score ? score.us : 0}</td><td>${
        score ? score.them : 0
      }</td></tr>`
    })
    .join('')

  const scoringRows = [
    { label: `GS — ${scoring.GS.names.join(' / ') || '—'}`, s: scoring.GS },
    { label: `GA — ${scoring.GA.names.join(' / ') || '—'}`, s: scoring.GA },
    { label: 'Overall', s: scoring.overall },
  ]
    .map(
      ({ label, s }) =>
        `<tr><td style="text-align:left">${escapeHtml(label)}</td><td>${s.shot}</td><td>${
          s.missed
        }</td><td>${s.shot + s.missed}</td><td style="font-weight:700">${formatPct(
          s.pct
        )}</td></tr>`
    )
    .join('')

  const subsHtml =
    subs.length > 0
      ? `<h2>Substitutions</h2><ul>${subs
          .map((s) => `<li>${escapeHtml(s)}</li>`)
          .join('')}</ul>`
      : ''

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Match Report — ${escapeHtml(match.teamName)} vs ${escapeHtml(
    match.oppositionName
  )}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 24px; }
  .brand { display:flex; align-items:center; gap:10px; border-bottom: 2px solid #a855f7; padding-bottom: 12px; margin-bottom: 16px; }
  .brand .logo { width: 34px; height: 34px; border-radius: 8px; background:#a855f7; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
  h1 { font-size: 20px; margin: 0; }
  h2 { font-size: 14px; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; color:#555; }
  .score { font-size: 32px; font-weight: 800; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ddd; padding: 5px 6px; text-align: center; }
  th { background: #f4f4f5; }
  .meta { color:#666; font-size: 12px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="brand">
    <div class="logo">PF</div>
    <div>
      <h1>PlayForge — Match Report</h1>
      <div class="meta">${escapeHtml(match.teamName)} vs ${escapeHtml(
        match.oppositionName
      )} — ${escapeHtml(match.date)}</div>
    </div>
  </div>

  <div class="score">${totals.usGoals} — ${totals.themGoals}</div>
  <p class="meta">Total faults: ${totals.totalFaults} &nbsp;•&nbsp; Total positives: ${
    totals.totalPositives
  }</p>

  <h2>Goal Scoring</h2>
  <table>
    <thead><tr><th style="text-align:left">Player</th><th>Goal Shot</th><th>Goal Missed</th><th>Attempts</th><th>Scoring %</th></tr></thead>
    <tbody>${scoringRows}</tbody>
  </table>

  <h2>Score by Quarter</h2>
  <table>
    <thead><tr><th>Quarter</th><th>${escapeHtml(match.teamName)}</th><th>${escapeHtml(
      match.oppositionName
    )}</th></tr></thead>
    <tbody>${quarterRows}</tbody>
  </table>

  <h2>Player Stats</h2>
  <table>
    <thead><tr><th style="text-align:left">Player</th>${headerCells}<th>Total</th></tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>

  ${subsHtml}
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
