# Kivra Partnership Track

*Partnership tracker för officiell Kivra API-access. Produkt bygger **inte** på API tills gate nedan är uppfylld.*

**Relaterade dokument:** [`RECEIPT_AUTOPILOT_NO_KIVRA_PLAN.md`](./RECEIPT_AUTOPILOT_NO_KIVRA_PLAN.md) · [`KIVRA_FORWARD_SPIKE.md`](./KIVRA_FORWARD_SPIKE.md)

---

## Application status

| Fält | Värde |
|------|-------|
| Status | **Applied — no response** |
| Ansökt datum | *(ägare fyller i)* |
| Kanal | *(ägare fyller i — t.ex. partner@kivra.se, webbformulär)* |
| Kontaktperson Kivra | *(okänd)* |
| Referens / ticket-id | *(om finns)* |

---

## What access is needed

| Behov | Detalj |
|-------|--------|
| API scopes | Läsa kvitto-dokument (PDF/metadata) för användare som explicit kopplat Kivra-konto |
| Use case | Receipt ingestion → Skaffu inventory (med user review) |
| Webhooks | Önskvärt: nytt kvitto tillgängligt → pull eller push notification |
| Legal | DPA, användarmedgivande, tydlig “koppla Kivra”-UX efter godkännande |

---

## Why needed vs Resend-forward fallback

| Officiell API | Resend-forward (nuvarande spike) |
|---------------|----------------------------------|
| OAuth + direkt pull | Användaren vidarebefordrar PDF/e-post manuellt |
| Skalbar automation | Beta — kräver Resend inbound + per-hushåll token |
| Kräver partnerskap | Fungerar utan Kivra-samarbete |
| Längre ledtid | Redan kodad, off by default |

**Fallback plan:** [`RECEIPT_AUTOPILOT_NO_KIVRA_PLAN.md`](./RECEIPT_AUTOPILOT_NO_KIVRA_PLAN.md) — manuell PDF-uppladdning med review som primär path; forward som optional beta.

---

## Contact log

| Datum | Kanal | Sammanfattning | Svar / nästa steg |
|-------|-------|----------------|-------------------|
| *(YYYY-MM-DD)* | *(e-post / telefon / LinkedIn)* | *(kort)* | *(väntar / möte bokat / avslag)* |

---

## Next follow-up

| Fält | Värde |
|------|-------|
| Föreslagen follow-up | **+14 dagar** från senaste kontakt |
| Nästa datum | *(ägare sätter)* |
| Ägare | *(ägare)* |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **False marketing** | Trust + juridik om vi lovar integration utan API | Copy reset — se RECEIPT_AUTOPILOT plan |
| **Partnership delay** | Engineering idle waiting | Manual receipt MVP + Resend forward beta |
| **Kivra format changes** | Parse regression | RECEIPT_TEST_PACK + synthetic fixtures |
| **Parsing dependency** | Kvalitet varierar per butik/PDF | Review-steg obligatoriskt i MVP |

---

## Decision gate

**Ingen engineering på officiell Kivra-integration tills alla tre är uppfyllda:**

1. ✅ API access **bekräftad** (dokumenterad i denna fil med datum och scope)
2. ✅ Krav **tydliga** (scopes, data format, legal godkänt)
3. ✅ User value **validerad** via manual receipt import (`receipt_import_started` → `receipt_review_completed` i `/admin`)

Tills dess: endast manuell upload, generisk “digital kvitto”-copy, optional Resend-forward beta.
