import { useEffect, useMemo, useState } from 'react'
import { MATCH_STATUSES } from '../domain/constants.js'
import { roundsWithMeta } from '../domain/swissView.js'

/**
 * Swiss-visualisering: poeng-/rankinggrupper + pairing-forklaring.
 */
export default function SwissBoard({ tournament, participantById }) {
  const rounds = useMemo(
    () => roundsWithMeta(tournament.participants, tournament.matches),
    [tournament.participants, tournament.matches],
  )

  const latestRound = rounds[rounds.length - 1]?.round ?? 1
  const [activeRound, setActiveRound] = useState(latestRound)

  useEffect(() => {
    setActiveRound(latestRound)
  }, [latestRound])

  const selected = rounds.find((r) => r.round === activeRound) ?? rounds[rounds.length - 1]

  if (!rounds.length) {
    return <p className="muted">Generer runde 1 for å se Swiss-tavlen.</p>
  }

  return (
    <div className="swiss-board">
      <div className="swiss-board-intro">
        <p>
          Swiss pares etter <strong>like/nære poeng</strong>. Runde 1 er seedet (sterk vs svak).
        </p>
      </div>

      <div className="swiss-round-tabs" role="tablist" aria-label="Swiss-runder">
        {rounds.map((r) => (
          <button
            key={r.round}
            type="button"
            role="tab"
            aria-selected={r.round === selected?.round}
            className={`swiss-tab ${r.round === selected?.round ? 'is-active' : ''}`}
            onClick={() => setActiveRound(r.round)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="swiss-round-panel">
          <h3 className="swiss-panel-title">
            {selected.mode === 'ranking' ? 'Rankinggrupper før pairing' : 'Poenggrupper før pairing'}
          </h3>
          <p className="swiss-panel-hint muted">
            {selected.mode === 'ranking'
              ? 'Runde 1: sterke (3) og svake (1) holdes adskilt — pares kryssvis.'
              : 'Lag med samme poeng samles. Paringer skjer primært inni eller mellom nabogrupper.'}
          </p>

          <div className="swiss-groups">
            {selected.groups.map((group) => (
              <div key={group.key} className="swiss-group">
                <header className="swiss-group-header">
                  <span className="swiss-group-label">{group.label}</span>
                  <span className="swiss-group-count">{group.rows.length}</span>
                </header>
                <ul className="swiss-group-list">
                  {group.rows.map((row) => (
                    <li key={row.participantId}>{row.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h3 className="swiss-panel-title">Paringer denne runden</h3>
          <ul className="swiss-pairings">
            {selected.matches.map(({ match, pairing }) => {
              if (match.isBye) {
                const name =
                  participantById[match.homeParticipantId || match.awayParticipantId]?.name ?? '?'
                return (
                  <li key={match.id} className="swiss-pairing is-bye">
                    <div className="swiss-pairing-main">
                      <span className="swiss-pairing-teams">{name} — bye</span>
                      <span className={`swiss-pairing-tag kind-${pairing.kind}`}>{pairing.label}</span>
                    </div>
                    <p className="swiss-pairing-detail muted">{pairing.detail}</p>
                  </li>
                )
              }

              const home = participantById[match.homeParticipantId]?.name ?? 'TBD'
              const away = participantById[match.awayParticipantId]?.name ?? 'TBD'
              const done = match.status === MATCH_STATUSES.COMPLETED

              return (
                <li key={match.id} className={`swiss-pairing ${done ? 'is-done' : ''}`}>
                  <div className="swiss-pairing-main">
                    <span className="swiss-pairing-teams">
                      {home} <em>vs</em> {away}
                      {done && (
                        <strong className="swiss-pairing-score">
                          {match.homeScore} — {match.awayScore}
                        </strong>
                      )}
                    </span>
                    <span className={`swiss-pairing-tag kind-${pairing.kind}`}>{pairing.label}</span>
                  </div>
                  <p className="swiss-pairing-detail muted">{pairing.detail}</p>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
