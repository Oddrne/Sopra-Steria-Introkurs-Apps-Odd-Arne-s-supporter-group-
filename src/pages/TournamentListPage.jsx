import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import StatusBadge, { TypeBadge } from '../components/StatusBadge.jsx'

export default function TournamentListPage() {
  const { tournaments, currentUser, deleteTournament, canManageTournament } = useApp()

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Turneringer</h1>
          <p className="muted">Hei, {currentUser?.name}. Se, meld deg på, eller opprett turneringer.</p>
        </div>
        <Link className="btn btn-primary" to="/tournaments/new">
          Ny turnering
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className="empty-state">
          <p>Ingen turneringer ennå.</p>
          <Link className="btn btn-secondary" to="/tournaments/new">
            Opprett den første
          </Link>
        </div>
      ) : (
        <ul className="tournament-list">
          {tournaments.map((t) => (
            <li key={t.id} className="tournament-row">
              <div className="tournament-row-main">
                <Link to={`/tournaments/${t.id}`} className="tournament-name">
                  {t.name}
                </Link>
                <div className="tournament-meta">
                  <TypeBadge type={t.type} />
                  <StatusBadge status={t.status} />
                  <span className="muted">
                    {t.participants.length} deltakere
                    {t.matches.length ? ` · ${t.matches.length} kamper` : ''}
                  </span>
                </div>
              </div>
              <div className="tournament-row-actions">
                <Link className="btn btn-secondary" to={`/tournaments/${t.id}`}>
                  Åpne
                </Link>
                {canManageTournament(t) && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (window.confirm(`Slette «${t.name}»?`)) deleteTournament(t.id)
                    }}
                  >
                    Slett
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
