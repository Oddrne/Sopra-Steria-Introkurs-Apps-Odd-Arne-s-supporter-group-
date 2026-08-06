import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import StatusBadge, { TypeBadge } from '../components/StatusBadge.jsx'

export default function TournamentListPage() {
  const { tournaments, currentUser, deleteTournament, canManageTournament } = useApp()
  const { t } = useI18n()

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>{t('list.title')}</h1>
          <p className="muted">{t('list.hello', { name: currentUser?.name })}</p>
        </div>
        <Link className="btn btn-primary" to="/tournaments/new">
          {t('list.new')}
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className="empty-state">
          <p>{t('list.empty')}</p>
          <Link className="btn btn-secondary" to="/tournaments/new">
            {t('list.createFirst')}
          </Link>
        </div>
      ) : (
        <ul className="tournament-list">
          {tournaments.map((tourney) => (
            <li key={tourney.id} className="tournament-row">
              <div className="tournament-row-main">
                <Link to={`/tournaments/${tourney.id}`} className="tournament-name">
                  {tourney.name}
                </Link>
                <div className="tournament-meta">
                  <TypeBadge type={tourney.type} />
                  <StatusBadge status={tourney.status} />
                  <span className="muted">
                    {t('list.participants', { count: tourney.participants.length })}
                    {tourney.matches.length
                      ? ` · ${t('list.matches', { count: tourney.matches.length })}`
                      : ''}
                  </span>
                </div>
              </div>
              <div className="tournament-row-actions">
                <Link className="btn btn-secondary" to={`/tournaments/${tourney.id}`}>
                  {t('list.open')}
                </Link>
                {canManageTournament(tourney) && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (window.confirm(t('list.deleteConfirm', { name: tourney.name }))) {
                        deleteTournament(tourney.id)
                      }
                    }}
                  >
                    {t('list.delete')}
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
