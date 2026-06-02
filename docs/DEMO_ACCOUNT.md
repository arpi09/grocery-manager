# Demokonto för försäljning

Dedikerat konto och hushåll med realistisk svensk data för demo, video och kundmöten.

## Inloggning

| Fält | Värde |
|------|--------|
| E-post | `DEMO_ACCOUNT_EMAIL` (standard: `demo@skaffu.com`) |
| Lösenord | `DEMO_ACCOUNT_PASSWORD` (miljövariabel — **committas aldrig**) |
| URL | `/login` på samma origin som appen (t.ex. `https://skaffu.com/login`) |

Turnstile gäller fortfarande vid **registrering**; inloggning på demo-kontot kräver inget CAPTCHA-bypass. För lokal utveckling kan `TURNSTILE_SKIP=true` användas enligt `docs/CAPTCHA.md`.

När du är inloggad som demo-användare (`is_demo = true`) visas en **Demo**-banner högst upp i appen.

## Seed-kommando

Idempotent — säker att köra om före varje demo:

```bash
npm run seed:demo
```

Kräver:

- `DEMO_ACCOUNT_PASSWORD` i `.env` (lokalt) eller Firebase App Hosting secret (prod)
- `USE_PGLITE=true` **eller** `DATABASE_URL` mot Postgres/Cloud SQL

Skriptet:

1. Skapar/uppdaterar demo-användaren (`is_demo`)
2. Skapar hushållet **Demo — Villa Söder**
3. Rensar och fyller demo-data (lager, inköpslista, veckoplan)

## Vad finns i datan?

### Skafferi / kyl / frys (~15 varor)

- **Kyl:** grillad kyckling (går ut om ~1 dag — perfekt för *Går ut snart* / ät det först), crème fraîche, mjölk, pesto, ägg, smör
- **Skafferi:** pasta, ris, krossade tomater, havregryn, olivolja
- **Frys:** blåbär, lasagne, falukorv, surdegsbröd (blandade utgångsdatum)

### Inköpslista

- Bananer, toalettpapper, kaffe, morötter (öppna)
- Dillfrön (avbockad — visar att listan används)

### Veckoplan

- Fyra måltider idag → om några dagar, kopplade till varor som snart går ut eller saknas på listan

## Återställning (sales-safe)

| Metod | När |
|--------|-----|
| `npm run seed:demo` | Manuellt före demo / efter test |
| `POST /api/cron/reset-demo` | Schemalagt (Cloud Scheduler + `CRON_SECRET`) |

Cron-exempel:

```bash
curl -X POST "$ORIGIN/api/cron/reset-demo" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Rekommenderat: nattlig reset i prod så utgångsdatum och listor alltid ser fräscha ut.

## Produktion (Firebase App Hosting)

1. Sätt secrets:
   ```bash
   npx firebase apphosting:secrets:set DEMO_ACCOUNT_PASSWORD --project home-pantry-4bee5
   npx firebase apphosting:secrets:set DEMO_ACCOUNT_EMAIL --project home-pantry-4bee5  # valfritt
   ```
2. Kör migration (`0022_user_is_demo.sql`) via `npm run db:migrate` mot Cloud SQL
3. Kör `npm run seed:demo` en gång mot prod-databasen (eller cron-endpointen)
4. Valfritt: Cloud Scheduler → `/api/cron/reset-demo` veckovis/nattligt

## Tekniskt

- Användare: fast id `user-demo-skaffu`, flagga `user.is_demo`
- Hushåll: `household-demo-skaffu`
- Demo-data använder stabila id:n så re-seed inte duplicerar rader
