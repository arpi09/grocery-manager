# Nästa steg — produkt & ägare (kort)

*4 jun 2026. Senaste leverans: säkerhet/perf-städning + alla flöden gröna i test.*

**Prod:** [https://skaffu.com](https://skaffu.com)

---

## Vad som är klart nu

- Kärnflöden (scan, inköp, recept, inställningar, onboarding) verifierade manuellt.
- Säkerhetsluckor HIGH åtgärdade — se [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

---

## Produkt-roadmap (nästa 2–4 veckor, kod)

Prioritet enligt [UX_COORDINATOR_BACKLOG.md](./UX_COORDINATOR_BACKLOG.md):

| Prio | Epic | Kort beskrivning |
|------|------|------------------|
| **P1** | Toast-unify | En kanonisk toast (`ActionToast` + URL `?toast=`); migrera lokala `Toast` i paneler |
| **P1** | Scan hub v2 / hero | Polish på `/scan` — intro och tydlig photo-first (ej full redesign än) |
| **P1** | Foto AI-plats | `/scan?mode=photo` — inferera kyl/frys/skafferi, slipp tvingande platssteg |
| **P1** | Inventory CTA | Primär «Lägg till varor» + sekundära metoder på lagerplats |
| **P1** | Inköp-magi | Efter smart fill: loader, scroll, firande vid många varor |
| **P2** | Inventory-tabell | Tätare lista, sortering, kolumner |
| **P2** | Nav «Mer» | Bättre desktop-flyout |

**Inte nu:** Stripe (väntar gates i [PRICING.md](./PRICING.md)), App Store/Capacitor, stor ny feature utan PMF-data.

---

## Ägare (parallellt, blockerar inte deploy)

1. **Veckorutin** — `/admin` + PMF-cron → en metric under mål + en åtgärd ([ROADMAP.md](./ROADMAP.md)).
2. **3+ användarintervjuer** — [USER_INTERVIEWS.md](./USER_INTERVIEWS.md).
3. **Launch** i minst en community — [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md).
4. **Kvitto-PDF-fixtures** — fler riktiga kvitton, `npm run test:receipt-fixtures`.
5. **Dag-90-underlag** — fyll [DAY_90_DECISION.md](./DAY_90_DECISION.md) från `/admin`.

Mer ägarlista: [ROADMAP.md](./ROADMAP.md), [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md).

---

*Peek här varje vecka; teknisk säkerhet: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).*
