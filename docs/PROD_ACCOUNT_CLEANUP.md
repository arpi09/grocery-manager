# Prod — ta bort testkonto

Admin-UI (`/admin`) har **ingen** “radera användare”-knapp — bara logga ut, roller och husdjur. För att ta bort ett engångskonto (t.ex. smoke test) krävs **Cloud SQL** eller framtida self-service.

## Smoke test 2026-06-01

| Fält | Värde |
|------|--------|
| E-post | `smoke-test-20260601-cursor@example.com` |
| Prod-URL | `https://skaffu.com` |
| Status | **Raderad 2026-06-01** via `scripts/delete-prod-user-by-email.mjs` (Cloud SQL, lokal `DATABASE_URL`) |

### Snabb radering (agent / ägare med DATABASE_URL)

```powershell
node --env-file=.env scripts/delete-prod-user-by-email.mjs smoke-test-20260601-cursor@example.com
```

Kräver prod-`DATABASE_URL` i `.env` (Cloud SQL public IP + auktoriserat nätverk, eller Cloud Shell). Verifiera: `SELECT id FROM "user" WHERE email = '...';` → 0 rader.

### Steg 1 — verifiera i admin (valfritt)

1. Logga in som admin → [`/admin`](https://skaffu.com/admin) (kräver prod `ADMIN_PASSWORD` i Firebase — skiljer sig från lokal `.env`).
2. Sök e-post i användartabellen. **2026-06-01:** kontot fanns efter prod-smoke; ska **inte** synas efter radering ovan.
3. **Logga ut användare** stoppar bara sessioner — raderar inte kontot.

### Steg 2 — radera i Cloud SQL (ägare)

1. [GCP Console](https://console.cloud.google.com/) → projekt **`home-pantry-4bee5`** → **Cloud SQL** → **`home-pantry-4bee5-instance`**.
2. **Cloud Shell** eller auktoriserat nätverk → anslut med `psql` och prod-`DATABASE_URL` (från Secret Manager).
3. Hitta användar-id:

```sql
SELECT id, email, created_at FROM "user"
WHERE email = 'smoke-test-20260601-cursor@example.com';
```

4. Radera (cascade på session, household_member m.m.; rensa hushåll som bara ägs av kontot först om nödvändigt):

```sql
BEGIN;

-- Om användaren är enda medlem i ett hushåll utan andra medlemmar:
-- DELETE FROM household WHERE id IN (...);

DELETE FROM "user"
WHERE email = 'smoke-test-20260601-cursor@example.com';

COMMIT;
```

5. Verifiera: raden ska saknas i `/admin` efter refresh.

**Obs:** `ADMIN_PASSWORD` i Firebase behövs för admin-inloggning, inte för SQL. SQL kräver GCP-åtkomst till Cloud SQL.
