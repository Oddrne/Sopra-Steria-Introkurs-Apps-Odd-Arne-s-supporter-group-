import { MATCH_STATUSES } from './constants.js'

/**
 * Cup-motor: single elimination.
 * Oddetall → bye. Uavgjort ikke tillatt.
 * Vinner flyttes via nextMatchId / nextSlot.
 */

function nextPowerOfTwo(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

function roundLabel(totalRounds, roundIndex) {
  const remaining = totalRounds - roundIndex
  if (remaining === 1) return 'Finale'
  if (remaining === 2) return 'Semifinale'
  if (remaining === 3) return 'Kvartfinale'
  return `Runde ${roundIndex + 1}`
}

/**
 * @returns {{ matches: object[], autoAdvances: Array<{matchId, winnerId}> }}
 */
/**
 * @param {string[]} participantIds — gjerne sortert sterkest først (ranking 3→1)
 */
export function generateCupBracket(participantIds) {
  const seeded = [...participantIds]
  if (seeded.length < 2) return { matches: [], autoAdvances: [] }

  const size = nextPowerOfTwo(seeded.length)
  const byeCount = size - seeded.length
  const slots = [...seeded]
  for (let i = 0; i < byeCount; i += 1) slots.push(null)

  const totalRounds = Math.log2(size)
  const matches = []
  const rounds = []

  // Build empty bracket tree from final backwards, then fill round 1
  for (let r = 0; r < totalRounds; r += 1) {
    const count = size / 2 ** (r + 1)
    const roundMatches = []
    for (let i = 0; i < count; i += 1) {
      const match = {
        id: crypto.randomUUID(),
        round: r + 1,
        roundName: roundLabel(totalRounds, r),
        number: i + 1,
        homeParticipantId: null,
        awayParticipantId: null,
        homeScore: null,
        awayScore: null,
        status: MATCH_STATUSES.PENDING,
        nextMatchId: null,
        nextSlot: null,
        isBye: false,
      }
      roundMatches.push(match)
      matches.push(match)
    }
    rounds.push(roundMatches)
  }

  // Wire nextMatchId: winner of rounds[r][i] → rounds[r+1][floor(i/2)] slot i%2
  for (let r = 0; r < totalRounds - 1; r += 1) {
    for (let i = 0; i < rounds[r].length; i += 1) {
      const next = rounds[r + 1][Math.floor(i / 2)]
      rounds[r][i].nextMatchId = next.id
      rounds[r][i].nextSlot = i % 2 === 0 ? 'home' : 'away'
    }
  }

  // Place participants into first round (standard: pair 1vsN, 2vsN-1, …)
  const first = rounds[0]
  const autoAdvances = []
  for (let i = 0; i < first.length; i += 1) {
    const home = slots[i]
    const away = slots[size - 1 - i]
    first[i].homeParticipantId = home
    first[i].awayParticipantId = away

    if (home && !away) {
      first[i].isBye = true
      first[i].status = MATCH_STATUSES.COMPLETED
      first[i].homeScore = 1
      first[i].awayScore = 0
      autoAdvances.push({ matchId: first[i].id, winnerId: home })
    } else if (!home && away) {
      first[i].isBye = true
      first[i].status = MATCH_STATUSES.COMPLETED
      first[i].homeScore = 0
      first[i].awayScore = 1
      autoAdvances.push({ matchId: first[i].id, winnerId: away })
    }
  }

  return { matches, autoAdvances }
}

export function getMatchWinner(match) {
  if (match.status !== MATCH_STATUSES.COMPLETED) return null
  if (match.homeScore > match.awayScore) return match.homeParticipantId
  if (match.awayScore > match.homeScore) return match.awayParticipantId
  return null
}

/** Place winner into next match slot. Returns updated matches array. */
export function advanceWinner(matches, completedMatch) {
  const winnerId = getMatchWinner(completedMatch)
  if (!winnerId || !completedMatch.nextMatchId) return matches

  return matches.map((m) => {
    if (m.id !== completedMatch.nextMatchId) return m
    if (completedMatch.nextSlot === 'home') {
      return { ...m, homeParticipantId: winnerId }
    }
    return { ...m, awayParticipantId: winnerId }
  })
}

export function applyAutoAdvances(matches, autoAdvances) {
  let next = matches
  for (const { matchId } of autoAdvances) {
    const match = next.find((m) => m.id === matchId)
    if (match) next = advanceWinner(next, match)
  }
  return next
}

export function isCupComplete(matches) {
  if (matches.length === 0) return false
  const final = matches.reduce((a, b) => (a.round > b.round ? a : b))
  return final.status === MATCH_STATUSES.COMPLETED && getMatchWinner(final) != null
}

export function getCupChampion(matches, participants) {
  if (!isCupComplete(matches)) return null
  const final = matches.reduce((a, b) => (a.round > b.round ? a : b))
  const winnerId = getMatchWinner(final)
  return participants.find((p) => p.id === winnerId) ?? null
}
