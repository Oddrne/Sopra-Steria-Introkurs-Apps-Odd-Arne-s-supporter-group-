import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge, { TypeBadge } from '../components/StatusBadge.jsx'
import StandingsTable from '../components/StandingsTable.jsx'
import CupBracket from '../components/CupBracket.jsx'
import {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  TOURNAMENT_TYPES,
  usesStandingsTable,
} from '../domain/constants.js'
import { computeStandings } from '../domain/series.js'
import { getCupChampion } from '../domain/cup.js'
import { RANKING_OPTIONS, normalizeRanking, rankingLabel } from '../domain/seeding.js'
import {
  canGenerateNextSwissRound,
  currentSwissRound,
  defaultSwissRoundCount,
} from '../domain/swiss.js'

export default function TournamentDetailPage() {
  const { id } = useParams()
  const {
    tournaments,
    currentUser,
    joinTournament,
    addGuestParticipant,
    removeParticipant,
    setParticipantRanking,
    closeRegistration,
    reopenRegistration,
    generateMatches,
    generateNextRound,
    setMatchResult,
    canManageTournament,
  } = useApp()

  const tournament = tournaments.find((t) => t.id === id)
  const [guestName, setGuestName] = useState('')
  const [scoreDrafts, setScoreDrafts] = useState({})
  const [message, setMessage] = useState('')

  const participantById = useMemo(() => {
    if (!tournament) return {}
    return Object.fromEntries(tournament.participants.map((p) => [p.id, p]))
  }, [tournament])

  const standings = useMemo(() => {
    if (!tournament || !usesStandingsTable(tournament.type)) return []
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

  const isManager = canManageTournament(tournament)
  const registrationOpen = tournament.status === TOURNAMENT_STATUSES.REGISTRATION
  const canEditRoster =
    tournament.status === TOURNAMENT_STATUSES.REGISTRATION ||
    tournament.status === TOURNAMENT_STATUSES.DRAFT
  const alreadyJoined = tournament.participants.some((p) => p.userId === currentUser?.id)
  const canJoin = registrationOpen && currentUser && !alreadyJoined
  const canGenerate = isManager && canEditRoster && tournament.participants.length >= 2
  const showTable = usesStandingsTable(tournament.type) && tournament.matches.length > 0
  const isCup = tournament.type === TOURNAMENT_TYPES.CUP
  const isSwiss = tournament.type === TOURNAMENT_TYPES.SWISS
  const champion = isCup ? getCupChampion(tournament.matches, tournament.participants) : null
  const swissTotal =
    tournament.swissRounds ?? defaultSwissRoundCount(tournament.participants.length)
  const canNextSwiss = isManager && canGenerateNextSwissRound(tournament)

  function flash(text) {
    setMessage(text)
  }

  function handleJoin() {
    const result = joinTournament(tournament.id)
    flash(result.ok ? 'Du er påmeldt!' : result.error)
  }

  function handleAddGuest(event) {
    event.preventDefault()
    const result = addGuestParticipant(tournament.id, guestName)
    if (!result.ok) {
      flash(result.error)
      return
    }
    setGuestName('')
    flash('Deltaker lagt til.')
  }

  function handleGenerate() {
    const result = generateMatches(tournament.id)
    flash(
      result.ok
        ? isSwiss
          ? 'Swiss runde 1 generert (sterk vs svak).'
          : 'Kamper generert.'
        : result.error,
    )
  }

  function handleNextRound() {
    const result = generateNextRound(tournament.id)
    flash(result.ok ? 'Neste Swiss-runde generert.' : result.error)
  }

  function handleRankingChange(participantId, value) {
    const result = setParticipantRanking(tournament.id, participantId, value)
    if (!result.ok) flash(result.error)
  }

  function handleSaveScore(match) {
    const draft = scoreDrafts[match.id] ?? {
      home: match.homeScore ?? '',
      away: match.awayScore ?? '',
    }
    const result = setMatchResult(tournament.id, match.id, draft.home, draft.away)
    flash(result.ok ? 'Resultat lagret.' : result.error)
  }

  const playableMatches = tournament.matches.filter(
    (m) => !m.isBye && m.homeParticipantId && m.awayParticipantId,
  )

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
            {tournament.maxParticipants && (
              <span className="muted">Maks {tournament.maxParticipants} deltakere</span>
            )}
            {isSwiss && (
              <span className="muted">
                Swiss {currentSwissRound(tournament.matches) || 0}/{swissTotal} runder
              </span>
            )}
          </div>
        </div>
      </div>

      {champion && (
        <div className="callout callout-win">
          <strong>Vinner:</strong> {champion.name}
        </div>
      )}

      {canEditRoster && (
        <div className="callout">
          <strong>Ranking:</strong> 3 = sterk, 1 = svak. I Swiss/cup møtes sterke lag ikke hverandre
          i starten (sterk vs svak).
        </div>
      )}

      {message && <p className="toast">{message}</p>}

      <div className="detail-grid">
        <section className="panel">
          <h2>Påmelding & deltakere</h2>

          {canJoin && (
            <button type="button" className="btn btn-primary" onClick={handleJoin}>
              Meld meg på
            </button>
          )}
          {alreadyJoined && <p className="muted">Du er påmeldt.</p>}
          {!registrationOpen && canEditRoster && (
            <p className="muted">Påmelding er stengt.</p>
          )}

          {isManager && canEditRoster && (
            <>
              <form className="inline-form" onSubmit={handleAddGuest}>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Legg til gjest (navn)"
                />
                <button type="submit" className="btn btn-secondary">
                  Legg til
                </button>
              </form>

              <div className="action-row">
                {registrationOpen ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      closeRegistration(tournament.id)
                      flash('Påmelding stengt.')
                    }}
                  >
                    Steng påmelding
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      reopenRegistration(tournament.id)
                      flash('Påmelding åpnet.')
                    }}
                  >
                    Åpne påmelding
                  </button>
                )}
                {canGenerate && (
                  <button type="button" className="btn btn-primary" onClick={handleGenerate}>
                    {isSwiss ? 'Generer runde 1' : 'Generer kamper'}
                  </button>
                )}
              </div>
            </>
          )}

          {isManager && canNextSwiss && (
            <div className="action-row">
              <button type="button" className="btn btn-primary" onClick={handleNextRound}>
                Generer neste Swiss-runde
              </button>
            </div>
          )}

          {tournament.participants.length === 0 ? (
            <p className="muted">Ingen deltakere ennå.</p>
          ) : (
            <ul className="participant-list">
              {tournament.participants.map((p) => (
                <li key={p.id} className="participant-row">
                  <span className="participant-info">
                    #{p.seed} {p.name}
                    {!p.userId && <em className="guest-tag"> gjest</em>}
                    {!canEditRoster && (
                      <em className="rank-tag">
                        {' '}
                        · rank {normalizeRanking(p.ranking)} ({rankingLabel(p.ranking)})
                      </em>
                    )}
                  </span>
                  <span className="participant-actions">
                    {isManager && canEditRoster ? (
                      <label className="rank-select">
                        <span className="sr-only">Ranking for {p.name}</span>
                        <select
                          value={normalizeRanking(p.ranking)}
                          onChange={(e) => handleRankingChange(p.id, e.target.value)}
                        >
                          {RANKING_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {isManager && canEditRoster && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => removeParticipant(tournament.id, p.id)}
                      >
                        Fjern
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {showTable && (
          <section
            className={`panel ${
              tournament.type === TOURNAMENT_TYPES.LEAGUE || isSwiss ? 'panel-highlight' : ''
            }`}
          >
            <h2>
              {tournament.type === TOURNAMENT_TYPES.LEAGUE || isSwiss
                ? 'Tabell (hovedvisning)'
                : 'Tabell'}
            </h2>
            <StandingsTable standings={standings} participants={tournament.participants} />
          </section>
        )}

        {isCup && tournament.matches.length > 0 && (
          <section className="panel panel-wide">
            <h2>Bracket</h2>
            <CupBracket matches={tournament.matches} participantById={participantById} />
          </section>
        )}

        {tournament.matches.length > 0 && (
          <section className="panel panel-wide">
            <h2>Kamper & resultater</h2>
            {!isManager && (
              <p className="muted">Kun arrangør/eier kan registrere resultater i denne MVP-en.</p>
            )}
            {matchesByRound.map(([round, matches]) => {
              const label = matches[0]?.roundName ?? `Runde ${round}`
              const visible = matches.filter(
                (m) => playableMatches.some((p) => p.id === m.id) || m.isBye,
              )
              if (!visible.length) return null
              return (
                <div key={round} className="round-block">
                  <h3>{label}</h3>
                  <ul className="match-list">
                    {visible.map((match) => {
                      if (match.isBye) {
                        const winner =
                          participantById[match.homeParticipantId || match.awayParticipantId]
                            ?.name ?? '?'
                        return (
                          <li key={match.id} className="match-row is-done">
                            <span className="match-teams">{winner} — bye</span>
                          </li>
                        )
                      }

                      const home = participantById[match.homeParticipantId]?.name ?? 'TBD'
                      const away = participantById[match.awayParticipantId]?.name ?? 'TBD'
                      const ready = match.homeParticipantId && match.awayParticipantId
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
                          {isManager && ready ? (
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
                          ) : (
                            <span className="muted">
                              {done
                                ? `${match.homeScore} — ${match.awayScore}`
                                : ready
                                  ? 'Venter'
                                  : 'TBD'}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </section>
  )
}
