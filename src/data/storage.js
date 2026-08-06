const STORAGE_KEY = 'kjell-games-turnering-v1'

const defaultState = () => ({
  users: [
    {
      id: 'user-admin',
      name: 'Kjell',
      email: 'kjell@kjellgames.no',
      password: 'demo',
      role: 'admin',
    },
    {
      id: 'user-org',
      name: 'Arrangør Anna',
      email: 'anna@kjellgames.no',
      password: 'demo',
      role: 'organizer',
    },
  ],
  currentUserId: null,
  tournaments: [],
})

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return {
      ...defaultState(),
      ...parsed,
      users: parsed.users?.length ? parsed.users : defaultState().users,
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state) {
  const toPersist = {
    users: state.users,
    currentUserId: state.currentUserId,
    tournaments: state.tournaments,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist))
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}
