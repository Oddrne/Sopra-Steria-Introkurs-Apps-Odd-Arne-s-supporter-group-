# Kjell Games — Turneringswebapp (MVP)

Hobby-MVP for Kjell Games AS. Opprett turneringer, legg til deltakere, generer kamper og registrer resultater.

## Stack (2-timers leveranse)

- **React + JavaScript** (Vite)
- **Persistens:** `localStorage` (ingen backend i MVP)
- **Auth:** enkel lokal innlogging (demo-brukere)
- **Format:** alle-mot-alle fullt spillbart; cup og liga som skisser

## Kom i gang

```bash
npm install
npm run dev
```

Åpne URL-en Vite viser (vanligvis http://localhost:5173).

### Demo-brukere

| E-post | Passord | Rolle |
|--------|---------|-------|
| kjell@kjellgames.no | demo | admin |
| anna@kjellgames.no | demo | organizer |

## Flyt

1. Logg inn
2. Opprett turnering (velg **Alle-mot-alle**)
3. Legg til minst 2 deltakere
4. Start turnering → kamper genereres
5. Registrer resultater → tabellen oppdateres

## Mappestruktur

```
src/
  components/     # Layout, auth-guard, badges
  context/        # App-state + actions
  data/           # localStorage
  domain/         # Konstanter + round-robin-logikk
  pages/          # Ruter/sider
  App.jsx
  main.jsx
  styles.css
```

## Målarkitektur (ikke i denne MVP-en)

Nettlesar → webapp → API/DB → hosting, med brukere, rollebasert tilgang, og full støtte for cup + liga.
