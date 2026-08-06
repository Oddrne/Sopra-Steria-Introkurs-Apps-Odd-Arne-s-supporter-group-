import { MATCH_STATUSES } from '../domain/constants.js'
import { getMatchWinner } from '../domain/cup.js'

export default function CupBracket({ matches, participantById }) {
  const byRound = new Map()
  for (const match of matches) {
    if (!byRound.has(match.round)) byRound.set(match.round, [])
    byRound.get(match.round).push(match)
  }

  const rounds = [...byRound.entries()].sort((a, b) => a[0] - b[0])

  return (
    <div className="bracket">
      {rounds.map(([round, roundMatches]) => (
        <div key={round} className="bracket-round">
          <h3>{roundMatches[0]?.roundName ?? `Runde ${round}`}</h3>
          <ul className="bracket-list">
            {roundMatches.map((match) => {
              const home = match.homeParticipantId
                ? participantById[match.homeParticipantId]?.name
                : 'TBD'
              const away = match.awayParticipantId
                ? participantById[match.awayParticipantId]?.name
                : match.isBye
                  ? 'Bye'
                  : 'TBD'
              const winnerId = getMatchWinner(match)
              const done = match.status === MATCH_STATUSES.COMPLETED

              return (
                <li key={match.id} className={`bracket-match ${done ? 'is-done' : ''}`}>
                  <div className={`bracket-slot ${winnerId === match.homeParticipantId ? 'winner' : ''}`}>
                    <span>{home ?? 'TBD'}</span>
                    <strong>{done ? match.homeScore : '–'}</strong>
                  </div>
                  <div className={`bracket-slot ${winnerId === match.awayParticipantId ? 'winner' : ''}`}>
                    <span>{away ?? 'TBD'}</span>
                    <strong>{done ? match.awayScore : '–'}</strong>
                  </div>
                  {match.isBye && <em className="bye-tag">Bye</em>}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
