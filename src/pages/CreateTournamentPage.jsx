import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  FULLY_SUPPORTED_TYPES,
  TOURNAMENT_TYPE_LABELS,
  TOURNAMENT_TYPES,
} from '../domain/constants.js'

const TYPE_OPTIONS = [
  {
    value: TOURNAMENT_TYPES.ROUND_ROBIN,
    description: 'Alle møter alle én gang. Resultater oppdaterer tabellen. Fullt støttet i MVP.',
  },
  {
    value: TOURNAMENT_TYPES.CUP,
    description: 'Knockout med bracket. Skisse i målarkitekturen — ikke spillbart i denne MVP-en.',
  },
  {
    value: TOURNAMENT_TYPES.LEAGUE,
    description: 'Sesong med flere runder over tid. Skisse — ikke spillbart i denne MVP-en.',
  },
]

export default function CreateTournamentPage() {
  const { createTournament } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState(TOURNAMENT_TYPES.ROUND_ROBIN)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const result = createTournament({ name, type })
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
        Velg navn og format. Alle-mot-alle er det eneste formatet som er fullt spillbart i 2-timers
        MVP-en.
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

        <fieldset className="type-picker">
          <legend>Format</legend>
          {TYPE_OPTIONS.map((option) => {
            const supported = FULLY_SUPPORTED_TYPES.includes(option.value)
            return (
              <label key={option.value} className={`type-option ${supported ? '' : 'is-stub'}`}>
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                />
                <span>
                  <strong>
                    {TOURNAMENT_TYPE_LABELS[option.value]}
                    {!supported && <em className="stub-tag"> skisse</em>}
                  </strong>
                  <small>{option.description}</small>
                </span>
              </label>
            )
          })}
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary">
          Opprett
        </button>
      </form>
    </section>
  )
}
