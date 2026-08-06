import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { loadState, saveState } from '../data/storage.js'
import {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  TOURNAMENT_TYPES,
  FULLY_SUPPORTED_TYPES,
} from '../domain/constants.js'
import {
  generateRoundRobinMatches,
  isTournamentComplete,
} from '../domain/roundRobin.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  )

  const login = useCallback((email, password) => {
    const user = state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )
    if (!user) return { ok: false, error: 'Feil e-post eller passord' }
    setState((s) => ({ ...s, currentUserId: user.id }))
    return { ok: true }
  }, [state.users])

  const logout = useCallback(() => {
    setState((s) => ({ ...s, currentUserId: null }))
  }, [])

  const register = useCallback((name, email, password) => {
    if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'E-post er allerede i bruk' }
    }
    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'player',
    }
    setState((s) => ({
      ...s,
      users: [...s.users, user],
      currentUserId: user.id,
    }))
    return { ok: true }
  }, [state.users])

  const createTournament = useCallback(({ name, type }) => {
    if (!state.currentUserId) return { ok: false, error: 'Du må være innlogget' }
    const tournament = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      status: TOURNAMENT_STATUSES.DRAFT,
      ownerId: state.currentUserId,
      participants: [],
      matches: [],
      createdAt: new Date().toISOString(),
      stubNote: !FULLY_SUPPORTED_TYPES.includes(type)
        ? 'Dette formatet er skissert i målarkitekturen, men ikke fullt spilt ut i 2-timers MVP.'
        : null,
    }
    setState((s) => ({ ...s, tournaments: [tournament, ...s.tournaments] }))
    return { ok: true, tournament }
  }, [state.currentUserId])

  const updateTournament = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const deleteTournament = useCallback((id) => {
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.filter((t) => t.id !== id),
    }))
  }, [])

  const addParticipant = useCallback((tournamentId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Navn kreves' }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        if (t.status === TOURNAMENT_STATUSES.ACTIVE || t.status === TOURNAMENT_STATUSES.FINISHED) {
          return t
        }
        if (t.participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
          return t
        }
        return {
          ...t,
          status:
            t.status === TOURNAMENT_STATUSES.DRAFT
              ? TOURNAMENT_STATUSES.REGISTRATION
              : t.status,
          participants: [
            ...t.participants,
            { id: crypto.randomUUID(), name: trimmed, seed: t.participants.length + 1 },
          ],
        }
      }),
    }))
    return { ok: true }
  }, [])

  const removeParticipant = useCallback((tournamentId, participantId) => {
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        if (t.status === TOURNAMENT_STATUSES.ACTIVE || t.status === TOURNAMENT_STATUSES.FINISHED) {
          return t
        }
        return {
          ...t,
          participants: t.participants.filter((p) => p.id !== participantId),
        }
      }),
    }))
  }, [])

  const startTournament = useCallback((tournamentId) => {
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        if (t.type !== TOURNAMENT_TYPES.ROUND_ROBIN) {
          return t
        }
        if (t.participants.length < 2) return t

        const matches = generateRoundRobinMatches(t.participants.map((p) => p.id))
        return {
          ...t,
          matches,
          status: TOURNAMENT_STATUSES.ACTIVE,
        }
      }),
    }))
  }, [])

  const setMatchResult = useCallback((tournamentId, matchId, homeScore, awayScore) => {
    const hs = Number(homeScore)
    const as = Number(awayScore)
    if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0) {
      return { ok: false, error: 'Poeng må være hele tall ≥ 0' }
    }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        const matches = t.matches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                homeScore: hs,
                awayScore: as,
                status: MATCH_STATUSES.COMPLETED,
              }
            : m,
        )
        const status = isTournamentComplete(matches)
          ? TOURNAMENT_STATUSES.FINISHED
          : t.status
        return { ...t, matches, status }
      }),
    }))
    return { ok: true }
  }, [])

  const value = {
    users: state.users,
    tournaments: state.tournaments,
    currentUser,
    login,
    logout,
    register,
    createTournament,
    updateTournament,
    deleteTournament,
    addParticipant,
    removeParticipant,
    startTournament,
    setMatchResult,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
