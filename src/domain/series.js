import { MATCH_STATUSES } from './constants.js'

/**
 * Serie-motor (alle-mot-alle + liga).
 * Default: én kamp per par. Poeng: 3/1/0.
 */

export function generateSeriesMatches(participantIds) {
  const ids = [...participantIds]
  if (ids.length < 2) return []

  const bye = '__bye__'
  if (ids.length % 2 === 1) ids.push(bye)

  const n = ids.length
  const rounds = n - 1
  const half = n / 2
  const matches = []
  let matchNumber = 1
  const rotating = ids.slice(1)

  for (let round = 0; round < rounds; round += 1) {
    const order = [ids[0], ...rotating]
    for (let i = 0; i < half; i += 1) {
      const home = order[i]
      const away = order[n - 1 - i]
      if (home !== bye && away !== bye) {
        matches.push({
          id: crypto.randomUUID(),
          round: round + 1,
          number: matchNumber,
          homeParticipantId: home,
          awayParticipantId: away,
          homeScore: null,
          awayScore: null,
          status: MATCH_STATUSES.PENDING,
          nextMatchId: null,
          nextSlot: null,
        })
        matchNumber += 1
      }
    }
    rotating.unshift(rotating.pop())
  }

  return matches
}

/** Poengtabell 3/1/0 — brukt av liga (hovedvisning) og alle-mot-alle. */
export function computeStandings(participants, matches) {
  const table = Object.fromEntries(
    participants.map((p) => [
      p.id,
      {
        participantId: p.id,
        name: p.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      },
    ]),
  )

  for (const match of matches) {
    if (match.status !== MATCH_STATUSES.COMPLETED) continue
    const home = table[match.homeParticipantId]
    const away = table[match.awayParticipantId]
    if (!home || !away) continue

    const hs = match.homeScore
    const as = match.awayScore

    home.played += 1
    away.played += 1
    home.goalsFor += hs
    home.goalsAgainst += as
    away.goalsFor += as
    away.goalsAgainst += hs

    if (hs > as) {
      home.won += 1
      home.points += 3
      away.lost += 1
    } else if (hs < as) {
      away.won += 1
      away.points += 3
      home.lost += 1
    } else {
      home.drawn += 1
      away.drawn += 1
      home.points += 1
      away.points += 1
    }
  }

  return Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.goalsFor - a.goalsAgainst
    const gdB = b.goalsFor - b.goalsAgainst
    if (gdB !== gdA) return gdB - gdA
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.name.localeCompare(b.name, 'nb')
  })
}

export function isSeriesComplete(matches) {
  return matches.length > 0 && matches.every((m) => m.status === MATCH_STATUSES.COMPLETED)
}
