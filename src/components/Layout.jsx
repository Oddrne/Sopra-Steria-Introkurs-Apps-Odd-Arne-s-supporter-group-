import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import LanguageToggle from './LanguageToggle.jsx'

export default function Layout() {
  const { currentUser, logout } = useApp()
  const { t } = useI18n()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">KG</span>
          <span className="brand-text">
            <strong>Kjell Games</strong>
            <em>{t('brand.tagline')}</em>
          </span>
        </NavLink>

        <nav className="nav">
          {currentUser ? (
            <>
              <NavLink to="/tournaments">{t('nav.tournaments')}</NavLink>
              <NavLink to="/tournaments/new">{t('nav.newTournament')}</NavLink>
              <span className="nav-user">{currentUser.name}</span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <NavLink to="/login">{t('nav.login')}</NavLink>
          )}
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p className="footer-copy">{t('footer.copy')}</p>
        <div className="footer-controls">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </footer>
    </div>
  )
}
