import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from '../domain/constants.js'

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {TOURNAMENT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function TypeBadge({ type }) {
  return (
    <span className={`badge badge-type badge-type-${type}`}>
      {TOURNAMENT_TYPE_LABELS[type] ?? type}
    </span>
  )
}
