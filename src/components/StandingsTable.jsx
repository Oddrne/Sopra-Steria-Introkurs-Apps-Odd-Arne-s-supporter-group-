import { normalizeRanking } from '../domain/seeding.js'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function StandingsTable({ standings, participants = [] }) {
  const { t } = useI18n()

  if (!standings.length) {
    return <p className="muted">Ingen resultater ennå.</p>
  }

  const rankingById = Object.fromEntries(
    participants.map((p) => [p.id, normalizeRanking(p.ranking)]),
  )

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{t('standings.team')}</th>
            <th>R</th>
            <th>K</th>
            <th>S</th>
            <th>U</th>
            <th>T</th>
            <th>+/−</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr key={row.participantId}>
              <td>{index + 1}</td>
              <td>{row.name}</td>
              <td>{rankingById[row.participantId] ?? '–'}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>
                {row.goalsFor - row.goalsAgainst > 0 ? '+' : ''}
                {row.goalsFor - row.goalsAgainst}
              </td>
              <td>
                <strong>{row.points}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
