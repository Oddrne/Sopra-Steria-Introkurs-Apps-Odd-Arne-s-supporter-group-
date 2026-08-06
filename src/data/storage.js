import { DEMO_PASSWORD_HASH } from '../domain/auth.js'

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

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Drop v1 (plain passwords) ved oppgradering
      localStorage.removeItem('kjell-games-turnering-v1')
      return defaultState()
    }
    const parsed = JSON.parse(raw)
    const defaults = defaultState()
    return {
      ...defaults,
      ...parsed,
      users: parsed.users?.length ? parsed.users : defaults.users,
      tournaments: parsed.tournaments ?? [],
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
      tournaments: state.tournaments,
    }),
  )
}
