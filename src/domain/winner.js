import { MATCH_STATUSES, TOURNAMENT_TYPES, normalizeTournamentType } from '../domain/constants.js'
import { getMatchWinner } from '../domain/cup.js'
import { computeStandings } from '../domain/series.js'

/** Vinner for avsluttet turnering (cup-finale eller tabell-#1). */
export function getTournamentWinner(tournament) {
  if (!tournament || tournament.status !== 'finished') return null

  if (normalizeTournamentType(tournament.type) === TOURNAMENT_TYPES.CUP) {
    const final = tournament.matches.reduce(
      (best, m) => (!best || m.round > best.round ? m : best),
      null,
    )
    if (!final || final.status !== MATCH_STATUSES.COMPLETED) return null
    const winnerId = getMatchWinner(final)
    const p = tournament.participants.find((x) => x.id === winnerId)
    return p ? { id: p.id, name: p.name } : null
  }

  const standings = computeStandings(tournament.participants, tournament.matches)
  if (!standings.length) return null
  const top = standings[0]
  return { id: top.participantId, name: top.name, points: top.points }
}
