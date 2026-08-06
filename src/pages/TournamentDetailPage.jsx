import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge, { TypeBadge } from '../components/StatusBadge.jsx'
import StandingsTable from '../components/StandingsTable.jsx'
import TournamentTree from '../components/TournamentTree.jsx'
import SwissBoard from '../components/SwissBoard.jsx'
import WinnerTrophy from '../components/WinnerTrophy.jsx'
import ResultsExportCard from '../components/ResultsExportCard.jsx'
import {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  TOURNAMENT_TYPES,
  usesStandingsTable,
} from '../domain/constants.js'
import { computeStandings } from '../domain/series.js'
import { normalizeRanking } from '../domain/seeding.js'
import {
  canGenerateNextSwissRound,
  currentSwissRound,
  defaultSwissRoundCount,
} from '../domain/swiss.js'
import { getTournamentWinner } from '../domain/winner.js'
import { exportElementAsPng, slugifyFilename } from '../utils/exportImage.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { rankWordKey } from '../domain/swissView.js'

const RANKING_VALUES = [3, 2, 1]

export default function TournamentDetailPage() {
  const { id } = useParams()
  const { t } = useI18n()
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
    setMatchResults,
    canManageTournament,
  } = useApp()

  const tournament = tournaments.find((t) => t.id === id)
  const [guestName, setGuestName] = useState('')
  const [scoreDrafts, setScoreDrafts] = useState({})
  const [message, setMessage] = useState('')
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef(null)

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
        <h1>{t('detail.notFound')}</h1>
        <Link to="/tournaments">{t('detail.back')}</Link>
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
  const isSwiss = tournament.type === TOURNAMENT_TYPES.SWISS
  const winner = getTournamentWinner(tournament)
  const swissTotal =
    tournament.swissRounds ?? defaultSwissRoundCount(tournament.participants.length)
  const canNextSwiss = isManager && canGenerateNextSwissRound(tournament)
  const playableMatches = tournament.matches.filter(
    (m) => !m.isBye && m.homeParticipantId && m.awayParticipantId,
  )

  function flash(text) {
    setMessage(text)
  }

  function handleJoin() {
    const result = joinTournament(tournament.id)
    flash(result.ok ? t('detail.joinedOk') : t(result.error))
  }

  function handleAddGuest(event) {
    event.preventDefault()
    const result = addGuestParticipant(tournament.id, guestName)
    if (!result.ok) {
      flash(t(result.error))
      return
    }
    setGuestName('')
    flash(t('detail.guestAdded'))
  }

  function handleGenerate() {
    const result = generateMatches(tournament.id)
    flash(
      result.ok
        ? isSwiss
          ? t('detail.swissRound1')
          : t('detail.matchesGenerated')
        : t(result.error),
    )
  }

  function handleNextRound() {
    const result = generateNextRound(tournament.id)
    flash(result.ok ? t('detail.nextSwissOk') : t(result.error))
  }

  function handleRankingChange(participantId, value) {
    const result = setParticipantRanking(tournament.id, participantId, value)
    if (!result.ok) flash(t(result.error))
  }

  function handleSaveScore(match) {
    const draft = scoreDrafts[match.id] ?? {
      home: match.homeScore ?? '',
      away: match.awayScore ?? '',
    }
    const result = setMatchResult(tournament.id, match.id, draft.home, draft.away)
    flash(result.ok ? t('detail.resultSaved') : t(result.error))
  }

  function handleSaveAllScores() {
    const results = playableMatches
      .map((match) => {
        const draft = scoreDrafts[match.id]
        const home = draft?.home ?? match.homeScore
        const away = draft?.away ?? match.awayScore
        if (home === '' || home == null || away === '' || away == null) return null
        return { matchId: match.id, homeScore: home, awayScore: away }
      })
      .filter(Boolean)

    if (!results.length) {
      flash(t('detail.fillScores'))
      return
    }

    const result = setMatchResults(tournament.id, results)
    flash(result.ok ? t('detail.resultsSaved', { count: result.saved }) : t(result.error))
  }

  async function handleExportImage() {
    if (!exportRef.current) return
    setExporting(true)
    try {
      await exportElementAsPng(
        exportRef.current,
        `${slugifyFilename(tournament.name)}-resultat.png`,
      )
      flash(t('detail.exported'))
    } catch (err) {
      flash(err?.message || t('detail.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  const canExport =
    tournament.matches.some((m) => m.status === MATCH_STATUSES.COMPLETED) ||
    tournament.status === TOURNAMENT_STATUSES.FINISHED

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/tournaments">{t('detail.tournaments')}</Link> / {tournament.name}
          </p>
          <h1>{tournament.name}</h1>
          <div className="tournament-meta">
            <TypeBadge type={tournament.type} />
            <StatusBadge status={tournament.status} />
            {tournament.maxParticipants && (
              <span className="muted">
                {t('detail.maxParticipants', { count: tournament.maxParticipants })}
              </span>
            )}
            {isSwiss && (
              <span className="muted">
                {t('detail.swissProgress', {
                  current: currentSwissRound(tournament.matches) || 0,
                  total: swissTotal,
                })}
              </span>
            )}
          </div>
        </div>
        {canExport && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportImage}
            disabled={exporting}
          >
            {exporting ? t('detail.exporting') : t('detail.export')}
          </button>
        )}
      </div>

      {canExport && (
        <div className="export-offscreen" aria-hidden="true">
          <ResultsExportCard
            ref={exportRef}
            tournament={tournament}
            winner={winner}
            standings={standings}
            participantById={participantById}
          />
        </div>
      )}

      {winner && (
        <WinnerTrophy winner={winner} tournamentName={tournament.name} />
      )}

      {canEditRoster && <div className="callout">{t('detail.rankingHint')}</div>}

      {message && <p className="toast">{message}</p>}

      <div className="detail-grid">
        <section className="panel">
          <h2>{t('detail.signup')}</h2>

          {canJoin && (
            <button type="button" className="btn btn-primary" onClick={handleJoin}>
              {t('detail.join')}
            </button>
          )}
          {alreadyJoined && <p className="muted">{t('detail.joined')}</p>}
          {!registrationOpen && canEditRoster && (
            <p className="muted">{t('detail.registrationClosed')}</p>
          )}

          {isManager && canEditRoster && (
            <>
              <form className="inline-form" onSubmit={handleAddGuest}>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t('detail.addGuest')}
                />
                <button type="submit" className="btn btn-secondary">
                  {t('detail.add')}
                </button>
              </form>

              <div className="action-row">
                {registrationOpen ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      closeRegistration(tournament.id)
                      flash(t('detail.registrationClosedOk'))
                    }}
                  >
                    {t('detail.closeRegistration')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      reopenRegistration(tournament.id)
                      flash(t('detail.registrationOpenedOk'))
                    }}
                  >
                    {t('detail.openRegistration')}
                  </button>
                )}
                {canGenerate && (
                  <button type="button" className="btn btn-primary" onClick={handleGenerate}>
                    {isSwiss ? t('detail.generateRound1') : t('detail.generateMatches')}
                  </button>
                )}
              </div>
            </>
          )}

          {isManager && canNextSwiss && (
            <div className="action-row">
              <button type="button" className="btn btn-primary" onClick={handleNextRound}>
                {t('detail.generateNextSwiss')}
              </button>
            </div>
          )}

          {tournament.participants.length === 0 ? (
            <p className="muted">{t('detail.noParticipants')}</p>
          ) : (
            <ul className="participant-list">
              {tournament.participants.map((p) => (
                <li key={p.id} className="participant-row">
                  <span className="participant-info">
                    #{p.seed} {p.name}
                    {!p.userId && <em className="guest-tag"> {t('detail.guest')}</em>}
                    {!canEditRoster && (
                      <em className="rank-tag">
                        {' '}
                        ·{' '}
                        {t('detail.rank', {
                          rank: normalizeRanking(p.ranking),
                          label: t(rankWordKey(normalizeRanking(p.ranking))),
                        })}
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
                          {RANKING_VALUES.map((value) => (
                            <option key={value} value={value}>
                              {t(`rank.option.${value}`)}
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
                        {t('detail.remove')}
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {showTable && (
          <section className="panel panel-highlight">
            <h2>{t('detail.table')}</h2>
            <StandingsTable standings={standings} participants={tournament.participants} />
          </section>
        )}

        {tournament.matches.length > 0 && (
          <section className="panel panel-wide">
            <h2>{isSwiss ? t('detail.swissBoard') : t('detail.tree')}</h2>
            {isSwiss ? (
              <SwissBoard tournament={tournament} participantById={participantById} />
            ) : (
              <TournamentTree tournament={tournament} participantById={participantById} />
            )}
          </section>
        )}

        {tournament.matches.length > 0 && (
          <section className="panel panel-wide">
            <div className="section-header">
              <h2>{t('detail.matches')}</h2>
              {isManager && playableMatches.length > 0 && (
                <button type="button" className="btn btn-primary" onClick={handleSaveAllScores}>
                  {t('detail.saveAll')}
                </button>
              )}
            </div>
            {!isManager && (
              <p className="muted">{t('detail.resultsOrganizerOnly')}</p>
            )}
            {matchesByRound.map(([round, matches]) => {
              const label = matches[0]?.roundName ?? t('tree.round', { n: round })
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
                        const byeWinner =
                          participantById[match.homeParticipantId || match.awayParticipantId]
                            ?.name ?? '?'
                        return (
                          <li key={match.id} className="match-row is-done">
                            <span className="match-teams">
                              {byeWinner} — {t('detail.bye')}
                            </span>
                          </li>
                        )
                      }

                      const home = participantById[match.homeParticipantId]?.name ?? t('detail.tbd')
                      const away = participantById[match.awayParticipantId]?.name ?? t('detail.tbd')
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
                                {done ? t('detail.update') : t('detail.save')}
                              </button>
                            </div>
                          ) : (
                            <span className="muted">
                              {done
                                ? `${match.homeScore} — ${match.awayScore}`
                                : ready
                                  ? t('detail.waiting')
                                  : t('detail.tbd')}
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
