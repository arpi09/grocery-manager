# Nästa steg — ägare (30 dagar)

*31 maj 2026. Full roadmap: [ROADMAP.md](./ROADMAP.md). PMF-kriterier: [COMPETITIVE_ANALYSIS.md §13](./COMPETITIVE_ANALYSIS.md#13-mätetal-för-product-market-fit).*

Produkten är **inte klar**. 90-dagarsplanen är levererad i kod; nästa fas handlar om **retention, validering och intäkt** — inte fler Must-features.

---

## 1. Fyll i preliminär dag-90-läsning

Öppna [`DAY_90_DECISION.md`](./DAY_90_DECISION.md) → avsnitt *Preliminär avläsning* och fyll metrics från `/admin` (PMF-mätetal). Detta blir underlag för webb vs Capacitor — även om beslutet formellt tas vid dag 90.

---

## 2. Etablera veckorutin (varje måndag, 30 min)

1. `/admin` → veckosammanfattning och WoW-delta.
2. Notera **en** metric under mål och **en** åtgärd (produkt, copy eller support).
3. Logga kort i valfri anteckning (datum + metric + åtgärd).

**Checklista:** [ROADMAP.md § Veckovis PMF-rutin](./ROADMAP.md#veckovis-pmf-rutin-ägare) — samma steg som dashboard, med länk till Stripe-gates och waitlist.

---

## 3. Genomför minst 3 av 10 intervjuer

Använd [USER_INTERVIEWS.md](./USER_INTERVIEWS.md). Prioritera användare som registrerat men slutat efter vecka 1. Uppdatera syntes med topp-3 churnorsaker.

---

## 4. Launch i minst 1 community

Följ [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md): en post i matsvinn-, förälder- eller meal-prep-grupp med UTM. För launch-logg i playbook.

---

## 5. Lägg till minst 5 riktiga kvitto-PDF lokalt

Enligt [RECEIPT_TEST_PACK.md](./RECEIPT_TEST_PACK.md). Kör `npm run test:receipt-fixtures`. Mål: ≥15/20 innan Fas 1 anses klar på kvitto.

---

## 6. Custom domain (valfritt — ej kopplad än)

Prod kör idag på `https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app`. Framtida `homepantry.com`: [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) (Firebase Console, `PUBLIC_ORIGIN`/`ORIGIN`, Turnstile-hostnames).

---

## 7. Mät e-post utgångspåminnelser

Kontrollera Resend/dashboard: skickade digest, bounces, om opt-in-rate är låg — justera copy i inställningar eller onboarding.

---

## 8. Utvärdera Stripe-readiness

Jämför `/admin` D30 och [PRICING.md §6](./PRICING.md) gates. Om D30 ≥15 % och ≥30 eligible users: planera jurist 1–2 h + Checkout-spike. Annars: **inte** Stripe än.

---

## 9. PWA-installation — en enkel mätning

Fråga 5 aktiva användare (intervju eller feedback): har de lagt till på hemskärm? Om nej: testa förbättrad copy på `/hem`-banner.

---

## 10. Formellt dag-90-beslut

När kohort tillåter: fyll checklista i [DAY_90_DECISION.md](./DAY_90_DECISION.md) §7 och välj väg A (webb+SV), B (Capacitor) eller hybrid. Uppdatera [ROADMAP.md](./ROADMAP.md) Fas 2 därefter.

---

## Vad du **inte** behöver göra nu

- Ny stor feature utan PMF-data.
- App Store / Capacitor utan D30 och kvalitativ motivering.
- Stripe utan gates i PRICING.md.
- Manuell omstart av dev-server (dev-runtime sköter det).

---

*Peeka här varje vecka; detaljer och prioritering i [ROADMAP.md](./ROADMAP.md).*
