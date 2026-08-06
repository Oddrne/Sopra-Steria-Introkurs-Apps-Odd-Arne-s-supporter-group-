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
      return { ok: false, error: 'errors.wrongPassword' }
    }
    setState((s) => ({ ...s, currentUserId: user.id }))
    return { ok: true }
  }, [state.users])

  const logout = useCallback(() => {
    setState((s) => ({ ...s, currentUserId: null }))
  }, [])

  const register = useCallback(async (name, email, password) => {
    if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'errors.emailTaken' }
    }
    if (!name.trim() || password.length < 3) {
      return { ok: false, error: 'errors.namePasswordRequired' }
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
    if (!state.currentUserId) return { ok: false, error: 'errors.mustLogin' }
    const max = maxParticipants ? Number(maxParticipants) : null
    if (max != null && (!Number.isInteger(max) || max < 2)) {
      return { ok: false, error: 'errors.maxParticipants' }
    }
    let rounds = null
    if (type === TOURNAMENT_TYPES.SWISS) {
      rounds = swissRounds ? Number(swissRounds) : null
      if (rounds != null && (!Number.isInteger(rounds) || rounds < 1)) {
        return { ok: false, error: 'errors.swissRounds' }
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
    if (!user) return { ok: false, error: 'errors.mustLogin' }

    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'errors.tournamentNotFound' }
    if (
      tournament.status !== TOURNAMENT_STATUSES.REGISTRATION &&
      tournament.status !== TOURNAMENT_STATUSES.DRAFT
    ) {
      return { ok: false, error: 'errors.registrationClosed' }
    }
    if (tournament.status === TOURNAMENT_STATUSES.DRAFT) {
      return { ok: false, error: 'errors.registrationClosed' }
    }
    if (tournament.participants.some((p) => p.userId === user.id)) {
      return { ok: false, error: 'errors.alreadyJoined' }
    }
    if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
      return { ok: false, error: 'errors.tournamentFull' }
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
    if (!trimmed) return { ok: false, error: 'errors.nameRequired' }

    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'errors.tournamentNotFound' }
    if (
      tournament.status === TOURNAMENT_STATUSES.ACTIVE ||
      tournament.status === TOURNAMENT_STATUSES.FINISHED
    ) {
      return { ok: false, error: 'errors.cannotAddAfterStart' }
    }
    if (tournament.participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'errors.nameTaken' }
    }
    if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
      return { ok: false, error: 'errors.tournamentFull' }
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
    if (!tournament) return { ok: false, error: 'errors.tournamentNotFound' }
    if (
      tournament.status === TOURNAMENT_STATUSES.ACTIVE ||
      tournament.status === TOURNAMENT_STATUSES.FINISHED
    ) {
      return { ok: false, error: 'errors.rankingLocked' }
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
    if (!tournament) return { ok: false, error: 'errors.tournamentNotFound' }
    if (tournament.participants.length < 2) {
      return { ok: false, error: 'errors.minParticipants' }
    }
    if (
      tournament.status === TOURNAMENT_STATUSES.ACTIVE ||
      tournament.status === TOURNAMENT_STATUSES.FINISHED
    ) {
      return { ok: false, error: 'errors.matchesAlreadyGenerated' }
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
      return { ok: false, error: 'errors.unknownType' }
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
    if (!tournament) return { ok: false, error: 'errors.tournamentNotFound' }
    if (tournament.type !== TOURNAMENT_TYPES.SWISS) {
      return { ok: false, error: 'errors.nextRoundSwissOnly' }
    }
    if (!canGenerateNextSwissRound(tournament)) {
      return {
        ok: false,
        error: 'errors.nextRoundNotReady',
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

  const setMatchResults = useCallback((tournamentId, results) => {
    const tournament = state.tournaments.find((t) => t.id === tournamentId)
    if (!tournament) return { ok: false, error: 'errors.tournamentNotFound' }
    if (!results.length) return { ok: false, error: 'errors.nothingToSave' }

    const parsed = []
    for (const { matchId, homeScore, awayScore } of results) {
      const hs = Number(homeScore)
      const as = Number(awayScore)
      if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0) {
        return { ok: false, error: 'errors.scoreInvalidAll' }
      }
      const match = tournament.matches.find((m) => m.id === matchId)
      if (!match) return { ok: false, error: 'errors.matchNotFound' }
      if (tournament.type === TOURNAMENT_TYPES.CUP && hs === as) {
        return { ok: false, error: 'errors.cupNoDraw' }
      }
      parsed.push({ matchId, homeScore: hs, awayScore: as })
    }

    setState((s) => ({
      ...s,
      tournaments: s.tournaments.map((t) => {
        if (t.id !== tournamentId) return t

        const byId = Object.fromEntries(parsed.map((r) => [r.matchId, r]))
        let matches = t.matches.map((m) => {
          const result = byId[m.id]
          if (!result) return m
          return {
            ...m,
            homeScore: result.homeScore,
            awayScore: result.awayScore,
            status: MATCH_STATUSES.COMPLETED,
            isBye: false,
          }
        })

        if (t.type === TOURNAMENT_TYPES.CUP) {
          const completed = [...matches]
            .filter((m) => byId[m.id] || m.status === MATCH_STATUSES.COMPLETED)
            .sort((a, b) => a.round - b.round || a.number - b.number)
          for (const match of completed) {
            const current = matches.find((m) => m.id === match.id)
            if (current) matches = advanceWinner(matches, current)
          }
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
    return { ok: true, saved: parsed.length }
  }, [state.tournaments])

  // Keep setMatchResult stable with setMatchResults available
  const setMatchResultWrapped = useCallback(
    (tournamentId, matchId, homeScore, awayScore) =>
      setMatchResults(tournamentId, [{ matchId, homeScore, awayScore }]),
    [setMatchResults],
  )

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
    setMatchResult: setMatchResultWrapped,
    setMatchResults,
    canManageTournament: (tournament) => canManageTournament(tournament, currentUser),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

