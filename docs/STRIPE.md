# Stripe Checkout — testläge (Skaffu Pro)

*Senast uppdaterad: juni 2026. Priser enligt [PRICING.md](./PRICING.md).*

Den här guiden beskriver hur du sätter upp **Stripe i testläge** lokalt i kväll. Produktion (live-nycklar) kommer senare — samma flöde, andra nycklar.

---

## 1. Stripe Dashboard (test mode)

1. Logga in på [dashboard.stripe.com](https://dashboard.stripe.com) och slå på **Test mode** (växla uppe till höger).
2. Gå till **Developers → API keys** och kopiera:
   - **Secret key** (`sk_test_…`) → `STRIPE_SECRET_KEY`
3. Skapa produkt **Skaffu Pro** under **Product catalog → Products**:
   - **Månad:** 39 SEK / månad, recurring
   - **År:** 299 SEK / år, recurring
4. Kopiera **Price ID** (`price_…`) för varje pris:
   - `STRIPE_PRICE_ID_MONTHLY`
   - `STRIPE_PRICE_ID_YEARLY`

---

## 2. Miljövariabler (.env)

Kopiera från `.env.example` till `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

Checkout-knappar i **Inställningar → Plan** visas när `STRIPE_SECRET_KEY` och båda price IDs är satta. Webhook krävs för att Pro ska aktiveras efter betalning.

---

## 3. Webhook lokalt (`stripe listen`)

Stripe kan inte nå `localhost` direkt. Använd Stripe CLI:

```bash
# Installera: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5173/api/stripe/webhook
```

CLI skriver ut en **webhook signing secret** (`whsec_…`) — sätt den som `STRIPE_WEBHOOK_SECRET` i `.env`.

**Viktigt:** Dev-servern lyssnar på port **5173** (`npm run dev`) eller **3000** (`node build` / adapter-node). Justera `--forward-to` efter din `ORIGIN` / port.

Lyssna på dessa events (appen hanterar dem):

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## 4. Testa checkout

1. Starta appen (dev-runtime startar om automatiskt vid `.env`-ändringar).
2. Kör `stripe listen` i ett separat terminalfönster.
3. Logga in som **ägare** av ett hushåll.
4. Gå till **Inställningar → Plan** och klicka **Uppgradera**.
5. I Stripe Checkout, använd testkort:

| Fält | Värde |
|------|-------|
| Kortnummer | `4242 4242 4242 4242` |
| Utgång | valfritt framtida datum |
| CVC | valfritt 3 siffror |
| Postnummer | valfritt |

6. Efter lyckad betalning: webhook sätter hushållets `plan_tier` till **pro**. Ladda om Inställningar — du ska se **Pro** och obegränsade gränser.

Avbryt flödet testar du med **Tillbaka** i Checkout (`?checkout=cancel`).

---

## 5. Teknisk översikt

| Del | Plats |
|-----|-------|
| Checkout API | `POST /api/stripe/checkout` — skapar Stripe Checkout Session |
| Webhook | `POST /api/stripe/webhook` — signaturverifiering + uppdaterar DB |
| Plan per hushåll | Kolumner på `household`: `plan_tier`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` |
| Gränser | `PlanLimitsService` / `AiRateLimitService` läser `locals.planTier` |

Fakturering sker på **hushåll** (en betalande ägare). Endast **ägare** kan starta checkout.

---

## 6. Produktion (senare)

1. Byt till **live**-nycklar i Stripe Dashboard.
2. Skapa webhook-endpoint mot `https://skaffu.com/api/stripe/webhook` med samma events.
3. Sätt secrets i Firebase App Hosting — se kommenterade rader i `apphosting.yaml` (samma mönster som `OPENAI_API_KEY`).
4. Sätt `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` som env (inte secrets).

---

## 7. Felsökning

| Symptom | Åtgärd |
|---------|--------|
| Ingen uppgraderingsknapp | Kontrollera `STRIPE_SECRET_KEY` + price IDs i `.env` |
| Betalning OK men fortfarande Gratis | Kör `stripe listen`, kontrollera `STRIPE_WEBHOOK_SECRET` |
| 400 Invalid signature | Webhook secret matchar inte `stripe listen`-utskriften |
| 403 vid checkout | Logga in som hushållets **ägare** |

---

## Relaterat

- [PRICING.md](./PRICING.md) — Free vs Pro, prishypotes
- [.env.example](../.env.example) — alla `STRIPE_*`-variabler
