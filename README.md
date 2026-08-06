# Sopra-Steria-Introkurs-Apps-Odd-Arne-s-supporter-group-

Hobby-MVP for **Kjell Games AS**: opprett turneringer (alle-mot-alle, cup, Swiss), påmelding, generer kamper, registrer resultater, se tabell/bracket.

## Kom i gang

```bash
npm install
npm run dev
```

Åpne http://localhost:5173/

### Demo-brukere (passord: `demo`)

| E-post | Rolle |
|--------|--------|
| kjell@kjellgames.no | admin |
| anna@kjellgames.no | arrangør |
| per@example.com | spiller |

## Akseptanseflyt (demo)

1. Registrer / logg inn
2. Opprett turnering (alle tre typer i UI)
3. Spillere melder seg på (eller arrangør legger til gjester)
4. Arrangør stenger påmelding (valgfritt) → **Generer kamper**
5. Registrer resultater → tabell (serie) eller bracket (cup) oppdateres
6. Refresh: data ligger i `localStorage`

## Arkitektur i kode

```
Nettlesar → React (Vite) → localStorage (JSON-blob)
```

| Modul | Ansvar |
|-------|--------|
| `domain/seeding.js` | Ranking 1–3 (3 best); høy-vs-lav-paring |
| `domain/series.js` | Alle-mot-alle (serie): generator + tabell 3/1/0 |
| `domain/cup.js` | Single elimination, bye, `nextMatchId` (seedet etter ranking) |
| `domain/swiss.js` | Swiss stage: runde 1 seedet, senere poengbasert |
| `domain/auth.js` | SHA-256 passord-hash (klient) |
| `context/AppContext.jsx` | State, roller, mutasjoner |
| `pages/*` | Skjermbilder |

## Seeding & Swiss

- Hvert lag har **ranking** `1 | 2 | 3` (3 = sterkest). Default: `2`.
- Arrangør kan endre ranking før kampene genereres.
- **Swiss runde 1** og **cup-bracket** bruker sterk-vs-svak, så toppene ikke møtes først.
- Swiss: fullfør runden → **Generer neste Swiss-runde** (unngår rematch når mulig).

## Antakelser (låst for MVP)

- **Persistens:** én JSON-blob i `localStorage` (tilsvarer «én JSON-fil»; overlever refresh, ikke på tvers av nettlesere/enheter).
- **Stack:** Vite + React + JS (ikke Next.js) for rask localhost-demo; `npm run build` → statiske filer (deploy til Netlify/Vercel/GitHub Pages).
- **Alle-mot-alle:** én kamp per par, kampiste + poengtabell (tidligere også kalt «liga»).
- **Cup:** single elimination; uavgjort ikke tillatt; bye ved oddetall; seedet etter ranking.
- **Swiss:** runde-for-runde; ranking styrer runde 1; senere poeng + unngå rematch.
- **Resultater:** kun eier / admin / arrangør registrerer (ikke spiller-self-report).
- **Visning:** krever innlogging (ikke offentlig read-only i denne versjonen).
- **Sikkerhet:** hobby-nivå (hash i klient); ikke produksjonsklar auth.

## Won’t (bevisst utelatt)

Betaling, Swiss, double elimination, websockets, multi-tenant, e-post, GDPR-portal, mobilapp.
