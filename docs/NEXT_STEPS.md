# Nästa steg — produkt & ägare (kort)

*8 jun 2026. Fas: pantry sync (Fas 1–8) på master — väntar deploy till prod. Nästa: mjuk beta (5–15 hushåll).*

**Prod:** [https://skaffu.com](https://skaffu.com) — SHA släpar master tills deploy går igenom.

---

## Vad som är klart nu

- **Pantry sync (Fas 1–8):** slut/undo, skafferistatus på `/hem`, inköp→skafferi-bridge, `/inventory/synk`, swipe, planer-avvisa, visuell audit — på master, ej i prod än.
- Kärnflöden (scan, inköp, recept, inställningar, onboarding) gröna i test.
- Säkerhetsluckor HIGH åtgärdade — se [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

---

## Produkt (vänta tills beta givit signal)

**Inte nu:** nya stora features (Fas 5b batch-bridge, toast-unify-epic, stor `/hem`-redesign), Stripe live ([PRICING.md](./PRICING.md)), community-launch ([LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md)).

**Pågår (spike):** Capacitor + App Store-förberedelse — se [APP_STORE.md](./APP_STORE.md). TestFlight/Play internal före publik listing; PWA förblir parallell kanal ([PWA.md](./PWA.md)).

**Efter deploy + beta:** prioritera utifrån friktion i feedback — se [ROADMAP.md](./ROADMAP.md).

---

## Ägare (nu)

1. **Deploy + prod-röktest** — `/hem`, swipe, synk, inköp-bridge innan beta.
2. **Mjuk beta** — LinkedIn + 5–15 personliga DM: [BETA_LAUNCH_SOFT.md](./BETA_LAUNCH_SOFT.md).
3. **Veckorutin** — `/admin` + PMF-cron → en metric under mål + en åtgärd ([PMF_WEEKLY.md](./PMF_WEEKLY.md)).
4. **2 användarintervjuer** under beta-fönstret — [USER_INTERVIEWS.md](./USER_INTERVIEWS.md).

Mer ägarlista: [ROADMAP.md](./ROADMAP.md), [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md).

---

*Peek här varje vecka; teknisk säkerhet: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).*
