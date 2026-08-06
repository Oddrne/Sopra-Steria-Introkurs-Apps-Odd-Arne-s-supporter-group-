import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge, { TypeBadge } from '../components/StatusBadge.jsx'
import {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  TOURNAMENT_TYPES,
} from '../domain/constants.js'
import { computeStandings } from '../domain/roundRobin.js'

export default function TournamentDetailPage() {
  const { id } = useParams()
  const {
    tournaments,
    addParticipant,
    removeParticipant,
    startTournament,
    setMatchResult,
  } = useApp()
  const tournament = tournaments.find((t) => t.id === id)

  const [participantName, setParticipantName] = useState('')
  const [scoreDrafts, setScoreDrafts] = useState({})
  const [message, setMessage] = useState('')

  const participantById = useMemo(() => {
    if (!tournament) return {}
    return Object.fromEntries(tournament.participants.map((p) => [p.id, p]))
  }, [tournament])

  const standings = useMemo(() => {
    if (!tournament || tournament.type !== TOURNAMENT_TYPES.ROUND_ROBIN) return []
    return computeStandings(tournament.participants, tournament.matches)
  }, [tournament])

  const matchesByRound = useMemo(() => {
    if (!tournament) return []
    const map = new Map()
    for (const match of tournament.matches) {
      if (!map.has(match.round)) map.set(match.round, [])
      map.get(match.round).push(match)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [tournament])

  if (!tournament) {
    return (
      <section className="page">
        <h1>Fant ikke turneringen</h1>
        <Link to="/tournaments">Tilbake</Link>
      </section>
    )
  }

  const canEditParticipants =
    tournament.status === TOURNAMENT_STATUSES.DRAFT ||
    tournament.status === TOURNAMENT_STATUSES.REGISTRATION

  const isRoundRobin = tournament.type === TOURNAMENT_TYPES.ROUND_ROBIN
  const canStart =
    isRoundRobin &&
    canEditParticipants &&
    tournament.participants.length >= 2

  function handleAddParticipant(event) {
    event.preventDefault()
    const result = addParticipant(tournament.id, participantName)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setParticipantName('')
    setMessage('')
  }

  function handleStart() {
    startTournament(tournament.id)
    setMessage('Kampene er generert. Registrer resultater under.')
  }

  function handleSaveScore(match) {
    const draft = scoreDrafts[match.id] ?? {
      home: match.homeScore ?? '',
      away: match.awayScore ?? '',
    }
    const result = setMatchResult(tournament.id, match.id, draft.home, draft.away)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setMessage('Resultat lagret.')
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/tournaments">Turneringer</Link> / {tournament.name}
          </p>
          <h1>{tournament.name}</h1>
          <div className="tournament-meta">
            <TypeBadge type={tournament.type} />
            <StatusBadge status={tournament.status} />
          </div>
        </div>
      </div>

      {tournament.stubNote && (
        <div className="callout callout-stub">
          <strong>Skisse-format.</strong> {tournament.stubNote} Du kan legge til deltakere, men
          kampgenerering er kun implementert for alle-mot-alle.
        </div>
      )}

      {message && <p className="toast">{message}</p>}

      <div className="detail-grid">
        <section className="panel">
          <h2>Deltakere</h2>
          {canEditParticipants && (
            <form className="inline-form" onSubmit={handleAddParticipant}>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Navn på deltaker"
              />
              <button type="submit" className="btn btn-secondary">
                Legg til
              </button>
            </form>
          )}

          {tournament.participants.length === 0 ? (
            <p className="muted">Ingen deltakere ennå.</p>
          ) : (
            <ul className="participant-list">
              {tournament.participants.map((p) => (
                <li key={p.id}>
                  <span>
                    #{p.seed} {p.name}
                  </span>
                  {canEditParticipants && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeParticipant(tournament.id, p.id)}
                    >
                      Fjern
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canStart && (
            <button type="button" className="btn btn-primary" onClick={handleStart}>
              Start turnering (generer kamper)
            </button>
          )}

          {!isRoundRobin && canEditParticipants && (
            <p className="muted">
              Start er deaktivert for dette formatet i MVP. Bytt til alle-mot-alle for full flyt.
            </p>
          )}
        </section>

        {isRoundRobin && tournament.matches.length > 0 && (
          <>
            <section className="panel">
              <h2>Tabell</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Lag</th>
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
            </section>

            <section className="panel panel-wide">
              <h2>Kamper</h2>
              {matchesByRound.map(([round, matches]) => (
                <div key={round} className="round-block">
                  <h3>Runde {round}</h3>
                  <ul className="match-list">
                    {matches.map((match) => {
                      const home = participantById[match.homeParticipantId]?.name ?? '?'
                      const away = participantById[match.awayParticipantId]?.name ?? '?'
                      const draft = scoreDrafts[match.id] ?? {
                        home: match.homeScore ?? '',
                        away: match.awayScore ?? '',
                      }
                      const done = match.status === MATCH_STATUSES.COMPLETED

                      return (
                        <li key={match.id} className={`match-row ${done ? 'is-done' : ''}`}>
                          <span className="match-teams">
                            {home} <em>vs</em> {away}
                          </span>
                          <div className="match-score">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={draft.home}
                              onChange={(e) =>
                                setScoreDrafts((prev) => ({
                                  ...prev,
                                  [match.id]: { ...draft, home: e.target.value },
                                }))
                              }
                              aria-label={`Poeng ${home}`}
                            />
                            <span>—</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={draft.away}
                              onChange={(e) =>
                                setScoreDrafts((prev) => ({
                                  ...prev,
                                  [match.id]: { ...draft, away: e.target.value },
                                }))
                              }
                              aria-label={`Poeng ${away}`}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleSaveScore(match)}
                            >
                              {done ? 'Oppdater' : 'Lagre'}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </section>
  )
}
