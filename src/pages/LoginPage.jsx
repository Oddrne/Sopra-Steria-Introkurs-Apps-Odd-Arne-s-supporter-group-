import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function LoginPage() {
  const { currentUser, login, register } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('kjell@kjellgames.no')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState('')

  if (currentUser) return <Navigate to="/tournaments" replace />

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const result =
      mode === 'login'
        ? login(email, password)
        : register(name, email, password)

    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/tournaments')
  }

  return (
    <section className="auth-panel">
      <h1>{mode === 'login' ? 'Logg inn' : 'Registrer deg'}</h1>
      <p className="muted">
        Demo-brukere: <code>kjell@kjellgames.no</code> / <code>demo</code> (admin) eller{' '}
        <code>anna@kjellgames.no</code> / <code>demo</code>.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            Navn
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
        )}
        <label>
          E-post
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Passord
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary">
          {mode === 'login' ? 'Logg inn' : 'Opprett konto'}
        </button>
      </form>

      <p className="switch-mode">
        {mode === 'login' ? (
          <>
            Ny her?{' '}
            <button type="button" className="linkish" onClick={() => setMode('register')}>
              Registrer deg
            </button>
          </>
        ) : (
          <>
            Har konto?{' '}
            <button type="button" className="linkish" onClick={() => setMode('login')}>
              Logg inn
            </button>
          </>
        )}
      </p>

      <p>
        <Link to="/">Til forsiden</Link>
      </p>
    </section>
  )
}
