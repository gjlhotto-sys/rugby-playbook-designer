export type RugbyPosition =
  | 'LHP' | 'HK' | 'THP' | 'LK' | 'RK'
  | 'BF' | 'OF' | 'NE' | 'SH' | 'FH'
  | 'IC' | 'OC' | 'LW' | 'RW' | 'FB'

export const RUGBY_POSITIONS_STATS = [
  { number: 1, abbr: 'LHP', position: 'Loosehead Prop' },
  { number: 2, abbr: 'HK', position: 'Hooker' },
  { number: 3, abbr: 'THP', position: 'Tighthead Prop' },
  { number: 4, abbr: 'LK', position: 'Left Lock' },
  { number: 5, abbr: 'RK', position: 'Right Lock' },
  { number: 6, abbr: 'BF', position: 'Blindside Flanker' },
  { number: 7, abbr: 'OF', position: 'Openside Flanker' },
  { number: 8, abbr: 'NE', position: 'Number Eight' },
  { number: 9, abbr: 'SH', position: 'Scrumhalf' },
  { number: 10, abbr: 'FH', position: 'Flyhalf' },
  { number: 11, abbr: 'LW', position: 'Left Wing' },
  { number: 12, abbr: 'IC', position: 'Inside Centre' },
  { number: 13, abbr: 'OC', position: 'Outside Centre' },
  { number: 14, abbr: 'RW', position: 'Right Wing' },
  { number: 15, abbr: 'FB', position: 'Fullback' },
]

export const FORWARDS = [1, 2, 3, 4, 5, 6, 7, 8]
export const BACKS = [9, 10, 11, 12, 13, 14, 15]

export type RugbyStatType =
  // Attacking
  | 'carry'
  | 'meters_5'
  | 'meters_10'
  | 'meters_20'
  | 'line_break'
  | 'offload'
  | 'try_scored'
  | 'try_assist'
  | 'clean_break'
  | 'ruck_joined'
  // Defensive
  | 'tackle_made'
  | 'tackle_missed'
  | 'turnover_won'
  | 'intercept'
  // Set Piece
  | 'lineout_won'
  | 'lineout_lost'
  | 'scrum_won'
  | 'scrum_lost'
  // Faults
  | 'knock_on'
  | 'forward_pass'
  | 'penalty_conceded'
  | 'yellow_card'
  | 'red_card'
  // Kicking
  | 'kick_made'
  | 'kick_failed'
  | 'conversion_made'
  | 'conversion_missed'
  | 'penalty_kick_made'
  | 'penalty_kick_missed'

export type RugbyStatGroupId =
  | 'attacking'
  | 'defensive'
  | 'set_piece'
  | 'faults'
  | 'kicking'

export const RUGBY_STAT_GROUPS: Record<
  RugbyStatGroupId,
  {
    label: string
    color: string
    borderColor: string
    bg: string
    stats: RugbyStatType[]
  }
> = {
  attacking: {
    label: 'Attacking',
    color: '#86efac',
    borderColor: '#16a34a',
    bg: '#0a1f0a',
    stats: [
      'carry', 'meters_5', 'meters_10',
      'meters_20', 'line_break', 'offload',
      'try_scored', 'try_assist', 'clean_break',
      'ruck_joined',
    ],
  },
  defensive: {
    label: 'Defensive',
    color: '#93c5fd',
    borderColor: '#2563eb',
    bg: '#0a0f2a',
    stats: [
      'tackle_made', 'tackle_missed',
      'turnover_won', 'intercept',
      'ruck_joined',
    ],
  },
  set_piece: {
    label: 'Set Piece',
    color: '#fcd34d',
    borderColor: '#f59e0b',
    bg: '#1f1a0a',
    stats: [
      'lineout_won', 'lineout_lost',
      'scrum_won', 'scrum_lost',
    ],
  },
  faults: {
    label: 'Faults',
    color: '#f87171',
    borderColor: '#dc2626',
    bg: '#1f0a0a',
    stats: [
      'knock_on', 'forward_pass',
      'penalty_conceded', 'yellow_card', 'red_card',
    ],
  },
  kicking: {
    label: 'Kicking',
    color: '#c084fc',
    borderColor: '#a855f7',
    bg: '#1a0a2a',
    stats: [
      'kick_made', 'kick_failed',
      'conversion_made', 'conversion_missed',
      'penalty_kick_made', 'penalty_kick_missed',
    ],
  },
}

export const RUGBY_STAT_GROUP_ORDER: RugbyStatGroupId[] = [
  'attacking',
  'defensive',
  'set_piece',
  'faults',
  'kicking',
]

export const RUGBY_STAT_LABELS: Record<RugbyStatType, string> = {
  carry: 'Carry',
  meters_5: '+5m',
  meters_10: '+10m',
  meters_20: '+20m',
  line_break: 'Line Break',
  offload: 'Offload',
  try_scored: 'Try',
  try_assist: 'Try Assist',
  clean_break: 'Clean Break',
  ruck_joined: 'Ruck Joined',
  tackle_made: 'Tackle Made',
  tackle_missed: 'Tackle Missed',
  turnover_won: 'Turnover Won',
  intercept: 'Intercept',
  lineout_won: 'Lineout Won',
  lineout_lost: 'Lineout Lost',
  scrum_won: 'Scrum Won',
  scrum_lost: 'Scrum Lost',
  knock_on: 'Knock On',
  forward_pass: 'Forward Pass',
  penalty_conceded: 'Penalty',
  yellow_card: 'Yellow Card',
  red_card: 'Red Card',
  kick_made: 'Kick Made',
  kick_failed: 'Kick Failed',
  conversion_made: 'Conv Made',
  conversion_missed: 'Conv Missed',
  penalty_kick_made: 'Pen Kick Made',
  penalty_kick_missed: 'Pen Kick Missed',
}

export interface RugbyPlayerEntry {
  number: number
  position: string
  abbr: string
  name: string
  isOnField: boolean
  substitutedAt?: number
}

export interface RugbyStatEntry {
  id: string
  period: number
  timeInPeriod: number
  playerNumber: number
  playerName: string
  stat: RugbyStatType
  timestamp: number
}

export interface RugbyScore {
  us: number
  them: number
}

export type MatchMode = 'match' | 'trial'

export interface RugbyMatchData {
  id: string
  mode: MatchMode
  teamName: string
  oppositionName: string
  periodDuration: number
  totalPeriods: number
  date: string
  players: RugbyPlayerEntry[]
  stats: RugbyStatEntry[]
  scores: Record<number, RugbyScore>
  currentPeriod: number
  matchComplete: boolean
}

export interface RugbySavedTeam {
  id: string
  name: string
  players: Array<{ number: number; name: string }>
  lastUsed: string
}

/* ------------------------------ Storage -------------------------------- */

export const RUGBY_SAVED_TEAMS_KEY = 'playforge-rugby-saved-teams'
export const RUGBY_CURRENT_MATCH_KEY = 'playforge-rugby-current-match'

export function loadRugbySavedTeams(): RugbySavedTeam[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RUGBY_SAVED_TEAMS_KEY)
    return raw ? (JSON.parse(raw) as RugbySavedTeam[]) : []
  } catch {
    return []
  }
}

export function persistRugbySavedTeams(teams: RugbySavedTeam[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(RUGBY_SAVED_TEAMS_KEY, JSON.stringify(teams))
}

export function loadRugbyCurrentMatch(): RugbyMatchData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(RUGBY_CURRENT_MATCH_KEY)
    return raw ? (JSON.parse(raw) as RugbyMatchData) : null
  } catch {
    return null
  }
}

export function persistRugbyCurrentMatch(match: RugbyMatchData | null) {
  if (typeof window === 'undefined') return
  if (match === null) {
    localStorage.removeItem(RUGBY_CURRENT_MATCH_KEY)
  } else {
    localStorage.setItem(RUGBY_CURRENT_MATCH_KEY, JSON.stringify(match))
  }
}

/* ----------------------------- Helpers --------------------------------- */

/** The on-field player for a jersey number (handles substitutions). */
export function getActiveRugbyPlayer(
  match: RugbyMatchData,
  number: number
): RugbyPlayerEntry | undefined {
  const entries = match.players.filter((p) => p.number === number)
  return entries.find((p) => p.isOnField) ?? entries[entries.length - 1]
}

export function periodLabel(match: RugbyMatchData, period: number): string {
  if (match.totalPeriods === 2) {
    return period === 1 ? '1st Half' : '2nd Half'
  }
  return `Q${period}`
}

export function statCount(stats: RugbyStatEntry[], stat: RugbyStatType): number {
  return stats.filter((s) => s.stat === stat).length
}

/* ------------------------- Score calculation --------------------------- */

const SCORE_POINTS: Partial<Record<RugbyStatType, number>> = {
  try_scored: 5,
  conversion_made: 2,
  penalty_kick_made: 3,
}

/** Auto-calculated "us" score from scoring stats. */
export function calculateUsScore(match: RugbyMatchData, period?: number): number {
  let total = 0
  for (const s of match.stats) {
    if (period !== undefined && s.period !== period) continue
    total += SCORE_POINTS[s.stat] ?? 0
  }
  return total
}

/* --------------------------- Stat aggregation -------------------------- */

export interface RugbyPlayerStatLine {
  number: number
  name: string
  abbr: string
  counts: Record<string, number>
  total: number
  // grouped roll-ups
  carries: number
  tackles: number
  lineouts: number
  scrums: number
  faults: number
  kicks: number
  tries: number
  positives: number
}

function metaForNumber(number: number) {
  return RUGBY_POSITIONS_STATS.find((p) => p.number === number)
}

export function computeRugbyStatLines(
  match: RugbyMatchData,
  period?: number
): RugbyPlayerStatLine[] {
  const map = new Map<string, RugbyPlayerStatLine>()

  const ensure = (number: number, name: string): RugbyPlayerStatLine => {
    const key = `${number}__${name}`
    let line = map.get(key)
    if (!line) {
      const meta = metaForNumber(number)
      line = {
        number,
        name,
        abbr: meta?.abbr ?? '',
        counts: {},
        total: 0,
        carries: 0,
        tackles: 0,
        lineouts: 0,
        scrums: 0,
        faults: 0,
        kicks: 0,
        tries: 0,
        positives: 0,
      }
      map.set(key, line)
    }
    return line
  }

  for (const p of match.players) ensure(p.number, p.name)

  const faultStats = RUGBY_STAT_GROUPS.faults.stats
  const kickStats = RUGBY_STAT_GROUPS.kicking.stats

  for (const s of match.stats) {
    if (period !== undefined && s.period !== period) continue
    const line = ensure(s.playerNumber, s.playerName)
    line.counts[s.stat] = (line.counts[s.stat] ?? 0) + 1
    line.total += 1
    if (s.stat === 'carry') line.carries += 1
    if (s.stat === 'tackle_made') line.tackles += 1
    if (s.stat === 'lineout_won' || s.stat === 'lineout_lost') line.lineouts += 1
    if (s.stat === 'scrum_won' || s.stat === 'scrum_lost') line.scrums += 1
    if ((faultStats as string[]).includes(s.stat)) line.faults += 1
    if ((kickStats as string[]).includes(s.stat)) line.kicks += 1
    if (s.stat === 'try_scored') line.tries += 1
    const isPositive =
      RUGBY_STAT_GROUPS.attacking.stats.includes(s.stat) ||
      (RUGBY_STAT_GROUPS.defensive.stats.includes(s.stat) && s.stat !== 'tackle_missed')
    if (isPositive) line.positives += 1
  }

  return Array.from(map.values()).sort((a, b) => a.number - b.number)
}

/* ------------------------------- KPIs ---------------------------------- */

export interface RugbyKpis {
  tackleSuccess: number | null
  lineoutSuccess: number | null
  scrumSuccess: number | null
  conversion: number | null
  penaltyKick: number | null
  kickFromHand: number | null
}

function pct(made: number, total: number): number | null {
  if (total === 0) return null
  return (made / total) * 100
}

export function computeRugbyKpis(match: RugbyMatchData): RugbyKpis {
  const c = (s: RugbyStatType) => statCount(match.stats, s)
  const tackleMade = c('tackle_made')
  const lineoutWon = c('lineout_won')
  const scrumWon = c('scrum_won')
  const convMade = c('conversion_made')
  const penMade = c('penalty_kick_made')
  const kickMade = c('kick_made')
  return {
    tackleSuccess: pct(tackleMade, tackleMade + c('tackle_missed')),
    lineoutSuccess: pct(lineoutWon, lineoutWon + c('lineout_lost')),
    scrumSuccess: pct(scrumWon, scrumWon + c('scrum_lost')),
    conversion: pct(convMade, convMade + c('conversion_missed')),
    penaltyKick: pct(penMade, penMade + c('penalty_kick_missed')),
    kickFromHand: pct(kickMade, kickMade + c('kick_failed')),
  }
}

export function formatRugbyPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

/** Colour thresholds: green/amber/red. Defaults: ≥80 green, ≥60 amber. */
export function rugbyPctColor(
  value: number | null,
  greenAt = 80,
  amberAt = 60
): string {
  if (value === null) return '#888'
  if (value >= greenAt) return '#86efac'
  if (value >= amberAt) return '#fcd34d'
  return '#f87171'
}

export function getRugbySubstitutionLog(match: RugbyMatchData): string[] {
  const log: string[] = []
  const byNumber = new Map<number, RugbyPlayerEntry[]>()
  for (const p of match.players) {
    const arr = byNumber.get(p.number) ?? []
    arr.push(p)
    byNumber.set(p.number, arr)
  }
  for (const [, entries] of byNumber) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.substitutedAt && entries[i + 1]) {
        const next = entries[i + 1]
        const lbl =
          match.totalPeriods === 2
            ? entry.substitutedAt === 1
              ? 'Half 1'
              : 'Half 2'
            : `Q${entry.substitutedAt}`
        log.push(
          `${lbl}: #${entry.number} ${entry.name} replaced by #${next.number} ${next.name} at ${entry.abbr}`
        )
      }
    }
  }
  return log
}

/* ---------------------------- Top performers --------------------------- */

export function rankTopPerformers(
  lines: RugbyPlayerStatLine[]
): RugbyPlayerStatLine[] {
  return [...lines].sort((a, b) => {
    if (b.tries !== a.tries) return b.tries - a.tries
    if (b.tackles !== a.tackles) return b.tackles - a.tackles
    if (b.carries !== a.carries) return b.carries - a.carries
    return b.positives - a.positives
  })
}

/** Short summary string of a player's most relevant stats. */
export function playerSummaryText(line: RugbyPlayerStatLine): string {
  const parts: string[] = []
  if (line.tackles > 0) parts.push(`${line.tackles} tackles`)
  if (line.tries > 0) parts.push(`${line.tries} try${line.tries > 1 ? 's' : ''}`)
  if (line.carries > 0) parts.push(`${line.carries} carries`)
  if (line.counts['try_assist']) parts.push(`${line.counts['try_assist']} assists`)
  return parts.slice(0, 3).join(', ')
}

/* ------------------------------ Exports -------------------------------- */

export function buildRugbyReportText(match: RugbyMatchData): string {
  const lines = computeRugbyStatLines(match)
  const ranked = rankTopPerformers(lines).filter((l) => l.total > 0)
  const out: string[] = []

  if (match.mode === 'trial') {
    out.push('PlayForge Trial Report 📋')
    out.push(`${match.teamName} — ${match.date}`)
    out.push('')
    out.push('TOP PERFORMERS:')
    ranked.forEach((l, i) => {
      const summary = playerSummaryText(l) || '—'
      out.push(`${i + 1}. #${l.number} ${l.name} — ${summary}`)
    })
    out.push('')
    out.push('Full report: playforge.co.za')
    return out.join('\n')
  }

  const kpis = computeRugbyKpis(match)
  const us = calculateUsScore(match)
  let them = 0
  for (const q of Object.keys(match.scores)) them += match.scores[Number(q)]?.them ?? 0

  out.push('PlayForge Match Report 🏉')
  out.push(`${match.teamName} vs ${match.oppositionName} — ${match.date}`)
  out.push(`Final Score: ${us}—${them}`)
  out.push('')
  out.push('KEY STATS:')
  out.push(`Tackle Success: ${formatRugbyPct(kpis.tackleSuccess)}`)
  out.push(`Lineout Success: ${formatRugbyPct(kpis.lineoutSuccess)}`)
  out.push(`Scrum Success: ${formatRugbyPct(kpis.scrumSuccess)}`)
  out.push('')
  out.push('TOP PERFORMERS:')
  ranked.slice(0, 6).forEach((l) => {
    const summary = playerSummaryText(l) || '—'
    out.push(`#${l.number} ${l.name}: ${summary}`)
  })
  out.push('')
  out.push('Full report: playforge.co.za')
  return out.join('\n')
}

export function buildRugbyReportHtml(match: RugbyMatchData): string {
  const lines = computeRugbyStatLines(match)
  const kpis = computeRugbyKpis(match)
  const subs = getRugbySubstitutionLog(match)
  const isMatch = match.mode === 'match'
  const us = calculateUsScore(match)
  let them = 0
  for (const q of Object.keys(match.scores)) them += match.scores[Number(q)]?.them ?? 0

  const kpiRows = [
    ['Tackle Success', formatRugbyPct(kpis.tackleSuccess)],
    ['Lineout Success', formatRugbyPct(kpis.lineoutSuccess)],
    ['Scrum Success', formatRugbyPct(kpis.scrumSuccess)],
    ['Conversion', formatRugbyPct(kpis.conversion)],
    ['Penalty Kick', formatRugbyPct(kpis.penaltyKick)],
    ['Kick From Hand', formatRugbyPct(kpis.kickFromHand)],
  ]
    .map(([k, v]) => `<tr><td style="text-align:left">${k}</td><td>${v}</td></tr>`)
    .join('')

  const playerRows = lines
    .map(
      (l) =>
        `<tr><td>${l.number}</td><td style="text-align:left;font-weight:600">${escapeHtml(
          l.name
        )}</td><td>${l.abbr}</td><td>${l.carries}</td><td>${l.tackles}</td><td>${
          l.lineouts
        }</td><td>${l.scrums}</td><td>${l.faults}</td><td>${l.kicks}</td><td style="font-weight:700">${
          l.total
        }</td></tr>`
    )
    .join('')

  const subsHtml =
    subs.length > 0
      ? `<h2>Substitutions</h2><ul>${subs
          .map((s) => `<li>${escapeHtml(s)}</li>`)
          .join('')}</ul>`
      : ''

  const title = isMatch
    ? `${escapeHtml(match.teamName)} vs ${escapeHtml(match.oppositionName)}`
    : `Trial Session — ${escapeHtml(match.teamName)}`

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Rugby Report — ${title}</title>
<style>
  @page { size: A4 landscape; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#111; margin:24px; }
  .brand { display:flex; align-items:center; gap:10px; border-bottom:2px solid #16a34a; padding-bottom:12px; margin-bottom:16px; }
  .brand .logo { width:34px; height:34px; border-radius:8px; background:#16a34a; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
  h1 { font-size:20px; margin:0; }
  h2 { font-size:14px; margin:20px 0 8px; text-transform:uppercase; letter-spacing:0.5px; color:#555; }
  .score { font-size:32px; font-weight:800; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  th, td { border:1px solid #ddd; padding:5px 6px; text-align:center; }
  th { background:#f4f4f5; }
  .meta { color:#666; font-size:12px; }
  @media print { body { margin:0; } }
</style>
</head>
<body>
  <div class="brand">
    <div class="logo">🏉</div>
    <div>
      <h1>PlayForge — ${isMatch ? 'Match' : 'Trial'} Report</h1>
      <div class="meta">${title} — ${escapeHtml(match.date)}</div>
    </div>
  </div>
  ${isMatch ? `<div class="score">${us} — ${them}</div>` : ''}

  <h2>Key Performance Indicators</h2>
  <table style="max-width:360px">
    <thead><tr><th style="text-align:left">Metric</th><th>Value</th></tr></thead>
    <tbody>${kpiRows}</tbody>
  </table>

  <h2>Player Stats</h2>
  <table>
    <thead><tr><th>#</th><th style="text-align:left">Player</th><th>Pos</th><th>Carries</th><th>Tackles</th><th>Lineouts</th><th>Scrums</th><th>Faults</th><th>Kicks</th><th>Total</th></tr></thead>
    <tbody>${playerRows}</tbody>
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
