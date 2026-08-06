# Sopra-Steria-Introkurs-Apps-Odd-Arne-s-supporter-group-

Hobby-MVP for **Kjell Games AS**: opprett turneringer (alle-mot-alle, cup, liga), påmelding, generer kamper, registrer resultater, se tabell/bracket.

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
| `domain/series.js` | Alle-mot-alle + liga (samme generator, tabell 3/1/0) |
| `domain/cup.js` | Single elimination, bye, `nextMatchId` |
| `domain/auth.js` | SHA-256 passord-hash (klient) |
| `context/AppContext.jsx` | State, roller, mutasjoner |
| `pages/*` | Skjermbilder (§11) |

## Antakelser (låst for MVP)

- **Persistens:** én JSON-blob i `localStorage` (tilsvarer «én JSON-fil»; overlever refresh, ikke på tvers av nettlesere/enheter).
- **Stack:** Vite + React + JS (ikke Next.js) for rask localhost-demo; `npm run build` → statiske filer (deploy til Netlify/Vercel/GitHub Pages).
- **Serie:** én kamp per par; liga = samme generator, tabell som hovedvisning.
- **Cup:** single elimination; uavgjort ikke tillatt; bye ved oddetall.
- **Resultater:** kun eier / admin / arrangør registrerer (ikke spiller-self-report).
- **Visning:** krever innlogging (ikke offentlig read-only i denne versjonen).
- **Sikkerhet:** hobby-nivå (hash i klient); ikke produksjonsklar auth.

## Won’t (bevisst utelatt)

Betaling, Swiss, double elimination, websockets, multi-tenant, e-post, GDPR-portal, mobilapp.
