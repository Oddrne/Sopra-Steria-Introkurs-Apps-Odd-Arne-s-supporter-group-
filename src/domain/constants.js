/**
 * Domene-konstanter — arkitekturspesifikasjon §6 / §10
 */

export const TOURNAMENT_TYPES = {
  ROUND_ROBIN: 'round_robin',
  CUP: 'cup',
  LEAGUE: 'league',
}

export const TOURNAMENT_TYPE_LABELS = {
  round_robin: 'Alle-mot-alle',
  cup: 'Cup (knockout)',
  league: 'Liga',
}

export const TOURNAMENT_STATUSES = {
  DRAFT: 'draft',
  REGISTRATION: 'registration',
  ACTIVE: 'active',
  FINISHED: 'finished',
}

export const TOURNAMENT_STATUS_LABELS = {
  draft: 'Påmelding stengt',
  registration: 'Påmelding åpen',
  active: 'Pågår',
  finished: 'Avsluttet',
}

export const MATCH_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
}

export const USER_ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  PLAYER: 'player',
}

export function isSeriesType(type) {
  return type === TOURNAMENT_TYPES.ROUND_ROBIN || type === TOURNAMENT_TYPES.LEAGUE
}

export function canOrganize(user) {
  if (!user) return false
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.ORGANIZER
}

export function isTournamentOwner(tournament, user) {
  return Boolean(user && tournament && tournament.ownerId === user.id)
}

export function canManageTournament(tournament, user) {
  return canOrganize(user) || isTournamentOwner(tournament, user)
}
