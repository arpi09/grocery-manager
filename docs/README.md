# Dokumentation (publik)

Filer i `docs/` är avsedda för produkt, deploy och utveckling i det publika repot.

**Intern styrning ligger inte här.** Koordinatorinstruktioner, agentkartor, säkerhetsrapporter och engineering intelligence finns i gitignorerad mappen [`private/`](../private/) (lokal kopia — committas aldrig). Se [`ONBOARDING_DEVELOPER.md`](./ONBOARDING_DEVELOPER.md) för ny utvecklare; vid Cursor-kontobyte: `private/CURSOR_MIGRATION.md` lokalt.

## Cursor & AI-koordinator

| Dokument | Innehåll |
|----------|----------|
| [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md) | Coordinator-roll, WIP 3, spawn-proposal, agent-typer, Multitask (publik, svenska) |

Komplettera med `private/NEW_CURSOR_AGENT_START.md` lokalt (miljö, första prompt, kostnad).

## Produkt & strategi

| Dokument | Innehåll |
|----------|----------|
| [ROADMAP.md](./ROADMAP.md) | Master roadmap efter fas 0 |
| [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md) | Fas 0-checklista (arkiv) |
| [NEXT_STEPS.md](./NEXT_STEPS.md) | Ägare, nästa 30 dagar |
| [DAY_90_DECISION.md](./DAY_90_DECISION.md) | Webb vs Capacitor |
| [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) | Marknad & PMF-mätetal |
| [PRICING.md](./PRICING.md) | Free vs Pro |
| [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md) | Community-lansering |
| [USER_INTERVIEWS.md](./USER_INTERVIEWS.md) | Intervjukit |
| [MARKETING_SITE.md](./MARKETING_SITE.md) | Landningssida & A/B |
| [DOMAIN_STRATEGY.md](./DOMAIN_STRATEGY.md) | Domännamn (svensk marknad) |

## Drift & kvalitet

| Dokument | Innehåll |
|----------|----------|
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Testing diamond — unit / integration / E2E, risk, agent-ägarskap |
| [CI_CD.md](./CI_CD.md) | Trunk → GitHub Actions → deploy |
| [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) | App Hosting, secrets, Cloud SQL |
| [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md) | Framtida custom domain (homepantry.com — ej kopplad) |
| [EMAIL.md](./EMAIL.md) | Resend |
| [CAPTCHA.md](./CAPTCHA.md) | Turnstile |
| [E2E.md](./E2E.md) | Playwright |
| [PWA.md](./PWA.md) | Install & service worker |
| [RECEIPT_TEST_PACK.md](./RECEIPT_TEST_PACK.md) | Kvitto-fixtures |

## Design & kod

| Dokument | Innehåll |
|----------|----------|
| [BRAND.md](./BRAND.md) | Ton, färger, UI |
| [I18N.md](./I18N.md) | sv/en |
| [MODAL_CONTRACT.md](./MODAL_CONTRACT.md) | Modal-komponent API |
| [ONBOARDING_DEVELOPER.md](./ONBOARDING_DEVELOPER.md) | Ny utvecklare / Cursor |
| [CLEANUP_LOG.md](./CLEANUP_LOG.md) | Senaste konservativa städningar |
