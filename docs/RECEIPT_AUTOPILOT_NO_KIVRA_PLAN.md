# Receipt Autopilot — No-Kivra Strategy Plan

*Version: juni 2026. Strategisk reset: validera receipt-autopilot via befintlig manuell PDF-uppladdning (med review), optional Resend-forward som beta — utan att vänta på Kivra API eller bygga officiell integration.*

**Relaterade dokument:** [`KIVRA_PARTNERSHIP_TRACK.md`](./KIVRA_PARTNERSHIP_TRACK.md) · [`BREAKTHROUGH_GROWTH_OPPORTUNITIES.md`](./BREAKTHROUGH_GROWTH_OPPORTUNITIES.md) · [`KIVRA_FORWARD_SPIKE.md`](./KIVRA_FORWARD_SPIKE.md) · [`RECEIPT_TEST_PACK.md`](./RECEIPT_TEST_PACK.md)

---

## 1. Nuvarande Kivra-beroende

### Vad kräver officiell Kivra API?

**Inget i repot idag använder Kivra API.** Extern ansökan väntar — produkt ska inte blockera på det.

Officiell API skulle senare möjliggöra: OAuth/koppling, automatisk pull av kvitton, webhook från Kivra — **ej planerat i kod**.

### Vad fungerar utan API (shipped)

| Kapabilitet | Var | Status |
|-------------|-----|--------|
| PDF/bild-uppladdning + AI-parse | `/api/receipt/parse`, `ReceiptBulkAddFlow.svelte` | **Prod-ready** — upload → parse → **review** → bulk create |
| Per-rad plats (AI + heuristik) | `receipt-parse.ts`, `resolveReceiptLineLocation` | Shipped |
| Import till lager + purchase patterns | `receipt-import.ts`, `purchase-pattern.ts` | Shipped |
| Receipt autopilot nudge | `ReceiptAutopilotSection.svelte`, `receipt-autopilot-nudge.ts` | Shipped på `/inkop` |
| Kvitto onboarding-väg | Binary activation (kvitto **eller** scan) | Shipped |
| SEO/marketing guide | `/kvitto-pdf-kivra` | Shipped — copy softening pågår |

### Vad är mock/manual/incomplete

| Del | Status | Blocker |
|-----|--------|---------|
| **E-post-forward “Kivra”** | Kod shipped men **off by default** | `KIVRA_FORWARD_ENABLED` |
| Inbound webhook | `/api/inbound/kivra` | Resend inbound domän + `RESEND_WEBHOOK_SECRET` |
| Forward UX | `KivraForwardSettingsPanel.svelte` | Syns endast när flag enabled; djupt i Inställningar |
| Forward import | **Auto-import utan review** | Skiljer från manuell flow — risk + trust issue |
| **Personligt prisminne (B2)** | **Ej byggt** | `receipt_purchase_line` saknar pris |
| Events för experiment | Delvis | `receipt_parsed`, `kivra_forward_received` — plus nya funnel-events |

---

## 2. Fallback MVP (rekommenderad)

**Primär:** **Manuell digital kvitto-import med review** — redan implementerad; lägsta risk, ingen Resend/Kivra-dependency.

**User journey:**

1. Registrera → onboarding erbjuder “Ladda upp digitalt kvitto” (inte “Koppla Kivra”) — telemetry `source=onboarding`
2. **One-tap:** “Importera kvitto” på `/hem` eller `/inkop` → `/scan?mode=receipt&source=one_tap&autopick=1` → filväljare direkt
3. **Android PWA share:** Installera PWA → dela PDF från Kivra/Filer → Skaffu (`share_target` → POST `/scan/share` → review)
4. **Scan hub fallback:** `/scan?mode=receipt` (`source=scan_hub`)
5. Parse → **review rader + plats** → “Godkänn alla” (V1.1) eller rad-för-rad → lager
6. Celebration + optional Android install-nudge (“Dela kvitton direkt från Kivra”)
7. Replenishment på `/inkop` efter import

**Sekundär (beta, ej blocker):** Resend-forward med **samma review-kö** eller tydlig “importerade automatiskt — granska i lager” — inte tyst auto-import till prod-wide utan opt-in.

**Inte MVP:** Officiell Kivra API, prisminne UI, autopilot utan review.

---

## 3. Produktpositionering

| Story | Stranger-pull | Risk | Verdict |
|-------|---------------|------|---------|
| “Koppla Kivra” | Hög intent | **Falskt löfte** utan API | **Förbjudet** |
| “Kivra-kvitto → skafferi” (manual upload) | Medel–hög SV | OK om “ladda upp PDF från Kivra” | **Sekundär copy** |
| **“Digital kvitto → skafferi automatiskt”** | Medel | Ärligt | **Primär messaging** |
| **“Receipt autopilot”** | Medel | Generiskt men säkert | **Primär produktnamn** |
| Personligt prisminne | Medel | Kräver parse+schema | **Fas 2** efter funnel-validering |

Align med [`BREAKTHROUGH_GROWTH_OPPORTUNITIES.md`](./BREAKTHROUGH_GROWTH_OPPORTUNITIES.md) B1: **kvitto-pipeline som moat**, men **hero = autopilot**, Kivra som *exempel-källa* i guider — inte integration-löfte.

**Safest wording (SV):**

- “Ladda upp digitalt kvitto (PDF)”
- “Vidarebefordra kvitto-e-post till din Skaffu-adress”
- “Importera kvitto-PDF”
- “Bygg skafferiet från kvitton istället för att skriva in allt”

**Undvik:** “Koppla Kivra”, “Kivra-integration”, “synkas automatiskt med Kivra” (tills API godkänt).

---

## 4. Teknisk plan

### Fas 0 — Dokumentation

- [`RECEIPT_AUTOPILOT_NO_KIVRA_PLAN.md`](./RECEIPT_AUTOPILOT_NO_KIVRA_PLAN.md) (denna fil)
- [`KIVRA_PARTNERSHIP_TRACK.md`](./KIVRA_PARTNERSHIP_TRACK.md)

### Fas 1 — Validera utan ny infra (bygg nu)

| Task | Detalj |
|------|--------|
| **Events** | `receipt_import_started`, `receipt_uploaded`, `receipt_review_completed` i schema + PMF + `ReceiptBulkAddFlow` |
| **Copy reset** | `settings.receiptForward.*`; generisk digital-kvitto wording; softening marketing |
| **Onboarding prominence** | Primär CTA till receipt mode; `DigitalReceiptGuide` synlig på första kvittoväg |
| **Landing copy A/B/C** | `?receipt_hero=a\|b\|c` experiment hook |

**Befintlig parse-pipeline:** återanvänd — ingen ny parser.

### Fas 2 — Email forward beta (optional)

| Task | Detalj |
|------|--------|
| Resend inbound prod | DNS `inbound.skaffu.com`, webhook secret, enable `KIVRA_FORWARD_ENABLED=true` för beta cohort |
| Review parity | Pending import eller notis istället för tyst auto-import |
| Sender allowlist | Breda till `ica.se`, generiska receipt senders |
| Rename route | `/api/inbound/receipt` alias (keep kivra for compat) |

### Fas 3 — Efter validering (inte nu)

- Prisminne B2: utöka `ReceiptLine` + parse schema + `receipt_purchase_line.price`
- Officiell Kivra API — endast efter [`KIVRA_PARTNERSHIP_TRACK.md`](./KIVRA_PARTNERSHIP_TRACK.md) gate
- Auto-forward utan review at scale

### Felhantering

| Scenario | UX |
|----------|-----|
| PDF ej text (skannad) | Befintlig `receiptPdfScanned` error → fallback foto |
| AI parse fail | Tydlig + “lägg till manuellt” |
| Quota exceeded | Pro CTA / manuell inmatning |
| Forward: fel sender | E-post bounce/log + inställningar-hint |
| Forward: parse fail | Admin error log + user notis om enabled |

### Privacy/security

- Forward: token per hushåll (`0031_household_receipt_forward_token.sql`)
- Radera PDF bytes efter parse (spike krav — verifiera implementation)
- Inga hela e-postbody i DB — endast parsade rader
- Opt-in synlighet för forward-adress

---

## 5. Growth experiment (no-API)

**Hypotes:** Användare vill fylla Skaffu från kvitton även när första versionen = manuell PDF-uppladdning.

| Metric | Event / källa |
|--------|----------------|
| `receipt_import_started` | Ny — öppnar receipt flow |
| `receipt_uploaded` | Ny — fil vald/uploadad |
| `receipt_parsed` | Finns — parse OK |
| `receipt_review_completed` | Ny — bulk create submitted |
| `pantry_items_created` | Finns via inventory create / `receipt_parsed` metadata `itemsAdded` |
| D7 return | `/admin` retention |
| “Vill ha automatisk Kivra” | Valfri: `receipt_autopilot_feedback` med `wants_auto_forward` |

**Success (4 veckor, indikativt):** ≥40% av receipt starters når review_completed; ≥30% av dem har ≥10 varor inom 24h; ≥3 beta-users begär forward/automation.

**Failure:** Parse abandonment >60% → fix parsing/ICA fixtures ([`RECEIPT_TEST_PACK.md`](./RECEIPT_TEST_PACK.md)) före mer features.

---

## 6. Copy experiments (landing/onboarding)

| Variant | Copy (SV) |
|---------|-----------|
| **A** | “Ladda upp ett digitalt kvitto — Skaffu fyller skafferiet” |
| **B** | “Gör kvitton till skafferi automatiskt” |
| **C** | “Bygg skafferiet från kvitton istället för att skriva in allt” |

Kör via `?receipt_hero=a|b|c` på landning — **ingen Kivra-löfte**.

---

## 7. Decision rule

**Ingen mer engineering på officiell Kivra-integration tills:**

1. API access bekräftad (dokumenterad i [`KIVRA_PARTNERSHIP_TRACK.md`](./KIVRA_PARTNERSHIP_TRACK.md))
2. Krav tydliga (scopes, data format, legal)
3. User value validerad via manual receipt import (events + activation i `/admin`)

---

## 8. Return summary

### Rekommenderad MVP

Manuell digital kvitto-import med review-steg — redan shipped. Primär activation path i onboarding.

### Bygg nu / bygg inte

| Bygg nu | Bygg inte nu |
|---------|----------------|
| Events + copy reset + onboarding prominence | Kivra OAuth/API |
| RECEIPT_AUTOPILOT + PARTNERSHIP docs | Prisminne UI (B2) |
| Optional: forward beta med review parity | Mer karta / admin dashboards |
| ICA PDF fixture expansion (P2) | “Connect Kivra” marketing |

### Safest wording

“Ladda upp digitalt kvitto (PDF)”, “Receipt autopilot”, “Vidarebefordra kvitto-e-post” — Kivra endast som exempel i guider.

### Events (instrumentering)

`receipt_import_started` → `receipt_uploaded` → `receipt_parsed` → `receipt_review_completed`

### Top risks

1. **Over-promise Kivra** — mitigera med copy reset
2. **Parse quality** — mitigera RECEIPT_TEST_PACK
3. **Forward auto-import utan review** — mitigera review parity
4. **AI cost** — free tier limits + tydlig fallback
5. **Validerar retention men inte stranger-install** — receipt MVP är activation; breakthrough B3/B1 combo fortfarande separat

### Nästa 3 tasks

1. Mät funnel i `/admin` i 4 veckor — conversion started → review_completed
2. Optional: enable forward beta med review parity för utvalda hushåll
3. Expand ICA/Kivra PDF fixtures om parse abandonment >60%
