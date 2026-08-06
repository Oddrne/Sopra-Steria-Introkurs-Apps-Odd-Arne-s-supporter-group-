/**
 * Seeding-rammeverk: ranking 1 | 2 | 3
 * 3 = best, 1 = dårligst. Brukes til Swiss runde 1 og cup-bracket.
 */

export const RANKING = {
  WEAK: 1,
  MID: 2,
  STRONG: 3,
}

export const RANKING_OPTIONS = [
  { value: 3, label: '3 — Sterk' },
  { value: 2, label: '2 — Middels' },
  { value: 1, label: '1 — Svak' },
]

export const DEFAULT_RANKING = RANKING.MID

export function normalizeRanking(value) {
  const n = Number(value)
  if (n === 1 || n === 2 || n === 3) return n
  return DEFAULT_RANKING
}

/** Sterkest først (3 → 1), deretter seed/navn. */
export function sortByRankingDesc(participants) {
  return [...participants].sort((a, b) => {
    const r = normalizeRanking(b.ranking) - normalizeRanking(a.ranking)
    if (r !== 0) return r
    if ((a.seed ?? 0) !== (b.seed ?? 0)) return (a.seed ?? 0) - (b.seed ?? 0)
    return a.name.localeCompare(b.name, 'nb')
  })
}

/**
 * Par høy vs lav ranking (sterk vs svak), så toppene ikke møtes tidlig.
 * Returnerer [[homeId, awayId], ...] og evt. byeId.
 */
export function pairHighVsLow(participants) {
  const ordered = sortByRankingDesc(participants)
  const ids = ordered.map((p) => p.id)
  let byeId = null

  if (ids.length % 2 === 1) {
    // Bye til lavest ranking (sist i lista)
    byeId = ids.pop()
  }

  const pairs = []
  let left = 0
  let right = ids.length - 1
  while (left < right) {
    pairs.push([ids[left], ids[right]])
    left += 1
    right -= 1
  }

  return { pairs, byeId }
}

export function rankingLabel(ranking) {
  const r = normalizeRanking(ranking)
  if (r === 3) return 'Sterk'
  if (r === 1) return 'Svak'
  return 'Middels'
}
