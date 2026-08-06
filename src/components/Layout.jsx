import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function Layout() {
  const { currentUser, logout } = useApp()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">KG</span>
          <span className="brand-text">
            <strong>Kjell Games</strong>
            <em>Turnering</em>
          </span>
        </NavLink>

        <nav className="nav">
          {currentUser ? (
            <>
              <NavLink to="/tournaments">Turneringer</NavLink>
              <NavLink to="/tournaments/new">Ny turnering</NavLink>
              <span className="nav-user">{currentUser.name}</span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Logg ut
              </button>
            </>
          ) : (
            <NavLink to="/login">Logg inn</NavLink>
          )}
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p className="footer-copy">
          Kjell Games MVP alle-mot-alle, cup og Swiss.
        </p>
        <ThemeToggle />
      </footer>
    </div>
  )
}
