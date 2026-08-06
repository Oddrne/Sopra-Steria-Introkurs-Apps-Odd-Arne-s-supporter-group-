import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_TYPE_LABELS,
  normalizeTournamentType,
} from '../domain/constants.js'

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {TOURNAMENT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function TypeBadge({ type }) {
  const normalized = normalizeTournamentType(type)
  return (
    <span className={`badge badge-type badge-type-${normalized}`}>
      {TOURNAMENT_TYPE_LABELS[normalized] ?? normalized}
    </span>
  )
}
