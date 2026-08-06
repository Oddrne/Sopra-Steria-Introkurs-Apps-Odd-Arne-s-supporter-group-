import { MATCH_STATUSES } from './constants.js'
import { pairHighVsLow, normalizeRanking, sortByRankingDesc } from './seeding.js'
import { computeStandings } from './series.js'

/**
 * Swiss-motor: runde-for-runde.
 * Runde 1: seedet (sterk vs svak).
 * Senere: lignende poeng, unngå rematch.
 */

export function defaultSwissRoundCount(participantCount) {
  if (participantCount < 2) return 0
  return Math.max(3, Math.ceil(Math.log2(participantCount)))
}

function makeMatch(round, number, homeId, awayId, { isBye = false } = {}) {
  return {
    id: crypto.randomUUID(),
    round,
    number,
    roundName: `Swiss runde ${round}`,
    homeParticipantId: homeId,
    awayParticipantId: awayId,
    homeScore: isBye ? 1 : null,
    awayScore: isBye ? 0 : null,
    status: isBye ? MATCH_STATUSES.COMPLETED : MATCH_STATUSES.PENDING,
    nextMatchId: null,
    nextSlot: null,
    isBye,
  }
}

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
  const key = a < b ? `${a}|${b}` : `${b}|${a}`
  return played.has(key)
}

export function isRoundComplete(matches, round) {
  const roundMatches = matches.filter((m) => m.round === round)
  return (
    roundMatches.length > 0 &&
    roundMatches.every((m) => m.status === MATCH_STATUSES.COMPLETED)
  )
}

export function currentSwissRound(matches) {
  if (!matches.length) return 0
  return Math.max(...matches.map((m) => m.round))
}

export function canGenerateNextSwissRound(tournament) {
  if (tournament.type !== 'swiss') return false
  if (tournament.status === 'finished') return false
  const round = currentSwissRound(tournament.matches)
  if (round === 0) return false
  if (round >= (tournament.swissRounds ?? defaultSwissRoundCount(tournament.participants.length))) {
    return false
  }
  return isRoundComplete(tournament.matches, round)
}

export function isSwissComplete(tournament) {
  const total = tournament.swissRounds ?? defaultSwissRoundCount(tournament.participants.length)
  const round = currentSwissRound(tournament.matches)
  return round >= total && isRoundComplete(tournament.matches, round)
}

/** Runde 1: sterk vs svak via seeding-rammeverket. */
export function generateSwissRoundOne(participants) {
  const { pairs, byeId } = pairHighVsLow(participants)
  const matches = []
  let number = 1

  for (const [home, away] of pairs) {
    matches.push(makeMatch(1, number, home, away))
    number += 1
  }

  if (byeId) {
    matches.push(makeMatch(1, number, byeId, null, { isBye: true }))
  }

  return matches
}

/**
 * Neste Swiss-runde: sorter på poeng, par nærmeste uten rematch.
 */
export function generateNextSwissRound(participants, existingMatches) {
  const round = currentSwissRound(existingMatches) + 1
  const standings = computeStandings(participants, existingMatches)
  const byId = Object.fromEntries(participants.map((p) => [p.id, p]))

  // Sorter: poeng, målforskjell, ranking (sterk først), seed
  const ordered = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.goalsFor - a.goalsAgainst
    const gdB = b.goalsFor - b.goalsAgainst
    if (gdB !== gdA) return gdB - gdA
    const r =
      normalizeRanking(byId[b.participantId]?.ranking) -
      normalizeRanking(byId[a.participantId]?.ranking)
    if (r !== 0) return r
    return (byId[a.participantId]?.seed ?? 0) - (byId[b.participantId]?.seed ?? 0)
  })

  const pool = ordered.map((s) => s.participantId)
  const played = playedPairs(existingMatches)
  const matches = []
  let number = 1
  let byeId = null

  if (pool.length % 2 === 1) {
    // Bye til lavest rangerte blant de med færrest byes / lavest poeng
    byeId = pickBye(pool, participants, existingMatches)
    pool.splice(pool.indexOf(byeId), 1)
  }

  const unpaired = [...pool]
  while (unpaired.length >= 2) {
    const home = unpaired.shift()
    let oppIndex = unpaired.findIndex((id) => !havePlayed(played, home, id))
    if (oppIndex === -1) oppIndex = 0 // fallback: tillat rematch om nødvendig
    const away = unpaired.splice(oppIndex, 1)[0]
    matches.push(makeMatch(round, number, home, away))
    number += 1
  }

  if (byeId) {
    matches.push(makeMatch(round, number, byeId, null, { isBye: true }))
  }

  return matches
}

function pickBye(pool, participants, existingMatches) {
  const byeCounts = Object.fromEntries(participants.map((p) => [p.id, 0]))
  for (const m of existingMatches) {
    if (m.isBye && m.homeParticipantId) {
      byeCounts[m.homeParticipantId] = (byeCounts[m.homeParticipantId] ?? 0) + 1
    }
  }

  // Blant pool: færrest byes, deretter lavest ranking, deretter sist i ranking-sort
  const ranked = sortByRankingDesc(participants.filter((p) => pool.includes(p.id))).reverse()
  ranked.sort((a, b) => (byeCounts[a.id] ?? 0) - (byeCounts[b.id] ?? 0))
  return ranked[0].id
}
