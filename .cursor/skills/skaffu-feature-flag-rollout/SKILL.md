---
name: skaffu-feature-flag-rollout
description: Rolls out Skaffu feature flags (PUBLIC_* env, apphosting.yaml). Use when enabling W1 shopping share, city feed, or changing prod env in apphosting.yaml.
---

# Feature flag rollout

## Flags registry

| Flag | Reader | Prod default |
|------|--------|--------------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | `shopping-list-share-flag.ts` | false |
| `PUBLIC_CITY_FEED_ENABLED` | `public-city-feed.service.ts` | false |
| `STRIPE_CHECKOUT_DISABLED` | checkout routes | true (checkout off) |
| `KIVRA_FORWARD_ENABLED` | `kivra-forward.ts` | false |

## Rollout steps

1. `.env.example` kommentar + CURRENT_REALITY tabell.
2. `apphosting.yaml` — BUILD + RUNTIME för `PUBLIC_*`.
3. UI: verify inkop footer "Dela länk", `/lista/[token]`, export footer om W1.
4. Deploy via `skaffu-deploy-verify` — flags kräver deploy, inte bara merge.
5. Post-deploy: smoke dela länk + lista page (flag on).

## W1 enable checklist

- [ ] Flag true i apphosting
- [ ] Inkop: dela länk synlig
- [ ] Export: Skaffu register URL i clipboard footer
- [ ] Lista CTA: partner → household (inte ny solo household)
