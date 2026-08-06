import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  TOURNAMENT_TYPE_LABELS,
  TOURNAMENT_TYPES,
} from '../domain/constants.js'
import { generateTournamentName } from '../domain/nameGenerator.js'

const TYPE_OPTIONS = [
  {
    value: TOURNAMENT_TYPES.ROUND_ROBIN,
    description:
      'Alle møter alle én gang. Kampiste + poengtabell (3/1/0). Uavgjort tillatt.',
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
  const [type, setType] = useState(TOURNAMENT_TYPES.ROUND_ROBIN)
  const [name, setName] = useState(() => generateTournamentName(TOURNAMENT_TYPES.ROUND_ROBIN))
  const [nameIsAuto, setNameIsAuto] = useState(true)
  const [maxParticipants, setMaxParticipants] = useState('')
  const [swissRounds, setSwissRounds] = useState('')
  const [error, setError] = useState('')

  function handleTypeChange(nextType) {
    setType(nextType)
    if (nameIsAuto) {
      setName(generateTournamentName(nextType))
    }
  }

  function handleGenerateName() {
    setName(generateTournamentName(type))
    setNameIsAuto(true)
  }

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
          <div className="name-field">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameIsAuto(false)
              }}
              placeholder="f.eks. Fredagscupen"
              required
            />
            <button type="button" className="btn btn-secondary" onClick={handleGenerateName}>
              Generer navn
            </button>
          </div>
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
                onChange={() => handleTypeChange(option.value)}
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
