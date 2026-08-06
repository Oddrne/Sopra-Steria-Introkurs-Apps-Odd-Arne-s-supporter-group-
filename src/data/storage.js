import { DEMO_PASSWORD_HASH } from '../domain/auth.js'
import { normalizeTournamentType } from '../domain/constants.js'

const STORAGE_KEY = 'kjell-games-turnering-v2'

const defaultState = () => ({
  users: [
    {
      id: 'user-admin',
      name: 'Kjell',
      email: 'kjell@kjellgames.no',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'admin',
    },
    {
      id: 'user-org',
      name: 'Arrangør Anna',
      email: 'anna@kjellgames.no',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'organizer',
    },
    {
      id: 'user-player',
      name: 'Spiller Per',
      email: 'per@example.com',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'player',
    },
  ],
  currentUserId: null,
  tournaments: [],
})

function migrateTournaments(tournaments) {
  return (tournaments ?? []).map((t) => ({
    ...t,
    type: normalizeTournamentType(t.type),
  }))
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.removeItem('kjell-games-turnering-v1')
      return defaultState()
    }
    const parsed = JSON.parse(raw)
    const defaults = defaultState()
    return {
      ...defaults,
      ...parsed,
      users: parsed.users?.length ? parsed.users : defaults.users,
      tournaments: migrateTournaments(parsed.tournaments),
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      users: state.users,
      currentUserId: state.currentUserId,
      tournaments: migrateTournaments(state.tournaments),
    }),
  )
}
