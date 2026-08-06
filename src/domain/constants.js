/**
 * Domene-konstanter
 * Serie = alle-mot-alle (tidligere også kalt «liga» — samme format).
 */

export const TOURNAMENT_TYPES = {
  ROUND_ROBIN: 'round_robin',
  CUP: 'cup',
  SWISS: 'swiss',
}

export const TOURNAMENT_TYPE_LABELS = {
  round_robin: 'Alle-mot-alle',
  cup: 'Cup (knockout)',
  swiss: 'Swiss',
  // legacy (normaliseres til round_robin ved lasting)
  league: 'Alle-mot-alle',
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

/** Canonicaliser legacy «league» → round_robin */
export function normalizeTournamentType(type) {
  if (type === 'league') return TOURNAMENT_TYPES.ROUND_ROBIN
  return type
}

export function isSeriesType(type) {
  return normalizeTournamentType(type) === TOURNAMENT_TYPES.ROUND_ROBIN
}

export function usesStandingsTable(type) {
  const t = normalizeTournamentType(type)
  return t === TOURNAMENT_TYPES.ROUND_ROBIN || t === TOURNAMENT_TYPES.SWISS
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
