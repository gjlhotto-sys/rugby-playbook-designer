import {
  MatchData,
  NetballPosition,
  NETBALL_POSITIONS_ORDER,
  NEGATIVE_STATS,
  POSITIVE_STATS,
  StatType,
  STAT_LABELS,
  PlayerEntry,
} from './stats-types'

export interface PlayerStatLine {
  position: NetballPosition
  name: string
  counts: Record<StatType, number>
  faults: number
  positives: number
  goals: number
  byQuarter: Record<number, Record<StatType, number>>
}

function emptyCounts(): Record<StatType, number> {
  return {
    bad_pass: 0,
    drop_ball: 0,
    step: 0,
    break: 0,
    contact: 0,
    obstruct: 0,
    interception: 0,
    tip: 0,
    rebound: 0,
    score_goal: 0,
  }
}

/** All distinct players (incl. substitutes) keyed by position+name. */
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

  for (const position of NETBALL_POSITIONS_ORDER) {
    for (const entry of match.players[position] ?? []) {
      const key = `${position}__${entry.name}`
      if (!map.has(key)) {
        map.set(key, {
          position,
          name: entry.name,
          counts: emptyCounts(),
          faults: 0,
          positives: 0,
          goals: 0,
          byQuarter: {},
        })
      }
    }
  }

  for (const stat of match.stats) {
    const key = `${stat.playerId}__${stat.playerName}`
    let line = map.get(key)
    if (!line) {
      line = {
        position: stat.playerId as NetballPosition,
        name: stat.playerName,
        counts: emptyCounts(),
        faults: 0,
        positives: 0,
        goals: 0,
        byQuarter: {},
      }
      map.set(key, line)
    }
    line.counts[stat.stat] += 1
    if (NEGATIVE_STATS.includes(stat.stat)) line.faults += 1
    if (POSITIVE_STATS.includes(stat.stat)) line.positives += 1
    if (stat.stat === 'score_goal') line.goals += 1
    if (!line.byQuarter[stat.quarter]) line.byQuarter[stat.quarter] = emptyCounts()
    line.byQuarter[stat.quarter][stat.stat] += 1
  }

  return Array.from(map.values()).sort((a, b) => {
    const aIdx = NETBALL_POSITIONS_ORDER.indexOf(a.position)
    const bIdx = NETBALL_POSITIONS_ORDER.indexOf(b.position)
    return aIdx - bIdx
  })
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

/** Plain-text summary used for WhatsApp / email sharing. */
export function buildReportText(match: MatchData): string {
  const totals = computeMatchTotals(match)
  const lines = computePlayerStatLines(match)

  const out: string[] = []
  out.push('PlayForge Match Report')
  out.push(`${match.teamName} vs ${match.oppositionName} — ${match.date}`)
  out.push(`Final Score: ${totals.usGoals} — ${totals.themGoals}`)
  out.push('')
  out.push('Player Stats:')

  for (const line of lines) {
    const parts: string[] = []
    for (const stat of [...NEGATIVE_STATS, ...POSITIVE_STATS]) {
      const count = line.counts[stat]
      if (count > 0) {
        parts.push(`${count} ${STAT_LABELS[stat]}`)
      }
    }
    if (parts.length > 0) {
      out.push(`${line.position} ${line.name}: ${parts.join(', ')}`)
    } else {
      out.push(`${line.position} ${line.name}: —`)
    }
  }

  const subs = getSubstitutionLog(match)
  if (subs.length > 0) {
    out.push('')
    out.push('Substitutions:')
    subs.forEach((s) => out.push(s))
  }

  return out.join('\n')
}

/** Print-friendly HTML for PDF export via window.print(). */
export function buildReportHtml(match: MatchData): string {
  const totals = computeMatchTotals(match)
  const lines = computePlayerStatLines(match)
  const subs = getSubstitutionLog(match)
  const allStats: StatType[] = [...NEGATIVE_STATS, ...POSITIVE_STATS]

  const headerCells = allStats
    .map((s) => `<th>${STAT_LABELS[s]}</th>`)
    .join('')

  const bodyRows = lines
    .map((line) => {
      const cells = allStats
        .map((s) => {
          const v = line.counts[s]
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
