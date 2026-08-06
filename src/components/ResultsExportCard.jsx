import { forwardRef, useMemo } from 'react'
import StandingsTable from './StandingsTable.jsx'
import WinnerTrophy from './WinnerTrophy.jsx'
import { TypeBadge } from './StatusBadge.jsx'
import {
  MATCH_STATUSES,
  TOURNAMENT_TYPE_LABELS,
  normalizeTournamentType,
} from '../domain/constants.js'

/**
 * Dedikert kort for PNG-eksport av resultat (vinner + tabell + runderesultater).
 */
const ResultsExportCard = forwardRef(function ResultsExportCard(
  { tournament, winner, standings, participantById = {} },
  ref,
) {
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
        label: matches[0]?.roundName ?? `Runde ${round}`,
        matches: [...matches].sort((a, b) => a.number - b.number),
      }))
  }, [tournament.matches])

  function nameOf(id, fallback = 'TBD') {
    if (!id) return fallback
    return participantById[id]?.name ?? fallback
  }

  return (
    <div ref={ref} className="export-card">
      <header className="export-card-header">
        <div className="export-brand">
          <span className="brand-mark">KG</span>
          <div>
            <strong>Kjell Games</strong>
            <em>Turneringsresultat</em>
          </div>
        </div>
        <TypeBadge type={type} />
      </header>

      <h2 className="export-title">{tournament.name}</h2>
      <p className="export-meta muted">
        {TOURNAMENT_TYPE_LABELS[type] ?? type}
        {' · '}
        {tournament.participants.length} deltakere
        {' · '}
        {completed} kamper spilt
      </p>

      {winner ? (
        <WinnerTrophy winner={winner} tournamentName={tournament.name} />
      ) : (
        <p className="muted">Ingen kåret vinner ennå — viser status så langt.</p>
      )}

      {standings.length > 0 && (
        <div className="export-standings">
          <h3>Tabell</h3>
          <StandingsTable standings={standings} participants={tournament.participants} />
        </div>
      )}

      {rounds.length > 0 && (
        <div className="export-rounds">
          <h3>Resultater per runde</h3>
          {rounds.map(({ round, label, matches }) => (
            <div key={round} className="export-round-block">
              <h4>{label}</h4>
              <ul className="export-match-list">
                {matches.map((match) => {
                  if (match.isBye) {
                    return (
                      <li key={match.id} className="export-match-row is-bye">
                        <span>{nameOf(match.homeParticipantId || match.awayParticipantId)} — bye</span>
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
                            ? 'TBD'
                            : 'Venter'}
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
        kjell-games-turnering · {new Date().toLocaleDateString('nb-NO')}
      </footer>
    </div>
  )
})

export default ResultsExportCard
