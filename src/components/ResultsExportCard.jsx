import { forwardRef } from 'react'
import StandingsTable from './StandingsTable.jsx'
import WinnerTrophy from './WinnerTrophy.jsx'
import { TypeBadge } from './StatusBadge.jsx'
import { TOURNAMENT_TYPE_LABELS, normalizeTournamentType } from '../domain/constants.js'

/**
 * Dedikert kort for PNG-eksport av resultat.
 */
const ResultsExportCard = forwardRef(function ResultsExportCard(
  { tournament, winner, standings },
  ref,
) {
  const type = normalizeTournamentType(tournament.type)
  const completed = tournament.matches.filter((m) => m.status === 'completed' && !m.isBye).length

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

      {!standings.length && winner && (
        <p className="export-cup-note">Cup-vinner kåret via knockout-finale.</p>
      )}

      <footer className="export-footer">kjell-games-turnering · {new Date().toLocaleDateString('nb-NO')}</footer>
    </div>
  )
})

export default ResultsExportCard
