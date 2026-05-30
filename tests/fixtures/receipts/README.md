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

**Viktigt:** Anonymisera innan du sparar här — se [docs/RECEIPT_TEST_PACK.md](../../../docs/RECEIPT_TEST_PACK.md).

Alla `*.pdf` i denna mapp ignoreras av git **utom** `synthetic-*.pdf`.

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
