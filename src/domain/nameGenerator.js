import { TOURNAMENT_TYPES } from './constants.js'

const PACKS = {
  nb: {
    adjectives: [
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
    ],
    themes: [
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
    ],
    cup: ['Cupen', 'Finalen', 'Knockouten', 'Troféet', 'Dysten'],
    series: ['Serien', 'Runden', 'Turneringen', 'Clashen', 'Showdown'],
    swiss: ['Swiss', 'Swiss-helgen', 'Swiss-dysten', 'Swiss-runden'],
    roundRobinLabel: 'Alle-mot-alle',
  },
  en: {
    adjectives: [
      'Epic',
      'Golden',
      'Wild',
      'Legendary',
      'Fast',
      'Tough',
      'Proud',
      'Blazing',
      'Cosmic',
      'Ultimate',
    ],
    themes: [
      'Friday',
      'Saturday',
      'Office',
      'Cafe',
      'Evening',
      'Weekend',
      'Lunch',
      'Night',
      'Summer',
      'Winter',
    ],
    cup: ['Cup', 'Finals', 'Knockout', 'Trophy', 'Clash'],
    series: ['Series', 'Round', 'Tournament', 'Clash', 'Showdown'],
    swiss: ['Swiss', 'Swiss Weekend', 'Swiss Clash', 'Swiss Round'],
    roundRobinLabel: 'Round-robin',
  },
  fr: {
    adjectives: [
      'Épique',
      'Dorée',
      'Sauvage',
      'Légendaire',
      'Rapide',
      'Solide',
      'Fière',
      'Brûlante',
      'Cosmique',
      'Ultime',
    ],
    themes: [
      'Vendredi',
      'Samedi',
      'Bureau',
      'Café',
      'Soirée',
      'Week-end',
      'Déjeuner',
      'Nuit',
      'Été',
      'Hiver',
    ],
    cup: ['Coupe', 'Finale', 'Knockout', 'Trophée', 'Duel'],
    series: ['Série', 'Tour', 'Tournoi', 'Clash', 'Showdown'],
    swiss: ['Swiss', 'Week-end Swiss', 'Duel Swiss', 'Tour Swiss'],
    roundRobinLabel: 'Toutes-rondes',
  },
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function yearSuffix() {
  return String(new Date().getFullYear())
}

/**
 * Genererer et tilfeldig turneringsnavn basert på format og språk.
 */
export function generateTournamentName(type = TOURNAMENT_TYPES.ROUND_ROBIN, locale = 'nb') {
  const pack = PACKS[locale] ?? PACKS.nb
  const adj = pick(pack.adjectives)
  const theme = pick(pack.themes)
  const year = yearSuffix()

  if (type === TOURNAMENT_TYPES.CUP) {
    return pick([
      `${theme} ${pick(pack.cup)} ${year}`,
      `${adj} ${theme} ${pick(pack.cup)}`,
      `Kjell Games ${pick(pack.cup)} ${year}`,
      `${adj} ${pick(pack.cup)}`,
    ])
  }

  if (type === TOURNAMENT_TYPES.SWISS) {
    return pick([
      `${theme} ${pick(pack.swiss)} ${year}`,
      `${adj} ${pick(pack.swiss)}`,
      `Kjell Games Swiss ${year}`,
      `${theme} Swiss Open`,
    ])
  }

  return pick([
    `${theme} ${pick(pack.series)} ${year}`,
    `${adj} ${theme} ${pick(pack.series)}`,
    `Kjell Games ${pack.roundRobinLabel} ${year}`,
    `${adj} ${pick(pack.series)}`,
  ])
}
