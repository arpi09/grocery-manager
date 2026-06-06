# Veckan fixad — UX-spec (Måndagsritual)

*Produktpaket: utgående varor → AI-måltider → ett klick till plan + inköpslista.*

## Flöde (en skärm, ett huvud-CTA)

1. **Ingång:** `/planer/vecka` (länk från `/hem`, push, planer-banner)
2. **Utgående:** chips med varor som går ut inom 7 dagar
3. **Generera:** anropar befintlig `POST /api/eat-first` (max 5 förslag)
4. **Förhandsgranska:** varje förslag med tilldelad dag (mån–fre, från idag)
5. **Godkänn veckan:** `POST /api/planer/weekly-ritual/approve` → schemalägg alla + lägg saknade på inköpslista
6. **Avslut:** toast + länk till `/inkop` och `/planer`

## Startsida

- **WeeklyRitualHero** visas mån–ons eller när utgående varor finns
- **EngagementStrip** + **Skafferapport** under hero

## Push / e-post

- Utgångspush pekar på `/planer/vecka?from=push` med copy om veckoförslag

## Mätetal

- `weekly_ritual_approved` (product event)
- Plan→lista 2+/vecka, D7/D30 i `/admin`
