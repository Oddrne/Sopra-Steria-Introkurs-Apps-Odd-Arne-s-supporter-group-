import { useEffect, useMemo, useState } from 'react'
import { MATCH_STATUSES } from '../domain/constants.js'
import { rankWordKey, roundsWithMeta } from '../domain/swissView.js'
import { useI18n } from '../i18n/I18nContext.jsx'

function pairingCopy(pairing, t) {
  if (pairing.kind === 'bye') {
    return { label: t('swiss.pairing.bye'), detail: t('swiss.pairing.byeDetail') }
  }
  if (pairing.kind === 'seed') {
    return {
      label: t('swiss.pairing.seed', { hr: pairing.hr, ar: pairing.ar }),
      detail: t('swiss.pairing.seedDetail', {
        home: t(rankWordKey(pairing.hr)),
        away: t(rankWordKey(pairing.ar)),
      }),
    }
  }
  if (pairing.kind === 'same') {
    return {
      label: t('swiss.pairing.same', { hp: pairing.hp, ap: pairing.ap }),
      detail: t('swiss.pairing.sameDetail'),
    }
  }
  if (pairing.kind === 'rematch') {
    return {
      label: t('swiss.pairing.rematch', { hp: pairing.hp, ap: pairing.ap }),
      detail: t('swiss.pairing.rematchDetail'),
    }
  }
  return {
    label: t('swiss.pairing.adjacent', { hp: pairing.hp, ap: pairing.ap }),
    detail: t('swiss.pairing.adjacentDetail'),
  }
}

export default function SwissBoard({ tournament, participantById }) {
  const { t } = useI18n()
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
    return <p className="muted">{t('swiss.empty')}</p>
  }

  return (
    <div className="swiss-board">
      <div className="swiss-board-intro">
        <p>{t('swiss.intro')}</p>
      </div>

      <div className="swiss-round-tabs" role="tablist" aria-label="Swiss">
        {rounds.map((r) => (
          <button
            key={r.round}
            type="button"
            role="tab"
            aria-selected={r.round === selected?.round}
            className={`swiss-tab ${r.round === selected?.round ? 'is-active' : ''}`}
            onClick={() => setActiveRound(r.round)}
          >
            {t('swiss.round', { n: r.round })}
          </button>
        ))}
      </div>

      {selected && (
        <div className="swiss-round-panel">
          <h3 className="swiss-panel-title">
            {selected.mode === 'ranking' ? t('swiss.groupsRanking') : t('swiss.groupsPoints')}
          </h3>
          <p className="swiss-panel-hint muted">
            {selected.mode === 'ranking' ? t('swiss.hintRanking') : t('swiss.hintPoints')}
          </p>

          <div className="swiss-groups">
            {selected.groups.map((group) => (
              <div key={group.key} className="swiss-group">
                <header className="swiss-group-header">
                  <span className="swiss-group-label">
                    {group.points != null
                      ? t('swiss.pts', { n: group.points })
                      : t('swiss.rankGroup', {
                          rank: group.ranking,
                          label: t(rankWordKey(group.ranking)),
                        })}
                  </span>
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

          <h3 className="swiss-panel-title">{t('swiss.pairings')}</h3>
          <ul className="swiss-pairings">
            {selected.matches.map(({ match, pairing }) => {
              const copy = pairingCopy(pairing, t)
              if (match.isBye) {
                const name =
                  participantById[match.homeParticipantId || match.awayParticipantId]?.name ?? '?'
                return (
                  <li key={match.id} className="swiss-pairing is-bye">
                    <div className="swiss-pairing-main">
                      <span className="swiss-pairing-teams">
                        {name} — {t('detail.bye')}
                      </span>
                      <span className={`swiss-pairing-tag kind-${pairing.kind}`}>{copy.label}</span>
                    </div>
                    <p className="swiss-pairing-detail muted">{copy.detail}</p>
                  </li>
                )
              }

              const home = participantById[match.homeParticipantId]?.name ?? t('detail.tbd')
              const away = participantById[match.awayParticipantId]?.name ?? t('detail.tbd')
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
                    <span className={`swiss-pairing-tag kind-${pairing.kind}`}>{copy.label}</span>
                  </div>
                  <p className="swiss-pairing-detail muted">{copy.detail}</p>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
