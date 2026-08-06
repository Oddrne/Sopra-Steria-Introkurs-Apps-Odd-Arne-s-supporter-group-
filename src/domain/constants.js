/**
 * Domain constants — mirrors arkitekturspesifikasjonen
 * Tournament.type: round_robin | cup | league
 * Tournament.status: draft | registration | active | finished
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
  draft: 'Utkast',
  registration: 'Påmelding',
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

/** Formats fully playable in this MVP */
export const FULLY_SUPPORTED_TYPES = [TOURNAMENT_TYPES.ROUND_ROBIN]

/** Formats selectable but stubbed */
export const STUB_TYPES = [TOURNAMENT_TYPES.CUP, TOURNAMENT_TYPES.LEAGUE]
