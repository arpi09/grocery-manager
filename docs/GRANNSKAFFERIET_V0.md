# Grannskafferiet v0 — spec & MVP

Status: **v0 shipped** (jun 2026). Geo, chat och moderation kommer i senare versioner.

## Syfte

Låt hushåll dela **utgående varor** via tidsbegränsad publik länk — första steg mot lokal delning utan att bygga Olio-klon dag ett.

## Scope v0

| Ingår | Ingår inte |
|-------|------------|
| Token-länk `/dela/[token]` (48 h) | Geo / radie |
| Snapshot av varor som går ut inom 7 dagar | Chat eller bokning |
| Knapp i "Ät det först" | Bilduppladdning |
| Read-only publik sida | Moderation/report (v1) |

## Flöde

1. Användare med redigeringsrätt öppnar **Ät det först** (hem eller veckoritual).
2. Klick **Dela utgående lista** → `POST /api/expiring-share`.
3. Server skapar rad i `expiring_share_link` med SHA-256-hash av token, JSON-snapshot, `expires_at = now + 48h`.
4. Klient kopierar full URL till urklipp; toast bekräftar.
5. Mottagare öppnar `/dela/{token}` — ingen inloggning.
6. Länk slutar gälla automatiskt; ingen PII i snapshot.

## Datamodell

`expiring_share_link`:

- `token_hash` — aldrig lagra rå token
- `snapshot_json` — `{ items: [{ name, expiresOn, location, quantity, unit }], createdAt }`
- `household_id`, `created_by_user_id`, `expires_at`

## GDPR & integritet

- Publikt innehåll: **endast** varunamn, utgångsdatum, plats (kyl/frys/skafferi), mängd.
- **Ingen** adress, hushållsnamn, e-post eller användar-ID exponeras.
- Länk är **oindexerad** (`noindex`) och **tidsbegränsad**.
- FAQ: *"Kan jag dela utgående varor med grannar?"* på `/faq`.
- Full policy: [`privacy`](https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app/privacy).

Användare bör bara dela med personer de litar på; v0 har ingen block/report — dokumentera i v1-spec.

## Produkthändelser

| Event | När |
|-------|-----|
| `expiring_share_created` | Länk skapad (auth) |
| `expiring_share_viewed` | Publik sida visad |

## v1 (planerat)

- Browser geo + 500 m radie
- Report/block
- Push till närliggande opt-in-användare

## Kod

- Domain: `src/lib/domain/expiring-share.ts`
- Service: `src/lib/application/expiring-share.service.ts`
- API: `src/routes/api/expiring-share/+server.ts`
- Publik sida: `src/routes/dela/[token]/`
