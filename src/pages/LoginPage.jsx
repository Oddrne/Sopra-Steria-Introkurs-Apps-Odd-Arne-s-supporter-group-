import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function LoginPage() {
  const { currentUser, login, register } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('kjell@kjellgames.no')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (currentUser) return <Navigate to="/tournaments" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result =
        mode === 'login'
          ? await login(email, password)
          : await register(name, email, password)

      if (!result.ok) {
        setError(t(result.error))
        return
      }
      navigate('/tournaments')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-panel">
      <h1>{mode === 'login' ? t('login.title') : t('login.registerTitle')}</h1>
      <p className="muted">{t('login.demo')}</p>

      <form className="form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            {t('login.displayName')}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
        )}
        <label>
          {t('login.email')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          {t('login.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy
            ? t('login.wait')
            : mode === 'login'
              ? t('login.submit')
              : t('login.createAccount')}
        </button>
      </form>

      <p className="switch-mode">
        {mode === 'login' ? (
          <>
            {t('login.newHere')}{' '}
            <button type="button" className="linkish" onClick={() => setMode('register')}>
              {t('login.register')}
            </button>
          </>
        ) : (
          <>
            {t('login.hasAccount')}{' '}
            <button type="button" className="linkish" onClick={() => setMode('login')}>
              {t('login.submit')}
            </button>
          </>
        )}
      </p>

      <p>
        <Link to="/">{t('login.toHome')}</Link>
      </p>
    </section>
  )
}
