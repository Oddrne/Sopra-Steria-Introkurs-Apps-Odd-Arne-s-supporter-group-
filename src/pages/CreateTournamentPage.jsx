import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { TOURNAMENT_TYPES } from '../domain/constants.js'
import { generateTournamentName } from '../domain/nameGenerator.js'

const TYPE_OPTIONS = [
  TOURNAMENT_TYPES.ROUND_ROBIN,
  TOURNAMENT_TYPES.CUP,
  TOURNAMENT_TYPES.SWISS,
]

export default function CreateTournamentPage() {
  const { createTournament } = useApp()
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [type, setType] = useState(TOURNAMENT_TYPES.ROUND_ROBIN)
  const [name, setName] = useState(() =>
    generateTournamentName(TOURNAMENT_TYPES.ROUND_ROBIN, locale),
  )
  const [nameIsAuto, setNameIsAuto] = useState(true)
  const [maxParticipants, setMaxParticipants] = useState('')
  const [swissRounds, setSwissRounds] = useState('')
  const [error, setError] = useState('')

  function handleTypeChange(nextType) {
    setType(nextType)
    if (nameIsAuto) {
      setName(generateTournamentName(nextType, locale))
    }
  }

  function handleGenerateName() {
    setName(generateTournamentName(type, locale))
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
      setError(t(result.error))
      return
    }
    navigate(`/tournaments/${result.tournament.id}`)
  }

  return (
    <section className="page narrow">
      <h1>{t('create.title')}</h1>
      <p className="muted">{t('create.intro')}</p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          {t('create.name')}
          <div className="name-field">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameIsAuto(false)
              }}
              placeholder={t('create.namePlaceholder')}
              required
            />
            <button type="button" className="btn btn-secondary" onClick={handleGenerateName}>
              {t('create.generateName')}
            </button>
          </div>
        </label>

        <label>
          {t('create.maxParticipants')}
          <input
            type="number"
            min="2"
            step="1"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            placeholder={t('create.maxUnlimited')}
          />
        </label>

        <fieldset className="type-picker">
          <legend>{t('create.format')}</legend>
          {TYPE_OPTIONS.map((value) => (
            <label key={value} className="type-option">
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => handleTypeChange(value)}
              />
              <span>
                <strong>{t(`type.${value}`)}</strong>
                <small>{t(`create.type.${value}`)}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {type === TOURNAMENT_TYPES.SWISS && (
          <label>
            {t('create.swissRounds')}
            <input
              type="number"
              min="1"
              step="1"
              value={swissRounds}
              onChange={(e) => setSwissRounds(e.target.value)}
              placeholder={t('create.swissRoundsPlaceholder')}
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary">
          {t('create.submit')}
        </button>
      </form>
    </section>
  )
}
