# Ny utvecklare — Cursor eller Claude Code

Kort guide för att komma igång med **Skaffu** (repo: `home-pantry`). Koordinator-specifika filer ligger i gitignorerad [`private/`](../private/) — se [`docs/README.md`](./README.md). AI-paritet: [`AI_TOOLING.md`](./AI_TOOLING.md).

## Förutsättningar

- [Node.js](https://nodejs.org/) **24+**
- Git + åtkomst till GitHub-repot
- (Valfritt) Docker om du kör PostgreSQL lokalt istället för PGlite

## 1. Klona och installera

```powershell
git clone https://github.com/<din-org>/home-pantry.git
cd home-pantry
npm ci
npm run setup:agent
```

`setup:agent` kopierar `.env.example` → `.env`, sätter PGlite/Turnstile-dev-defaults, kör migrate och synkar `.cursor/` → `.claude/`. Redigera `.env` vid behov — **committa aldrig** `.env`.

Verifiera AI-setup:

```bash
npm run verify:ai-tooling
```

## 2. Databas och dev-server

```bash
npm run dev
```

Auto-restart: `npm run dev:watch`. Hälsa: `npm run dev:health`.

Sibling worktrees (valfritt, Windows): `npm run dev:start:ai` — se [`AI_TOOLING.md`](./AI_TOOLING.md) och [`scripts/dev-runtime/start-dev.ps1`](../scripts/dev-runtime/start-dev.ps1).

Öppna [http://localhost:5173](http://localhost:5173).

## 3. Miljövariabler och integrationer

| Ämne | Dokumentation |
|------|----------------|
| Mall utan hemligheter | [.env.example](../.env.example) |
| E-post (inbjudan) | [EMAIL.md](./EMAIL.md) |
| Registrering CAPTCHA | [CAPTCHA.md](./CAPTCHA.md) |
| Deploy / secrets (prod) | [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) |
| CI/CD (trunk → master) | [CI_CD.md](./CI_CD.md) |

Lokal utveckling använder ofta `USE_PGLITE=true` (inbyggd databas). Produktion använder Cloud SQL — se Firebase-guiden.

## 4. AI-agenter och regler

| Verktyg | Entry | Regler / agenter |
|---------|-------|------------------|
| **Cursor** | Öppna repo som workspace | `.cursor/rules/`, `.cursor/agents/` |
| **Claude Code** | `claude` i reporoten | `CLAUDE.md`, `.claude/agents/`, `.claude/skills/` |

Efter `setup:agent` ska `npm run verify:ai-tooling` vara grön.

**User Rules** (kontonivå): [`docs/templates/AI_USER_RULES_SNIPPET.md`](templates/AI_USER_RULES_SNIPPET.md) — klistra in i Cursor eller Claude user prefs.

## 5. Kvalitet innan push

```powershell
npm run quick:dev
```

Före merge till `master`: `npm run pr:gate` (CI **`pr-gate / pr-gate`**).

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
