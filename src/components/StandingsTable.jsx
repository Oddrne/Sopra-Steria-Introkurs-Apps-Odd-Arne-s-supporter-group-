export default function StandingsTable({ standings }) {
  if (!standings.length) {
    return <p className="muted">Ingen resultater ennå.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Lag</th>
            <th>K</th>
            <th>S</th>
            <th>U</th>
            <th>T</th>
            <th>+/−</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr key={row.participantId}>
              <td>{index + 1}</td>
              <td>{row.name}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>
                {row.goalsFor - row.goalsAgainst > 0 ? '+' : ''}
                {row.goalsFor - row.goalsAgainst}
              </td>
              <td>
                <strong>{row.points}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
