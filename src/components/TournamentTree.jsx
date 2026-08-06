import { useMemo } from 'react'
import { MATCH_STATUSES, TOURNAMENT_TYPES, normalizeTournamentType } from '../domain/constants.js'
import { getMatchWinner } from '../domain/cup.js'
import { useI18n } from '../i18n/I18nContext.jsx'

/**
 * Visuelt kampetre / bracket-graf.
 * Cup: klassisk knockout-tre med koblinger.
 * Serie/Swiss: rundetre som viser hvem som møter hvem.
 */

const COL_W = 200
const ROW_H = 78
const BOX_W = 160
const BOX_H = 56
const PAD_X = 24
const PAD_Y = 36

function nameOf(participantById, id, fallback = 'TBD') {
  if (!id) return fallback
  return participantById[id]?.name ?? fallback
}

function CupTree({ matches, participantById, t }) {
  const layout = useMemo(() => {
    const byRound = new Map()
    for (const m of matches) {
      if (!byRound.has(m.round)) byRound.set(m.round, [])
      byRound.get(m.round).push(m)
    }
    const rounds = [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, list]) => ({
        round,
        label: list[0]?.roundName ?? t('tree.round', { n: round }),
        matches: [...list].sort((a, b) => a.number - b.number),
      }))

    if (!rounds.length) return null

    const firstCount = rounds[0].matches.length
    const positions = new Map()

    rounds.forEach((r, ri) => {
      const count = r.matches.length
      const span = (firstCount * ROW_H) / count
      r.matches.forEach((m, mi) => {
        const x = PAD_X + ri * COL_W
        const y = PAD_Y + mi * span + span / 2 - BOX_H / 2
        positions.set(m.id, { x, y, match: m, roundIndex: ri })
      })
    })

    const width = PAD_X * 2 + (rounds.length - 1) * COL_W + BOX_W
    const height = PAD_Y * 2 + firstCount * ROW_H

    const links = []
    for (const m of matches) {
      if (!m.nextMatchId) continue
      const from = positions.get(m.id)
      const to = positions.get(m.nextMatchId)
      if (!from || !to) continue
      links.push({
        key: `${m.id}-${m.nextMatchId}`,
        x1: from.x + BOX_W,
        y1: from.y + BOX_H / 2,
        x2: to.x,
        y2: to.y + BOX_H / 2,
      })
    }

    return { rounds, positions, links, width, height }
  }, [matches, participantById, t])

  if (!layout) return null

  return (
    <svg
      className="tree-svg"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label="Cup-bracket"
    >
      {layout.rounds.map((r, ri) => (
        <text
          key={`label-${r.round}`}
          x={PAD_X + ri * COL_W + BOX_W / 2}
          y={18}
          textAnchor="middle"
          className="tree-round-label"
        >
          {r.label}
        </text>
      ))}

      {layout.links.map((l) => {
        const midX = (l.x1 + l.x2) / 2
        return (
          <path
            key={l.key}
            d={`M ${l.x1} ${l.y1} H ${midX} V ${l.y2} H ${l.x2}`}
            className="tree-link"
            fill="none"
          />
        )
      })}

      {[...layout.positions.values()].map(({ x, y, match }) => {
        const done = match.status === MATCH_STATUSES.COMPLETED
        const winnerId = getMatchWinner(match)
        const home = nameOf(participantById, match.homeParticipantId)
        const away = nameOf(
          participantById,
          match.awayParticipantId,
          match.isBye ? 'Bye' : 'TBD',
        )
        return (
          <g key={match.id} transform={`translate(${x}, ${y})`} className="tree-node">
            <rect
              width={BOX_W}
              height={BOX_H}
              rx="8"
              className={`tree-box ${done ? 'is-done' : ''} ${match.isBye ? 'is-bye' : ''}`}
            />
            <text x={10} y={22} className={`tree-slot ${winnerId === match.homeParticipantId ? 'is-winner' : ''}`}>
              {truncate(home, 16)}
            </text>
            <text x={BOX_W - 10} y={22} textAnchor="end" className="tree-score">
              {done ? match.homeScore : '–'}
            </text>
            <text x={10} y={44} className={`tree-slot ${winnerId === match.awayParticipantId ? 'is-winner' : ''}`}>
              {truncate(away, 16)}
            </text>
            <text x={BOX_W - 10} y={44} textAnchor="end" className="tree-score">
              {done && !match.isBye ? match.awayScore : match.isBye ? '' : '–'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function RoundTree({ matches, participantById, t }) {
  const layout = useMemo(() => {
    const byRound = new Map()
    for (const m of matches) {
      if (m.isBye) continue
      if (!byRound.has(m.round)) byRound.set(m.round, [])
      byRound.get(m.round).push(m)
    }
    const rounds = [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, list]) => ({
        round,
        label: list[0]?.roundName ?? t('tree.round', { n: round }),
        matches: [...list].sort((a, b) => a.number - b.number),
      }))

    if (!rounds.length) return null

    const maxInRound = Math.max(...rounds.map((r) => r.matches.length))
    const positions = new Map()

    rounds.forEach((r, ri) => {
      r.matches.forEach((m, mi) => {
        const x = PAD_X + ri * COL_W
        const y = PAD_Y + mi * ROW_H
        positions.set(m.id, { x, y, match: m })
      })
    })

    const width = PAD_X * 2 + Math.max(rounds.length - 1, 0) * COL_W + BOX_W
    const height = PAD_Y * 2 + maxInRound * ROW_H

    return { rounds, positions, width, height }
  }, [matches, t])

  if (!layout) return null

  return (
    <svg
      className="tree-svg"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label="Kampetre per runde"
    >
      {layout.rounds.map((r, ri) => (
        <text
          key={`label-${r.round}`}
          x={PAD_X + ri * COL_W + BOX_W / 2}
          y={18}
          textAnchor="middle"
          className="tree-round-label"
        >
          {r.label}
        </text>
      ))}

      {/* soft connectors between consecutive rounds (visual flow) */}
      {layout.rounds.slice(0, -1).map((r, ri) => {
        const next = layout.rounds[ri + 1]
        const lines = []
        const leftMatches = r.matches
        const rightMatches = next.matches
        const count = Math.min(leftMatches.length, rightMatches.length)
        for (let i = 0; i < count; i += 1) {
          const from = layout.positions.get(leftMatches[i].id)
          const to = layout.positions.get(rightMatches[i].id)
          if (!from || !to) continue
          const x1 = from.x + BOX_W
          const y1 = from.y + BOX_H / 2
          const x2 = to.x
          const y2 = to.y + BOX_H / 2
          const midX = (x1 + x2) / 2
          lines.push(
            <path
              key={`flow-${leftMatches[i].id}-${rightMatches[i].id}`}
              d={`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`}
              className="tree-link tree-link-soft"
              fill="none"
            />,
          )
        }
        return lines
      })}

      {[...layout.positions.values()].map(({ x, y, match }) => {
        const done = match.status === MATCH_STATUSES.COMPLETED
        const winnerId = getMatchWinner(match)
        const home = nameOf(participantById, match.homeParticipantId)
        const away = nameOf(participantById, match.awayParticipantId)
        return (
          <g key={match.id} transform={`translate(${x}, ${y})`} className="tree-node">
            <rect
              width={BOX_W}
              height={BOX_H}
              rx="8"
              className={`tree-box ${done ? 'is-done' : ''}`}
            />
            <text
              x={10}
              y={22}
              className={`tree-slot ${winnerId === match.homeParticipantId ? 'is-winner' : ''}`}
            >
              {truncate(home, 16)}
            </text>
            <text x={BOX_W - 10} y={22} textAnchor="end" className="tree-score">
              {done ? match.homeScore : '–'}
            </text>
            <text
              x={10}
              y={44}
              className={`tree-slot ${winnerId === match.awayParticipantId ? 'is-winner' : ''}`}
            >
              {truncate(away, 16)}
            </text>
            <text x={BOX_W - 10} y={44} textAnchor="end" className="tree-score">
              {done ? match.awayScore : '–'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function truncate(text, max) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export default function TournamentTree({ tournament, participantById }) {
  const { t } = useI18n()

  if (!tournament?.matches?.length) {
    return <p className="muted">{t('tree.empty')}</p>
  }

  const isCup = normalizeTournamentType(tournament.type) === TOURNAMENT_TYPES.CUP

  return (
    <div className="tree-wrap">
      <div className="tree-scroll">
        {isCup ? (
          <CupTree matches={tournament.matches} participantById={participantById} t={t} />
        ) : (
          <RoundTree matches={tournament.matches} participantById={participantById} t={t} />
        )}
      </div>
      <p className="tree-hint muted">
        {isCup ? t('tree.cupHint') : t('tree.roundHint')}
      </p>
    </div>
  )
}
