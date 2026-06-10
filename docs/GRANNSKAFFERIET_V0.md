# Grannskafferiet v0 — spec & MVP

Status: **v0 shipped** (jun 2026). Geo, chat och moderation kommer i senare versioner.

**v0.1** (jun 2026): `navigator.share` för länk, UTM-registrerings-CTA på `/dela/[token]`.

**v1 geo:** se [`GRANNSKAFFERIET_V1.md`](./GRANNSKAFFERIET_V1.md).

## Syfte

Låt hushåll dela **utgående varor** via tidsbegränsad publik länk — första steg mot lokal delning utan att bygga Olio-klon dag ett.

## Scope v0

| Ingår | Ingår inte |
|-------|------------|
| Token-länk `/dela/[token]` (48 h) | Geo / radie (v1) |
| Snapshot av varor som går ut inom 7 dagar | Chat eller bokning |
| Knapp i "Ät det först" | Bilduppladdning |
| Read-only publik sida | Moderation/report (v1.1) |
| Dela som bild (PNG) | |
| `navigator.share` för länk (v0.1) | |
| Registrerings-CTA med UTM på publik sida (v0.1) | |

## Flöde

1. Användare med redigeringsrätt öppnar **Ät det först** (hem eller veckoritual).
2. Klick **Dela utgående lista** → `POST /api/expiring-share`.
3. Server skapar rad i `expiring_share_link` med SHA-256-hash av token, JSON-snapshot, `expires_at = now + 48h`.
4. Klient delar via `navigator.share` om tillgängligt, annars kopierar URL till urklipp; toast bekräftar.
5. Mottagare öppnar `/dela/{token}` — ingen inloggning; CTA till skaffu.com med `utm_content=grannskafferiet`.
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
- Full policy: [`privacy`](https://skaffu.com/privacy).

Användare bör bara dela med personer de litar på; v0 har ingen block/report — dokumentera i [`GRANNSKAFFERIET_V1.md`](./GRANNSKAFFERIET_V1.md).

## Produkthändelser

| Event | När |
|-------|-----|
| `expiring_share_created` | Länk skapad (auth) |
| `expiring_share_viewed` | Publik sida visad |

## Prod-verifiering (checklista)

Kör efter deploy (~5 min, inloggad användare med varor som går ut inom 7 dagar):

| Steg | Förväntat |
|------|-----------|
| `/hem` → **Ät det först** → **Dela utgående lista** | Länk skapas; share-sheet eller "kopierad"-toast |
| **Dela som bild** | PNG delas eller laddas ner |
| Öppna `/dela/[token]` | Read-only lista; `noindex`; GDPR-notis; **Prova Skaffu**-CTA med UTM |
| `/admin` → produkthändelser | `expiring_share_created` och `expiring_share_viewed` syns |
| E2E `growth-wave.spec.ts` | Grannskafferiet-tester gröna |

## Community soft launch (manuell post)

Klistra in i matsvinn-/föräldragrupp (Facebook). Byt ut `[din bild]` mot **Dela som bild** från Ät det först.

**Svenska — mall A (bild + länk)**

```
Hej! Vi har några varor som går ut den här veckan och vill gärna att någon använder dem istället för att de blir svinn.

[Bifoga PNG från Skaffu → Dela som bild]

Vill du också hålla koll på utgående varor hemma? Skaffu är gratis i beta:
https://skaffu.com/?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w12&utm_content=grannskafferiet
```

**Svenska — mall B (bara länk till specifik lista)**

```
Delar vår utgående-lista (48 h) — bara varunamn, ingen adress:
[din /dela/…-länk]

Mer om Skaffu: https://skaffu.com/?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w12&utm_content=grannskafferiet
```

**Tips:** Använd **Dela som bild** i grupper som inte vill ha externa länkar i flödet; lägg skaffu.com-UTM i kommentaren.

## v1 (planerat)

- Browser geo + 500 m radie → [`GRANNSKAFFERIET_V1.md`](./GRANNSKAFFERIET_V1.md)
- Report/block
- Push till närliggande opt-in-användare

## Kod

- Domain: `src/lib/domain/expiring-share.ts`
- Service: `src/lib/application/expiring-share.service.ts`
- API: `src/routes/api/expiring-share/+server.ts`
- Publik sida: `src/routes/dela/[token]/`
- E2E: `e2e/growth-wave.spec.ts`
