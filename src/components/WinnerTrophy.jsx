import { useId } from 'react'

/**
 * Pokal / vinnerbanner for avsluttet turnering.
 */
export default function WinnerTrophy({ winner, tournamentName }) {
  const uid = useId().replace(/:/g, '')
  if (!winner) return null

  const goldId = `trophyGold-${uid}`
  const shineId = `trophyShine-${uid}`

  return (
    <section className="winner-banner" aria-live="polite">
      <div className="winner-banner-glow" aria-hidden="true" />
      <div className="trophy" aria-hidden="true">
        <svg viewBox="0 0 120 140" className="trophy-svg">
          <defs>
            <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe566" />
              <stop offset="45%" stopColor="#f0c42e" />
              <stop offset="100%" stopColor="#c9971a" />
            </linearGradient>
            <linearGradient id={shineId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff8c8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f0c42e" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M28 38 C8 38 8 72 28 72"
            fill="none"
            stroke={`url(#${goldId})`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M92 38 C112 38 112 72 92 72"
            fill="none"
            stroke={`url(#${goldId})`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path d="M30 28 H90 L82 78 Q60 92 38 78 Z" fill={`url(#${goldId})`} />
          <path d="M36 32 H78 L72 70 Q60 78 44 70 Z" fill={`url(#${shineId})`} />
          <rect x="52" y="88" width="16" height="18" rx="2" fill={`url(#${goldId})`} />
          <rect x="38" y="106" width="44" height="10" rx="3" fill={`url(#${goldId})`} />
          <rect x="30" y="116" width="60" height="12" rx="4" fill="#c9971a" />
          <polygon
            points="60,40 63,48 72,48 65,53 68,62 60,56 52,62 55,53 48,48 57,48"
            fill="#fff6c2"
          />
        </svg>
      </div>
      <div className="winner-copy">
        <p className="winner-eyebrow">Turneringsvinner</p>
        <h2 className="winner-name">{winner.name}</h2>
        <p className="winner-sub">
          {tournamentName}
          {winner.points != null ? ` · ${winner.points} poeng` : ''}
        </p>
      </div>
    </section>
  )
}
