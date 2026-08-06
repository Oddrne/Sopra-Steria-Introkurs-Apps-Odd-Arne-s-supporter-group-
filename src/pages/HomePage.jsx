import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function HomePage() {
  const { currentUser } = useApp()

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Kjell Games AS</p>
        <h1>Kjell Games</h1>
        <p className="lede">
          Opprett turneringer, registrer resultater og følg fremdriften — bygget for demo på én
          nettside.
        </p>
        <div className="hero-actions">
          {currentUser ? (
            <>
              <Link className="btn btn-primary" to="/tournaments/new">
                Opprett turnering
              </Link>
              <Link className="btn btn-secondary" to="/tournaments">
                Se turneringer
              </Link>
            </>
          ) : (
            <Link className="btn btn-primary" to="/login">
              Logg inn for å starte
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
