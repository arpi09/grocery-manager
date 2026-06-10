# Grannskafferiet v1 — spec (geo & trust)

Status: **v1.0 geo slice shipped** (jun 2026). Report/block och push kommer i v1.1+.

Se även: [`GRANNSKAFFERIET_V0.md`](./GRANNSKAFFERIET_V0.md) (token-länk + dela som bild).

## Syfte

Låt opt-in-användare **upptäcka** att någon i närheten delat utgående varor — utan att exponera adress, hushåll eller kontakt. v0 (länk + bild) fortsätter gälla parallellt.

## Scope v1.0 (denna slice)

| Ingår | Ingår inte (v1.1+) |
|-------|---------------------|
| Opt-in i Inställningar + grov plats (~111 m) | Report / block |
| Geo på delning om opt-in aktiv | Push till närliggande |
| Feed inom ~500 m i Ät det först | Chatt, bokning, varubild |
| Ungefärligt avstånd (avrundat till 100 m) | Exakt adress eller karta |

## Flöde

1. Användare aktiverar **Grannskafferiet i närheten** under Inställningar → webbläsaren begär plats → server sparar **grov** lat/lng på `user`.
2. Vid **Dela utgående lista** (om opt-in): klient skickar valfri färsk plats → server sparar grov lat/lng på `expiring_share_link`.
3. Opt-in-användare ser panelen **Grannskafferiet i närheten** på `/hem` → `GET /api/expiring-share/nearby` returnerar aktiva delningar inom radie, exkl. eget hushåll.
4. Mottagare ser varunamn + utgång — **ingen** adress. Avstånd visas som t.ex. "ca 300 m bort".

## Datamodell

### `user` (nya fält)

- `nearby_sharing_enabled` — default `false`
- `nearby_sharing_lat` / `nearby_sharing_lng` — numeric(9,6), grov (3 decimaler)
- `nearby_sharing_updated_at`

### `expiring_share_link` (nya fält)

- `latitude` / `longitude` — nullable; sätts endast om skaparen hade opt-in vid delning

## API

| Metod | Sökväg | Auth | Beskrivning |
|-------|--------|------|-------------|
| `POST` | `/api/expiring-share` | Ja | Skapa länk; valfritt `{ attachNearby, latitude?, longitude? }` |
| `GET` | `/api/expiring-share/nearby` | Ja | Lista närliggande aktiva delningar |
| `GET`/`POST` | `/api/expiring-share/nearby-settings` | Ja | Läs/spara opt-in + plats |

## GDPR & dataminimering

- **Opt-in** — ingen geo utan uttryckligt val i Inställningar.
- **Grov plats** — koordinater avrundas till 3 decimaler (~111 m); avstånd i UI avrundas till 100 m-steg.
- **Ingen adress** i snapshot, feed eller publik `/dela/[token]` — samma som v0.
- **Ingen karta** — bara textuellt ungefärligt avstånd.
- **Tidsbegränsning** — delningar följer 48 h TTL som v0.
- **Eget hushåll exkluderas** från nearby-feed.
- Radering: plats nollställs när användaren stänger av opt-in.

Full policy: [integritetspolicy](https://skaffu.com/privacy).

## Planerat v1.1+

- `POST /api/expiring-share/report` — rapportera olämplig delning
- Block per token eller hushåll
- Web push: "Någon nära dig delar utgående varor" (strikt opt-in, geo-filter)

## Kod

- Geo: `src/lib/domain/geo.ts`
- Service: `src/lib/application/expiring-share.service.ts`
- Repository: `src/lib/infrastructure/repositories/expiring-share.repository.ts`
- API: `src/routes/api/expiring-share/`
- UI: `EatFirstSection.svelte`, `NearbySharingSettingsPanel.svelte`
- Migration: `drizzle/0038_nearby_expiring_share.sql`
