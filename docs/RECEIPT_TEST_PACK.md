# Kvitto-PDF testpack — insamling och validering

Checklista #10 i [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md): 20 riktiga ICA/Kivra/Willys-PDF för regression av kvittoparsning.

## Vad som finns i repot

| Komponent | Syfte |
|-----------|-------|
| `tests/fixtures/receipts/synthetic-*.pdf` | 3 minimala text-PDF:er — **körs i CI** |
| `tests/fixtures/receipts/manifest.json` | 20 målplatser + metadata |
| `scripts/validate-receipt-fixtures.mjs` | Räknar PDF:er, rapporterar saknade platser |
| `src/lib/server/receipt-pdf-fixtures.test.ts` | Extraktionstest + valfri OpenAI-integration |

Riktiga kvitton **committas inte** — de ligger lokalt i `tests/fixtures/receipts/` och ignoreras av git.

## Mål: 20 PDF:er

| Butik | Antal | Filnamn |
|-------|-------|---------|
| ICA | 7 | `ica-01.pdf` … `ica-07.pdf` |
| Kivra | 7 | `kivra-01.pdf` … `kivra-07.pdf` |
| Willys | 6 | `willys-01.pdf` … `willys-06.pdf` |

Blanda gärna: korta/långa kvitton, många/få rader, olika datumformat.

## Säker insamling (anonymisera)

**Committa aldrig** PDF:er med personuppgifter. Innan du sparar en fil lokalt:

1. **Ta bort eller maskera**
   - Namn, adress, postnummer
   - Kortnummer / betalkortssiffror (ofta delvis synliga)
   - Medlemsnummer, personnummer, telefon
   - Unika transaktions-ID om de kan kopplas till dig
2. **Behåll** produktrader, priser, butiksnamn, datum (valfritt år/månad räcker).
3. **Källa**
   - **ICA:** spara kvitto från ICA-appen eller e-post som PDF
   - **Kivra:** exportera/spara digitalt kvitto som PDF från Kivra
   - **Willys:** Willys-app eller kvitto-PDF från butik
4. **Redigera vid behov:** öppna PDF i Preview/Acrobat och sudda PII, eller skriv ut → skanna om du måste (behåll textlager om möjligt).

Om du bara har skannade bild-PDF:er utan textlager fungerar de fortfarande som manuella fall, men CI-testerna fokuserar på **text-PDF** (`extractPdfText`). Bildkvitton testas via befintlig bild-API-väg.

## Lägg till filer lokalt

```bash
# Kopiera anonymiserade PDF:er till fixtures-mappen
cp ~/Downloads/anonymized-ica.pdf tests/fixtures/receipts/ica-01.pdf
# … upprepa för alla 20 platser enligt manifest.json
```

## Validera

```bash
# Rapport (exit 0 även om < 20 riktiga PDF:er)
node scripts/validate-receipt-fixtures.mjs

# Kräv alla 20 riktiga platser fyllda
node scripts/validate-receipt-fixtures.mjs --strict
```

## Köra tester

### CI (GitHub Actions / `npm test`)

- Kör **endast** `synthetic-*.pdf` (3 st)
- `extractPdfText` måste returnera `ok: true` med tillräckligt textinnehåll
- Schema-regression i `receipt-parse.test.ts` (ingen OpenAI)
- **Ingen** `OPENAI_API_KEY` krävs

### Lokalt med riktiga PDF:er

När du lagt till `ica-*.pdf` m.fl. körs de också i samma testsuite (alla PDF:er i mappen som matchar manifest + synthetic).

```bash
npm test -- src/lib/server/receipt-pdf-fixtures.test.ts
```

### Valfri OpenAI-integration

Hoppar över automatiskt om `OPENAI_API_KEY` saknas:

```bash
# PowerShell
$env:OPENAI_API_KEY = "sk-..."
npm test -- src/lib/server/receipt-pdf-fixtures.test.ts
```

Testar `parseReceiptFromText` på extraherad text och verifierar att svaret har giltig `lines`-struktur.

## Regenerera syntetiska CI-PDF:er

```bash
node scripts/generate-synthetic-receipt-pdfs.mjs
git add tests/fixtures/receipts/synthetic-*.pdf
```

## Felsökning

| Problem | Åtgärd |
|---------|--------|
| `too_short` vid extraktion | PDF saknar textlager — prova annat kvitto eller OCR-PDF |
| AI returnerar tom `lines` | Kvittoinnehåll icke-mat — justera förväntan i manifest `notes` |
| `--strict` failar | Fyll saknade platser i manifest.json |

## Prod-checklista (Firebase App Hosting)

E2E **mockar** `/api/receipt/parse` och sätter `E2E_MOCK_AI=true` — prod kör hela kedjan (PDF → text → OpenAI). Symtom och åtgärder:

| Symtom i UI | Trolig orsak | Åtgärd |
|-------------|--------------|--------|
| «AI-tjänsten är inte tillgänglig just nu» | `OPENAI_API_KEY` saknas eller backend saknar `grantaccess` | `powershell -File scripts/setup-openai-secret.ps1` eller [FIREBASE_DEPLOY.md § Secrets](./FIREBASE_DEPLOY.md#5-secrets-and-environment) |
| «Du har använt alla {n} kvitto-PDF…» | Gratis-gräns (5/mån) | Vänta till nästa månad eller testa med annan användare |
| «PDF:en verkar vara en skanning utan läsbar text» | Bild-PDF utan textlager | Screenshot eller fota kvittot |
| «Kunde inte läsa PDF:en» | `pdf-parse` krasch (sällsynt) | Kolla Cloud Run-loggar `[receipt] pdf-parse failed` |
| «Inga varor hittades på kvittot» | OpenAI svarade men inga matrader | Annan PDF/vinkel; kör lokalt med nyckel (nedan) |
| Generiskt nätverksfel | Icke-JSON-svar (t.ex. 413 body limit) | PDF &lt; 1 MB i prod (`BODY_SIZE_LIMIT`); större filer → bild |

**Verifiera secret (läser inte värdet):**

```bash
npx firebase apphosting:secrets:describe OPENAI_API_KEY --project home-pantry-4bee5
```

**Lokal reproduktion (samma kod som prod):**

```powershell
$env:OPENAI_API_KEY = "sk-..."   # från .env
npm test -- src/lib/server/receipt-pdf-fixtures.test.ts
```

Alla `ica-*.pdf` / `kivra-*.pdf` lokalt ska ge `extractPdfText ok: true` och OpenAI-integration `returns valid lines structure`.
