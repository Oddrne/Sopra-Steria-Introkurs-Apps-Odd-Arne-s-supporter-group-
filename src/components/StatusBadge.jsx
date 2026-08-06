import {
  normalizeTournamentType,
} from '../domain/constants.js'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function StatusBadge({ status }) {
  const { t } = useI18n()
  return (
    <span className={`badge badge-${status}`}>
      {t(`status.${status}`)}
    </span>
  )
}

export function TypeBadge({ type }) {
  const { t } = useI18n()
  const normalized = normalizeTournamentType(type)
  return (
    <span className={`badge badge-type badge-type-${normalized}`}>
      {t(`type.${normalized}`)}
    </span>
  )
}
