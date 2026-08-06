import { forwardRef, useMemo } from 'react'
import StandingsTable from './StandingsTable.jsx'
import WinnerTrophy from './WinnerTrophy.jsx'
import { TypeBadge } from './StatusBadge.jsx'
import { MATCH_STATUSES, normalizeTournamentType } from '../domain/constants.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { LOCALES } from '../i18n/messages.js'

/**
 * Dedikert kort for PNG-eksport av resultat (vinner + tabell + runderesultater).
 */
const ResultsExportCard = forwardRef(function ResultsExportCard(
  { tournament, winner, standings, participantById = {} },
  ref,
) {
  const { t, locale } = useI18n()
  const type = normalizeTournamentType(tournament.type)
  const completed = tournament.matches.filter((m) => m.status === 'completed' && !m.isBye).length

  const rounds = useMemo(() => {
    const map = new Map()
    for (const match of tournament.matches) {
      if (!map.has(match.round)) map.set(match.round, [])
      map.get(match.round).push(match)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({
        round,
        label: matches[0]?.roundName ?? t('tree.round', { n: round }),
        matches: [...matches].sort((a, b) => a.number - b.number),
      }))
  }, [tournament.matches, t])

  function nameOf(id, fallback = t('export.tbd')) {
    if (!id) return fallback
    return participantById[id]?.name ?? fallback
  }

  const dateLocale = locale === LOCALES.en ? 'en-GB' : 'nb-NO'

  return (
    <div ref={ref} className="export-card">
      <header className="export-card-header">
        <div className="export-brand">
          <span className="brand-mark">KG</span>
          <div>
            <strong>Kjell Games</strong>
            <em>{t('export.subtitle')}</em>
          </div>
        </div>
        <TypeBadge type={type} />
      </header>

      <h2 className="export-title">{tournament.name}</h2>
      <p className="export-meta muted">
        {t('export.meta', {
          type: t(`type.${type}`),
          participants: tournament.participants.length,
          matches: completed,
        })}
      </p>

      {winner ? (
        <WinnerTrophy winner={winner} tournamentName={tournament.name} />
      ) : (
        <p className="muted">{t('export.noWinner')}</p>
      )}

      {standings.length > 0 && (
        <div className="export-standings">
          <h3>{t('export.table')}</h3>
          <StandingsTable standings={standings} participants={tournament.participants} />
        </div>
      )}

      {rounds.length > 0 && (
        <div className="export-rounds">
          <h3>{t('export.rounds')}</h3>
          {rounds.map(({ round, label, matches }) => (
            <div key={round} className="export-round-block">
              <h4>{label}</h4>
              <ul className="export-match-list">
                {matches.map((match) => {
                  if (match.isBye) {
                    return (
                      <li key={match.id} className="export-match-row is-bye">
                        <span>
                          {nameOf(match.homeParticipantId || match.awayParticipantId)} —{' '}
                          {t('detail.bye')}
                        </span>
                        <strong>W</strong>
                      </li>
                    )
                  }

                  const home = nameOf(match.homeParticipantId)
                  const away = nameOf(match.awayParticipantId)
                  const done = match.status === MATCH_STATUSES.COMPLETED
                  const pending = !match.homeParticipantId || !match.awayParticipantId

                  return (
                    <li
                      key={match.id}
                      className={`export-match-row ${done ? 'is-done' : ''}`}
                    >
                      <span className="export-match-teams">
                        {home} <em>vs</em> {away}
                      </span>
                      <strong className="export-match-score">
                        {done
                          ? `${match.homeScore} — ${match.awayScore}`
                          : pending
                            ? t('export.tbd')
                            : t('export.waiting')}
                      </strong>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <footer className="export-footer">
        kjell-games-turnering · {new Date().toLocaleDateString(dateLocale)}
      </footer>
    </div>
  )
})

export default ResultsExportCard
