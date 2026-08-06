import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { loadState, saveState } from '../data/storage.js'
import { hashPassword, verifyPassword } from '../domain/auth.js'
import {
  MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  TOURNAMENT_TYPES,
  USER_ROLES,
  canManageTournament,
  isSeriesType,
} from '../domain/constants.js'
import {
  advanceWinner,
  applyAutoAdvances,
  generateCupBracket,
  isCupComplete,
} from '../domain/cup.js'
import {
  generateSeriesMatches,
  isSeriesComplete,
} from '../domain/series.js'
import { DEFAULT_RANKING, normalizeRanking, sortByRankingDesc } from '../domain/seeding.js'
import {
  canGenerateNextSwissRound,
  defaultSwissRoundCount,
  generateNextSwissRound,
  generateSwissRoundOne,
  isSwissComplete,
} from '../domain/swiss.js'

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

  const login = useCallback(async (email, password) => {
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return { ok: false, error: 'Feil e-post eller passord' }
    }
    setState((s) => ({ ...s, currentUserId: user.id }))
    return { ok: true }
  }, [state.users])

  const logout = useCallback(() => {
    setState((s) => ({ ...s, currentUserId: null }))
  }, [])

  const register = useCallback(async (name, email, password) => {
    if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'E-post er allerede i bruk' }
    }
    if (!name.trim() || password.length < 3) {
      return { ok: false, error: 'Navn og passord (min. 3 tegn) kreves' }
    }
    const passwordHash = await hashPassword(password)
    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: USER_ROLES.PLAYER,
    }
    setState((s) => ({
      ...s,
      users: [...s.users, user],
      currentUserId: user.id,
    }))
    return { ok: true }
  }, [state.users])

  const createTournament = useCallback(({ name, type, maxParticipants, swissRounds }) => {
    if (!state.currentUserId) return { ok: false, error: 'Du må være innlogget' }
    const max = maxParticipants ? Number(maxParticipants) : null
    if (max != null && (!Number.isInteger(max) || max < 2)) {
      return { ok: false, error: 'Maks deltakere må være et heltall ≥ 2' }
    }
    let rounds = null
    if (type === TOURNAMENT_TYPES.SWISS) {
      rounds = swissRounds ? Number(swissRounds) : null
      if (rounds != null && (!Number.isInteger(rounds) || rounds < 1)) {
        return { ok: false, error: 'Antall Swiss-runder må være et heltall ≥ 1' }
      }
    }
    const tournament = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      status: TOURNAMENT_STATUSES.REGISTRATION,
      ownerId: state.currentUserId,
      maxParticipants: max,
      swissRounds: rounds,
      participants: [],
      matches: [],
      createdAt: new Date().toISOString(),
    }
    setState((s) => ({ ...s, tournaments: [tournament, ...s.tournaments] }))
    return { ok: true, tournament }
  }, [state.currentUserId])

  const deleteTournament = useCallback((id) => {
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.filter((t) => t.id !== id),
    }))
  }, [])

  const joinTournament = useCallback((tournamentId) => {
    const user = state.users.find((u) => u.id === state.currentUserId)
    if (!user) return { ok: false, error: 'Du må være innlogget' }

    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'Turnering ikke funnet' }
    if (
      tournament.status !== TOURNAMENT_STATUSES.REGISTRATION &&
      tournament.status !== TOURNAMENT_STATUSES.DRAFT
    ) {
      return { ok: false, error: 'Påmelding er stengt' }
    }
    if (tournament.status === TOURNAMENT_STATUSES.DRAFT) {
      return { ok: false, error: 'Påmelding er stengt' }
    }
    if (tournament.participants.some((p) => p.userId === user.id)) {
      return { ok: false, error: 'Du er allerede påmeldt' }
    }
    if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
      return { ok: false, error: 'Turneringen er full' }
    }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        return {
          ...t,
          status: TOURNAMENT_STATUSES.REGISTRATION,
          participants: [
            ...t.participants,
            {
              id: crypto.randomUUID(),
              userId: user.id,
              name: user.name,
              seed: t.participants.length + 1,
              ranking: DEFAULT_RANKING,
              status: 'registered',
            },
          ],
        }
      }),
    }))
    return { ok: true }
  }, [state.currentUserId, state.users, state.tournaments])

  const addGuestParticipant = useCallback((tournamentId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Navn kreves' }

    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'Turnering ikke funnet' }
    if (
      tournament.status === TOURNAMENT_STATUSES.ACTIVE ||
      tournament.status === TOURNAMENT_STATUSES.FINISHED
    ) {
      return { ok: false, error: 'Kan ikke legge til etter start' }
    }
    if (tournament.participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'Navnet er allerede med' }
    }
    if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
      return { ok: false, error: 'Turneringen er full' }
    }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        return {
          ...t,
          participants: [
            ...t.participants,
            {
              id: crypto.randomUUID(),
              userId: null,
              name: trimmed,
              seed: t.participants.length + 1,
              ranking: DEFAULT_RANKING,
              status: 'registered',
            },
          ],
        }
      }),
    }))
    return { ok: true }
  }, [state.tournaments])

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
          participants: t.participants
            .filter((p) => p.id !== participantId)
            .map((p, i) => ({ ...p, seed: i + 1 })),
        }
      }),
    }))
  }, [])

  const setParticipantRanking = useCallback((tournamentId, participantId, ranking) => {
    const normalized = normalizeRanking(ranking)
    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'Turnering ikke funnet' }
    if (
      tournament.status === TOURNAMENT_STATUSES.ACTIVE ||
      tournament.status === TOURNAMENT_STATUSES.FINISHED
    ) {
      return { ok: false, error: 'Ranking kan ikke endres etter at kampene er generert' }
    }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        return {
          ...t,
          participants: t.participants.map((p) =>
            p.id === participantId ? { ...p, ranking: normalized } : p,
          ),
        }
      }),
    }))
    return { ok: true }
  }, [state.tournaments])

  const closeRegistration = useCallback((tournamentId) => {
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        if (t.status !== TOURNAMENT_STATUSES.REGISTRATION && t.status !== TOURNAMENT_STATUSES.DRAFT) {
          return t
        }
        return { ...t, status: TOURNAMENT_STATUSES.DRAFT }
      }),
    }))
  }, [])

  const reopenRegistration = useCallback((tournamentId) => {
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t
        if (t.status !== TOURNAMENT_STATUSES.DRAFT) return t
        return { ...t, status: TOURNAMENT_STATUSES.REGISTRATION }
      }),
    }))
  }, [])

  const generateMatches = useCallback((tournamentId) => {
    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'Turnering ikke funnet' }
    if (tournament.participants.length < 2) {
      return { ok: false, error: 'Minst 2 deltakere kreves' }
    }
    if (
      tournament.status === TOURNAMENT_STATUSES.ACTIVE ||
      tournament.status === TOURNAMENT_STATUSES.FINISHED
    ) {
      return { ok: false, error: 'Kampene er allerede generert' }
    }

    let matches
    let swissRounds = tournament.swissRounds

    if (isSeriesType(tournament.type)) {
      matches = generateSeriesMatches(tournament.participants.map((p) => p.id))
    } else if (tournament.type === TOURNAMENT_TYPES.CUP) {
      const orderedIds = sortByRankingDesc(tournament.participants).map((p) => p.id)
      const generated = generateCupBracket(orderedIds)
      matches = applyAutoAdvances(generated.matches, generated.autoAdvances)
    } else if (tournament.type === TOURNAMENT_TYPES.SWISS) {
      swissRounds = swissRounds ?? defaultSwissRoundCount(tournament.participants.length)
      matches = generateSwissRoundOne(tournament.participants)
    } else {
      return { ok: false, error: 'Ukjent turneringstype' }
    }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              matches,
              swissRounds: t.type === TOURNAMENT_TYPES.SWISS ? swissRounds : t.swissRounds,
              status: TOURNAMENT_STATUSES.ACTIVE,
            }
          : t,
      ),
    }))
    return { ok: true }
  }, [state.tournaments])

  const generateNextRound = useCallback((tournamentId) => {
    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'Turnering ikke funnet' }
    if (tournament.type !== TOURNAMENT_TYPES.SWISS) {
      return { ok: false, error: 'Neste runde gjelder kun Swiss' }
    }
    if (!canGenerateNextSwissRound(tournament)) {
      return {
        ok: false,
        error: 'Fullfør gjeldende runde, eller alle Swiss-runder er allerede generert',
      }
    }

    const nextMatches = generateNextSwissRound(tournament.participants, tournament.matches)
    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, matches: [...t.matches, ...nextMatches] }
          : t,
      ),
    }))
    return { ok: true }
  }, [state.tournaments])

  const setMatchResult = useCallback((tournamentId, matchId, homeScore, awayScore) => {
    const hs = Number(homeScore)
    const as = Number(awayScore)
    if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0) {
      return { ok: false, error: 'Poeng må være hele tall ≥ 0' }
    }

    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'Turnering ikke funnet' }
    const match = tournament.matches.find((m) => m.id === matchId)
    if (!match) return { ok: false, error: 'Kamp ikke funnet' }
    if (tournament.type === TOURNAMENT_TYPES.CUP && hs === as) {
      return { ok: false, error: 'Cup krever en vinner — uavgjort er ikke tillatt' }
    }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t

        let matches = t.matches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                homeScore: hs,
                awayScore: as,
                status: MATCH_STATUSES.COMPLETED,
                isBye: false,
              }
            : m,
        )

        if (t.type === TOURNAMENT_TYPES.CUP) {
          const updated = matches.find((m) => m.id === matchId)
          matches = advanceWinner(matches, updated)
        }

        const updatedTournament = { ...t, matches }
        let status = t.status
        if (isSeriesType(t.type) && isSeriesComplete(matches)) {
          status = TOURNAMENT_STATUSES.FINISHED
        }
        if (t.type === TOURNAMENT_TYPES.CUP && isCupComplete(matches)) {
          status = TOURNAMENT_STATUSES.FINISHED
        }
        if (t.type === TOURNAMENT_TYPES.SWISS && isSwissComplete(updatedTournament)) {
          status = TOURNAMENT_STATUSES.FINISHED
        }

        return { ...t, matches, status }
      }),
    }))
    return { ok: true }
  }, [state.tournaments])

  const value = {
    users: state.users,
    tournaments: state.tournaments,
    currentUser,
    login,
    logout,
    register,
    createTournament,
    deleteTournament,
    joinTournament,
    addGuestParticipant,
    removeParticipant,
    setParticipantRanking,
    closeRegistration,
    reopenRegistration,
    generateMatches,
    generateNextRound,
    setMatchResult,
    canManageTournament: (tournament) => canManageTournament(tournament, currentUser),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
