import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function HomePage() {
  const { currentUser } = useApp()
  const { t } = useI18n()

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>Kjell Games</h1>
        <p className="lede">{t('home.lede')}</p>
        <div className="hero-actions">
          {currentUser ? (
            <>
              <Link className="btn btn-primary" to="/tournaments/new">
                {t('home.create')}
              </Link>
              <Link className="btn btn-secondary" to="/tournaments">
                {t('home.view')}
              </Link>
            </>
          ) : (
            <Link className="btn btn-primary" to="/login">
              {t('home.loginCta')}
            </Link>
          )}
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="court">
          <span className="court-line" />
          <span className="court-circle" />
          <span className="scoreboard">3 — 2</span>
        </div>
      </div>
    </section>
  )
}
