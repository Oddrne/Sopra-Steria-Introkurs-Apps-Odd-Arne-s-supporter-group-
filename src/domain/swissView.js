import { MATCH_STATUSES } from './constants.js'
import { normalizeRanking, rankingLabel } from './seeding.js'
import { computeStandings } from './series.js'

function playedPairs(matches) {
  const set = new Set()
  for (const m of matches) {
    if (!m.homeParticipantId || !m.awayParticipantId) continue
    const a = m.homeParticipantId
    const b = m.awayParticipantId
    set.add(a < b ? `${a}|${b}` : `${b}|${a}`)
  }
  return set
}

function havePlayed(played, a, b) {
  return played.has(a < b ? `${a}|${b}` : `${b}|${a}`)
}

/** Standings basert på kamper før gitt runde. */
export function standingsBeforeRound(participants, matches, round) {
  const prior = matches.filter(
    (m) => m.round < round && m.status === MATCH_STATUSES.COMPLETED,
  )
  return computeStandings(participants, prior)
}

/** Poenggrupper (høyest først). */
export function buildScoreGroups(standings) {
  const map = new Map()
  for (const row of standings) {
    if (!map.has(row.points)) map.set(row.points, [])
    map.get(row.points).push(row)
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([points, rows]) => ({
      key: `pts-${points}`,
      points,
      label: `${points} p`,
      rows,
    }))
}

/** Ranking-grupper for runde 1 (før poeng finnes). */
export function buildRankingGroups(participants) {
  const map = new Map()
  for (const p of participants) {
    const r = normalizeRanking(p.ranking)
    if (!map.has(r)) map.set(r, [])
    map.get(r).push(p)
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([ranking, rows]) => ({
      key: `rank-${ranking}`,
      ranking,
      points: null,
      label: `${ranking} · ${rankingLabel(ranking)}`,
      rows: rows.map((p) => ({
        participantId: p.id,
        name: p.name,
        points: 0,
        ranking,
      })),
    }))
}

/**
 * Grupper som brukes til å visualisere pairing-grunnlaget for en runde.
 * Runde 1 → ranking. Senere → poeng før runden.
 */
export function groupsForRound(participants, matches, round) {
  if (round <= 1) return { mode: 'ranking', groups: buildRankingGroups(participants) }
  const standings = standingsBeforeRound(participants, matches, round)
  return { mode: 'points', groups: buildScoreGroups(standings) }
}

export function explainSwissPairing(match, participants, allMatches) {
  if (match.isBye) {
    return { kind: 'bye', label: 'Bye', detail: 'Oddetall — fri runde' }
  }

  const byId = Object.fromEntries(participants.map((p) => [p.id, p]))
  const home = byId[match.homeParticipantId]
  const away = byId[match.awayParticipantId]

  if (match.round === 1) {
    const hr = normalizeRanking(home?.ranking)
    const ar = normalizeRanking(away?.ranking)
    return {
      kind: 'seed',
      label: `Seedet (${hr} vs ${ar})`,
      detail: `${rankingLabel(hr)} vs ${rankingLabel(ar)} — sterke møter ikke hverandre først`,
    }
  }

  const standings = standingsBeforeRound(participants, allMatches, match.round)
  const pointsById = Object.fromEntries(standings.map((s) => [s.participantId, s.points]))
  const hp = pointsById[match.homeParticipantId] ?? 0
  const ap = pointsById[match.awayParticipantId] ?? 0

  const prior = allMatches.filter((m) => m.round < match.round)
  const rematch = havePlayed(playedPairs(prior), match.homeParticipantId, match.awayParticipantId)

  if (rematch) {
    return {
      kind: 'rematch',
      label: `Rematch · ${hp} vs ${ap} p`,
      detail: 'Ingen annen ledig motstander uten rematch',
    }
  }

  if (hp === ap) {
    return {
      kind: 'same',
      label: `Samme poeng (${hp}–${ap})`,
      detail: 'Vinnere møter vinnere / lik situasjon',
    }
  }

  return {
    kind: 'adjacent',
    label: `Poeng ${hp} vs ${ap}`,
    detail: 'Nærliggende poenggrupper',
  }
}

export function roundsWithMeta(participants, matches) {
  const byRound = new Map()
  for (const m of matches) {
    if (!byRound.has(m.round)) byRound.set(m.round, [])
    byRound.get(m.round).push(m)
  }

  return [...byRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, roundMatches]) => {
      const { mode, groups } = groupsForRound(participants, matches, round)
      const sorted = [...roundMatches].sort((a, b) => a.number - b.number)
      return {
        round,
        label: sorted[0]?.roundName ?? `Swiss runde ${round}`,
        mode,
        groups,
        matches: sorted.map((match) => ({
          match,
          pairing: explainSwissPairing(match, participants, matches),
        })),
      }
    })
}
