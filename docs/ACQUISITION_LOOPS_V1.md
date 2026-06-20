# Acquisition Loops V1

> Distribution via delad inköpslista (W1) och kontextuella household-invites (W4). Butiksjämförelse-delning är **V2-backlog** (kräver prisdata).

## Surfaces (V1)

| Surface | Route | Status |
|---------|-------|--------|
| Shared shopping list | `/lista/[token]` | Branding, snapshot-honesty copy, signup CTA |
| Expiring share | `/dela/[token]` | Conversion pass aligned with lista |
| Invite value moments | In-app | Receipt success, trip completed, post-list-share |

## Primary KPI

```sql
-- Weekly signup conversion from shared list
SELECT
  COUNT(*) FILTER (WHERE event_type = 'shared_list_signup_completed')::float
  / NULLIF(COUNT(*) FILTER (WHERE event_type = 'shared_list_opened'), 0)
FROM product_event
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Target (establish baseline 4 weeks):** `shared_list_signup_completed` / `shared_list_opened` per week.

## Secondary KPIs

| Metric | Query basis | V1 target |
|--------|-------------|-----------|
| Invite acceptance | `household_invite_accepted` / `household_invite_sent` | >15% after 100 sends |
| Shared list CTR | `shared_list_signup_clicked` / `shared_list_opened` | >8% |

## Kill criteria (30 days)

- `shared_list_opened` < 50 total **or** signup CTR < 2% → pausa W1 marketing; do not build W2 city feed.

## Event dictionary

| Event | When | Key metadata |
|-------|------|--------------|
| `shared_list_opened` | Guest opens `/lista/[token]` | `itemCount`, `tokenPrefix` |
| `shared_list_signup_clicked` | Signup CTA on lista | `acquisition_source` |
| `shared_list_signup_completed` | Register/OAuth with `shopping_share` UTM or `lista_join` cookie | `acquisition_source`: `shopping_share` \| `lista_join` |
| `public_surface_viewed` | Guest opens public surface | `surface`: `lista` \| `dela` |
| `public_surface_signup_clicked` | Signup CTA on public surface | `surface`, `acquisition_source` |
| `household_invite_sent` | Invite link created | `context`, `channel` (`share_api` \| `settings`) |
| `household_invite_accepted` | Partner joins household | `context` (standardize where available) |

**Dual-fire (30d transition):** `shopping_list_share_viewed` / `shopping_list_share_cta_clicked` kept alongside new `shared_list_*` events.

### Invite contexts (V1)

| Context | Trigger | Solo only |
|---------|---------|-----------|
| `receipt_success` | First receipt import success modal | Yes |
| `trip_completed` | First shopping trip completed (V2) | Yes, rate-limited 7d |
| `list_shared` | After first `shopping_list_share_created` | Yes, one toast |
| `inkop` | Existing banner (list engagement) | Yes |
| `settings` / `export_prompt` | Existing global modal | Yes |

## V2 backlog — store comparison share

**Not in V1.** Public `/butik/[token]` with preferences + chains + teaser requires either restored preference capture or receipt-based price estimates. Flag `STORE_RECOMMENDATION_V0_ENABLED` may remain for telemetry/domain — no new UI until price engine exists.

## References

- [ACQUISITION_WEDGES.md](./ACQUISITION_WEDGES.md) — W1→W3→W4 strategy
- [HOUSEHOLD_GROWTH.md](./HOUSEHOLD_GROWTH.md) — invite bridge copy
