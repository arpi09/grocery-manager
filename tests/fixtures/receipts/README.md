# Kvitto-PDF testpack

Fixtures för regressionstester av PDF-textextraktion och kvittoparsning.

## Committed (CI)

| Fil | Butik | Syfte |
|-----|-------|-------|
| `synthetic-ica-01.pdf` | ICA | Minimal text-PDF, körs i CI |
| `synthetic-willys-01.pdf` | Willys | Minimal text-PDF, körs i CI |
| `synthetic-kivra-01.pdf` | Kivra | Minimal text-PDF, körs i CI |

Regenerera syntetiska PDF:er:

```bash
node scripts/generate-synthetic-receipt-pdfs.mjs
```

## Lokala riktiga PDF:er (gitignored)

Lägg upp till **20 riktiga kvitton** enligt `manifest.json`:

| Prefix | Antal | Exempel |
|--------|-------|---------|
| `ica-` | 7 | `ica-01.pdf` … `ica-07.pdf` |
| `kivra-` | 7 | `kivra-01.pdf` … `kivra-07.pdf` |
| `willys-` | 6 | `willys-01.pdf` … `willys-06.pdf` |

**Viktigt:** Anonymisera innan du sparar här — se [docs/RECEIPT_TEST_PACK.md](../../../docs/RECEIPT_TEST_PACK.md). PDF:er med personuppgifter ska **aldrig** committas eller delas från din maskin; de stannar lokalt tills du maskerat PII.

Alla `*.pdf` i denna mapp ignoreras av git **utom** `synthetic-*.pdf`. `SOURCES.local.json` (slot → butik/datum, ingen PII) är också gitignored — skapa den lokalt vid behov.

### Ifyllda platser (butik, ingen PII)

| Slot | Butik | Datum | Kanal |
|------|-------|-------|-------|
| `ica-01.pdf` | Maxi ICA Toftanäs | 2026-05-29 | ICA |
| `ica-02.pdf` | Maxi ICA Gunnesbo Lund | 2026-03-25 | ICA (dublettexport) |
| `ica-03.pdf` | Maxi ICA Gunnesbo Lund | 2026-03-25 | ICA |
| `ica-04.pdf` | ICA Supermarket Värnhem | 2026-04-15 | ICA |
| `ica-05.pdf` | Maxi ICA Toftanäs | 2026-04-22 | ICA |
| `ica-06.pdf` | Maxi ICA Toftanäs | 2026-04-26 | ICA |
| `ica-07.pdf` | Maxi ICA Gunnesbo Lund | 2026-04-28 | ICA |
| `kivra-01.pdf` | Maxi ICA Toftanäs | 2026-05-05 | Kivra |
| `kivra-02.pdf` | Maxi ICA Toftanäs | 2026-05-05 | Kivra |
| `kivra-03.pdf` | Maxi ICA Toftanäs | 2026-05-19 | Kivra |
| `kivra-04.pdf` | Maxi ICA Gunnesbo Lund | 2026-05-28 | Kivra |

Saknas fortfarande: `kivra-05` … `kivra-07`, alla `willys-*.pdf`.

## Validera

```bash
node scripts/validate-receipt-fixtures.mjs
node scripts/validate-receipt-fixtures.mjs --strict   # exit 1 om < 20 riktiga PDF:er
```

## Tester

```bash
npm test                                    # syntetiska fixtures, ingen OpenAI
npm test -- src/lib/server/receipt-pdf-fixtures.test.ts
OPENAI_API_KEY=sk-... npm test -- ...       # valfri AI-integration (hoppas över utan nyckel)
```
