import { TOURNAMENT_TYPE_LABELS, TOURNAMENT_TYPES } from './constants.js'

const ADJECTIVES = [
  'Episke',
  'Gylne',
  'Ville',
  'Legendariske',
  'Raske',
  'Tøffe',
  'Stolte',
  'Brennhete',
  'Kosmisk',
  'Ultimat',
]

const THEMES = [
  'Fredag',
  'Lørdag',
  'Kontor',
  'Kafé',
  'Kveld',
  'Helg',
  'Lunsj',
  'Natt',
  'Sommer',
  'Vinter',
]

const CUP_NOUNS = ['Cupen', 'Finalen', 'Knockouten', 'Troféet', 'Dysten']
const SERIES_NOUNS = ['Serien', 'Runden', 'Turneringen', 'Clashen', 'Showdown']
const SWISS_NOUNS = ['Swiss', 'Swiss-helgen', 'Swiss-dysten', 'Swiss-runden']

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function yearSuffix() {
  return String(new Date().getFullYear())
}

/**
 * Genererer et tilfeldig turneringsnavn basert på format.
 */
export function generateTournamentName(type = TOURNAMENT_TYPES.ROUND_ROBIN) {
  const adj = pick(ADJECTIVES)
  const theme = pick(THEMES)
  const year = yearSuffix()

  if (type === TOURNAMENT_TYPES.CUP) {
    return pick([
      `${theme}${pick(CUP_NOUNS)} ${year}`,
      `${adj} ${theme}-${pick(CUP_NOUNS).toLowerCase()}`,
      `Kjell Games ${pick(CUP_NOUNS)} ${year}`,
      `${adj} ${pick(CUP_NOUNS)}`,
    ])
  }

  if (type === TOURNAMENT_TYPES.SWISS) {
    return pick([
      `${theme}-${pick(SWISS_NOUNS)} ${year}`,
      `${adj} ${pick(SWISS_NOUNS)}`,
      `Kjell Games Swiss ${year}`,
      `${theme} Swiss Open`,
    ])
  }

  // Alle-mot-alle
  return pick([
    `${theme}${pick(SERIES_NOUNS)} ${year}`,
    `${adj} ${theme}-${pick(SERIES_NOUNS).toLowerCase()}`,
    `Kjell Games ${TOURNAMENT_TYPE_LABELS.round_robin} ${year}`,
    `${adj} ${pick(SERIES_NOUNS)}`,
  ])
}
