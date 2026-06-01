# Nästa steg — ägare (30 dagar)

*1 jun 2026. Full roadmap: [ROADMAP.md](./ROADMAP.md). PMF-kriterier: [COMPETITIVE_ANALYSIS.md §13](./COMPETITIVE_ANALYSIS.md#13-mätetal-för-product-market-fit).*

**Prod:** [https://skaffu.com](https://skaffu.com) (www pekar till apex).

Produkten är **inte klar** och **PMF är inte bevisad**. Fas 0 är i stort sett levererad i kod; **Fas 1** handlar om retention, launch och mätning.

---

## Två spår (parallellt)

| Spår | Vem | Blockerar? |
|------|-----|------------|
| **Ägare** | Intervjuer, veckovis PMF-rutin, launch, riktiga kvitto-PDF, metrics i `/admin` | **Nej** — körs parallellt med kod |
| **Kod** | SEO, valfri push *handla idag*, hero A/B-beslut när data räcker | Stripe och Capacitor **väntar** |

Veckovis PMF-e-post till ägare (cron) underlättar rutinen — ersätter inte granskning i `/admin`.

---

## 1. Fyll i preliminär dag-90-läsning

Öppna [`DAY_90_DECISION.md`](./DAY_90_DECISION.md) → *Preliminär avläsning* och fyll metrics från `/admin`. Underlag för webb vs Capacitor — formellt beslut när kohort tillåter.

---

## 2. Etablera veckorutin (varje måndag, 30 min)

1. `/admin` → veckosammanfattning och WoW-delta (ev. kompletterat av ägar-e-post).
2. Notera **en** metric under mål och **en** åtgärd.
3. Logga kort (datum + metric + åtgärd).

**Checklista:** [ROADMAP.md § Veckovis PMF-rutin](./ROADMAP.md#veckovis-pmf-rutin-ägare).

---

## 3. Genomför minst 3 av 10 intervjuer

[USER_INTERVIEWS.md](./USER_INTERVIEWS.md). Prioritera churn efter vecka 1. Uppdatera syntes — **parallellt**, blockerar inte deploy.

---

## 4. Launch i minst 1 community

[LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md) med UTM mot `skaffu.com`.

---

## 5. Lägg till minst 5 riktiga kvitto-PDF lokalt

[RECEIPT_TEST_PACK.md](./RECEIPT_TEST_PACK.md). `npm run test:receipt-fixtures`. Mål: ≥15/20 — **parallellt** med Fas 1.

---

## 6. Domän — klar

**skaffu.com** är live. Vid ändringar: [`DOMAIN_STRATEGY.md`](./DOMAIN_STRATEGY.md), [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md). `PUBLIC_ORIGIN` / Turnstile-hostnames ska peka på **skaffu.com** (inte `*.hosted.app` som kanonisk prod-URL).

---

## 7. Mät e-post utgångspåminnelser

Resend: digest, bounces, opt-in. `EMAIL_SENDING_ENABLED` ska vara satt för prod om utskick ska gå.

---

## 8. Utvärdera Stripe-readiness

Jämför `/admin` D30 med [PRICING.md §6](./PRICING.md). Om gates **inte** uppfyllda: **inte** Stripe än (medvetet vänteläge).

---

## 9. PWA-installation — en enkel mätning

Fråga 5 aktiva användare: hemskärm? Justera banner-copy på `/hem` vid behov.

---

## 10. Formellt dag-90-beslut

När kohort tillåter: [DAY_90_DECISION.md](./DAY_90_DECISION.md) §7 — väg A/B/hybrid. Uppdatera [ROADMAP.md](./ROADMAP.md) Fas 2.

---

## Vad du **inte** behöver göra nu

- Ny stor feature utan PMF-data.
- App Store / Capacitor utan D30 och kvalitativ motivering.
- Stripe utan gates i PRICING.md.
- Manuell omstart av dev-server (dev-runtime sköter det).
- Byta tillbaka till `*.hosted.app` som primär marknads-URL.

---

## P1 — Secrets readiness (ägare, Firebase App Hosting)

*Uppdaterad 1 jun 2026. Inga hemligheter i git.*

| Secret / env | Krävs för |
|--------------|-----------|
| `PUBLIC_ORIGIN` / `ORIGIN` | **skaffu.com** — CSRF, länkar i mejl |
| `PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Registrering — hostnames **skaffu.com** i Cloudflare |
| `RESEND_*` + `EMAIL_SENDING_ENABLED` | Inbjudan, utgång, PMF-ägar-e-post |
| `CRON_SECRET` | Utgång + PMF-cron |
| `OPENAI_API_KEY` | AI-features |
| VAPID-nycklar | Web push utgång |

**Prioritet:** Turnstile och `PUBLIC_ORIGIN` ska matcha **skaffu.com** efter domänbyte.

Se [EMAIL.md](./EMAIL.md), [CAPTCHA.md](./CAPTCHA.md), [PWA.md](./PWA.md), [VAPID_SETUP.md](./VAPID_SETUP.md).

---

*Peeka här varje vecka; prioritering i [ROADMAP.md](./ROADMAP.md).*
