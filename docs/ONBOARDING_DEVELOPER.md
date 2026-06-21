# Ny utvecklare / ny Cursor-installation

Kort guide för att komma igång med **Home Pantry**. Koordinator-specifika filer (agentkartor, säkerhetsrapporter, engineering intelligence) ligger i gitignorerad [`private/`](../private/) — se [`docs/README.md`](./README.md). Vid kontobyte: `private/CURSOR_MIGRATION.md` lokalt om du har backup.

## Förutsättningar

- [Node.js](https://nodejs.org/) 20+
- Git + åtkomst till GitHub-repot
- (Valfritt) Docker om du kör PostgreSQL lokalt istället för PGlite

## 1. Klona och installera

```powershell
git clone https://github.com/<din-org>/home-pantry.git
cd home-pantry
npm install
copy .env.example .env
```

Redigera `.env` med dina lokala hemligheter — **committa aldrig** `.env`.

## 2. Databas och dev-server

```powershell
npm run db:migrate
npm run dev:watch
```

Eller AI-worktree (om `home-pantry-dev` finns enligt [scripts/dev-runtime/start-dev.ps1](../scripts/dev-runtime/start-dev.ps1)):

```powershell
npm run dev:start:ai
```

Öppna [http://localhost:5173](http://localhost:5173). Hälsa: `npm run dev:health`.

## 3. Miljövariabler och integrationer

| Ämne | Dokumentation |
|------|----------------|
| Mall utan hemligheter | [.env.example](../.env.example) |
| E-post (inbjudan) | [EMAIL.md](./EMAIL.md) |
| Registrering CAPTCHA | [CAPTCHA.md](./CAPTCHA.md) |
| Deploy / secrets (prod) | [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) |
| CI/CD (trunk → master) | [CI_CD.md](./CI_CD.md) |

Lokal utveckling använder ofta `USE_PGLITE=true` (inbyggd databas). Produktion använder Cloud SQL — se Firebase-guiden.

## 4. Cursor Project Rules

Öppna repot som workspace-mapp. Regler laddas från `.cursor/rules/` (t.ex. dev-server utan manuell omstart, koordinator-trunk). Ingen extra installation krävs om mappen är korrekt öppnad.

**User Rules** (kontonivå) ingår inte i git — vid kontobyte, kopiera från lokal backup `private/CURSOR_USER_RULES_SNIPPET.md` om du har en.

## 5. Kvalitet innan push

```powershell
npm run check
npm test
```

Trunk-flöde: push till `master` triggar GitHub Actions ([CI_CD.md](./CI_CD.md)).

## 6. Cursor-kontobyte / backup

- Publik onboarding: denna fil
- Lokalt backup-skript (inga uploads): `scripts/backup-cursor-setup.ps1`
- Full checklista (lokal, ej i git): `private/CURSOR_MIGRATION.md`

## Mer läsning

- [AGENTS.md](../AGENTS.md) — agent entry + "jag ska fixa X"
- [CODEBASE_MAP.md](./CODEBASE_MAP.md) — feature → routes → filer
- [features/](./features/) — djupdyk per produktyta
- [README.md](../README.md) — funktioner, hushåll, streckkod, AI
- [ARCHITECTURE.md](../ARCHITECTURE.md) — lager och struktur

## 7. Activation onboarding (v7)

State-driven scan-first flow — not a step carousel.

| Layer | Location |
|-------|----------|
| State machine | `src/lib/utils/activation-onboarding-state.ts` |
| Storage + flags | `src/lib/utils/onboarding.ts` (`ONBOARDING_VERSION = 7`) |
| UI shell | `ActivationOnboardingFlow.svelte`, progress checklist, five illustration components |
| Copy | `onboarding.activation.*` in `en.json` / `sv.json` (locked) |
| Server inventory truth | `activeInventoryCount` in `+layout.server.ts` |
| Telemetry | `onboarding_started`, `onboarding_step_viewed`, `onboarding_scan_started`, `onboarding_scan_completed`, `onboarding_inventory_created`, `onboarding_brain_viewed`, `onboarding_shopping_viewed`, `onboarding_completed`, `onboarding_skipped` |

Resume: localStorage flags per user; flow closes on `/scan/*` and reopens at `deriveActivationScreen()` when returning to calm surfaces.
