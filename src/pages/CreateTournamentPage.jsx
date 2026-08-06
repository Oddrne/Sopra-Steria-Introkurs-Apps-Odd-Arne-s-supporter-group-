import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  TOURNAMENT_TYPE_LABELS,
  TOURNAMENT_TYPES,
} from '../domain/constants.js'

const TYPE_OPTIONS = [
  {
    value: TOURNAMENT_TYPES.ROUND_ROBIN,
    description: 'Alle møter alle én gang. Kampiste + tabell. Uavgjort tillatt.',
  },
  {
    value: TOURNAMENT_TYPES.LEAGUE,
    description: 'Samme kampgenerering som alle-mot-alle; hovedvisning er poengtabell (3/1/0).',
  },
  {
    value: TOURNAMENT_TYPES.CUP,
    description: 'Single elimination. Bracket seedes etter ranking (sterk vs svak tidlig).',
  },
  {
    value: TOURNAMENT_TYPES.SWISS,
    description:
      'Swiss stage: runde 1 seedes (sterk vs svak). Senere runder parer lag med lignende poeng.',
  },
]

export default function CreateTournamentPage() {
  const { createTournament } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState(TOURNAMENT_TYPES.ROUND_ROBIN)
  const [maxParticipants, setMaxParticipants] = useState('')
  const [swissRounds, setSwissRounds] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const result = createTournament({
      name,
      type,
      maxParticipants: maxParticipants || null,
      swissRounds: type === TOURNAMENT_TYPES.SWISS ? swissRounds || null : null,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(`/tournaments/${result.tournament.id}`)
  }

  return (
    <section className="page narrow">
      <h1>Ny turnering</h1>
      <p className="muted">
        Velg navn, format og eventuelt maks deltakere. Ranking (1–3) settes på lagene før start.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Navn
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="f.eks. Fredagscupen"
            required
          />
        </label>

        <label>
          Maks deltakere (valgfritt)
          <input
            type="number"
            min="2"
            step="1"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            placeholder="Ubegrenset"
          />
        </label>

        <fieldset className="type-picker">
          <legend>Format</legend>
          {TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="type-option">
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
              />
              <span>
                <strong>{TOURNAMENT_TYPE_LABELS[option.value]}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {type === TOURNAMENT_TYPES.SWISS && (
          <label>
            Antall Swiss-runder (valgfritt)
            <input
              type="number"
              min="1"
              step="1"
              value={swissRounds}
              onChange={(e) => setSwissRounds(e.target.value)}
              placeholder="Auto (≈ log₂ av antall lag, minst 3)"
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary">
          Opprett
        </button>
      </form>
    </section>
  )
}
