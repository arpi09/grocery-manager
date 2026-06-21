# Store metadata — Skaffu (SV-first)

Copy-paste templates for **TestFlight** and **Play internal testing**. Public listing is gated per [DAY_90_DECISION.md](./DAY_90_DECISION.md).

**Bundle / package:** `com.skaffu.app`  
**App name:** Skaffu  
**Primary locale:** Swedish (sv-SE) — add English (en-US) when you expand listing.

---

## URLs (both platforms)

| Field | Value |
|-------|-------|
| **Privacy policy** | https://skaffu.com/privacy |
| **Support / FAQ** | https://skaffu.com/faq |
| **Support email** | hello@skaffu.com |
| **Marketing site** | https://skaffu.com |
| **Account deletion** | In-app: **Inställningar → Konto → Radera mitt konto** (permanent; see privacy policy). Household owners can also delete a household under **Inställningar → Hushåll**. |

Source of truth for privacy copy: [`src/lib/marketing/privacy-content.ts`](../src/lib/marketing/privacy-content.ts).

---

## Short description (Google Play — max 80 characters)

**SV (77 tecken):**

```
Delad inköpslista och skafferi för hela hushållet — handla ihop, släng mindre.
```

**EN (fallback):**

```
Shared shopping list and pantry for your household — shop together, waste less.
```

---

## Full description

### Swedish (primary)

```
Skaffu hjälper hela hushållet att handla ihop med koll på skafferiet.

• Delad inköpslista i realtid — bjud in partner, checka av i butiken och slipp dubbelköp.
• Skafferi med utgångsdatum — se vad som går ut snart innan maten hinner bli dålig.
• Veckoförslag från kvitton och checkoffs — mindre gissning inför nästa handel.
• Kvitto-PDF och streckkodsskanning — snabbare in med varor ni faktiskt köper.
• Butiksneutralt — samma lista oavsett om ni handlar på ICA, Willys, Coop eller Lidl.

Skaffu är byggt för hushåll som vill minska matsvinn utan krånglig setup. Börja gratis med kärnfunktionerna; Pro ger mer plats för hushållet, full statistik och obegränsad kvitto-PDF när ni är redo.

Frågor? hello@skaffu.com eller https://skaffu.com/faq
Integritet: https://skaffu.com/privacy
```

### English

```
Skaffu helps your whole household shop together with a clear view of what's at home.

• Shared shopping list in real time — invite your partner, check off in the store, avoid duplicate buys.
• Pantry with expiry dates — see what's going out soon before food goes to waste.
• Weekly suggestions from receipts and check-offs — less guesswork before the next shop.
• Receipt PDF and barcode scanning — get items in faster from what you actually buy.
• Store-neutral — one list whether you shop at ICA, Willys, Coop or Lidl.

Built for households that want less food waste without a complicated setup. Start free; Pro adds more household members, full stats and unlimited receipt PDF when you're ready.

Questions: hello@skaffu.com or https://skaffu.com/faq
Privacy: https://skaffu.com/privacy
```

---

## Apple App Store Connect

| Field | Suggested value |
|-------|-----------------|
| **Name** | Skaffu |
| **Subtitle** (30 chars) | `Handla ihop, släng mindre` (27) |
| **Promotional text** (170) | Optional — e.g. *Delad veckolista och skafferi för hela hushållet. Bjud in partner och se vad som går ut snart.* |
| **Keywords** (100 chars, comma-separated, no spaces after commas) | `skafferi,inköpslista,mat,matsvinn,hushåll,handla,lista,kylskåp,utgångsdatum,kvitto` |
| **Primary category** | Food & Drink |
| **Secondary category** | Lifestyle |
| **Age rating** | Complete questionnaire — expect **4+** (no restricted content; household productivity) |
| **Copyright** | `© 2026 Arvid Pilhall` |
| **Support URL** | https://skaffu.com/faq |
| **Privacy policy URL** | https://skaffu.com/privacy |

### App Privacy (nutrition labels) — checklist

Align answers with [`privacy-content.ts`](../src/lib/marketing/privacy-content.ts). Summary for the questionnaire:

| Data type | Collected | Linked to user | Used for tracking | Purpose |
|-----------|-----------|----------------|-------------------|---------|
| **Email address** | Yes | Yes | No | Account, support |
| **Name** (display name) | Yes | Yes | No | Account, household |
| **User ID** | Yes | Yes | No | Account |
| **Photos or videos** | Yes (user-uploaded receipts/shelf photos) | Yes | No | App functionality (scan/AI) |
| **Other user content** | Yes (inventory, lists, receipts text) | Yes | No | App functionality |
| **Product interaction** | Yes (household-scoped usage events) | Yes | No | Analytics / product improvement (first-party, no ad SDK) |
| **Crash data** | If enabled via hosting — declare if collected | — | No | App functionality |

**Not collected for ads:** No third-party advertising SDKs; no data sold to brokers.

**Third-party processors to disclose:** Google Firebase/Cloud (hosting, DB), OpenAI (AI parsing when user triggers it), Resend (email), Cloudflare Turnstile (registration bot protection), Open Food Facts (optional barcode lookup).

**Account deletion:** Yes — in-app self-service (Settings → Account → Delete my account). Mention in App Review notes if asked.

---

## Google Play Console

| Field | Suggested value |
|-------|-----------------|
| **App name** | Skaffu |
| **Short description** | See [Short description](#short-description-google-play--max-80-characters) above |
| **Full description** | See [Full description](#full-description) above |
| **App category** | Food & Drink |
| **Tags** | Shopping, Food & drink, House & home |
| **Contact email** | hello@skaffu.com |
| **Privacy policy** | https://skaffu.com/privacy |
| **Website** | https://skaffu.com |

### Data safety form — checklist

Use the same source as privacy policy. Typical answers for Skaffu:

**Data collected (yes/no per type):**

| Play data type | Collected | Shared with third parties | Optional | Purpose |
|----------------|-----------|---------------------------|----------|---------|
| Email address | Yes | No (processed by Resend for transactional mail) | No | Account |
| Name | Yes | No | No | Account |
| Photos | Yes | OpenAI when user runs AI scan/receipt | No | App functionality |
| Files (PDF receipts) | Yes | OpenAI when user runs receipt parse | No | App functionality |
| App activity (in-app actions) | Yes | No | No | Analytics (first-party) |
| Device or other IDs | Only if FCM added later — **No for beta spike** | — | — | — |

**Security practices:** Data encrypted in transit (HTTPS); users can request deletion; account deletion available in-app.

**Data deletion:** Users can delete account in-app (**Inställningar → Konto → Radera mitt konto**). Link privacy policy.

**Ads:** App does not contain ads.

**Content rating:** Complete **IARC** questionnaire — household productivity / food app, no violence or adult content.

---

## Store assets

### Icons (generated in repo)

```bash
npm run generate:store-icons
```

| Asset | Path | Notes |
|-------|------|-------|
| App Store icon | `static/store/icon-1024.png` | 1024×1024 PNG, no alpha — upload to App Store Connect |
| Android adaptive foreground | `static/store/adaptive-foreground-432.png` | Import in Android Studio → Image Asset |

Regenerate after brand changes to `static/pwa/icon.svg`.

### Screenshots (USER_LOCAL — capture on device or simulator)

| Platform | Required sizes (minimum for internal beta) |
|----------|-----------------------------------------------|
| **iPhone** | 6.7" (1290×2796) — primary; also 6.5" (1284×2778) if targeting older devices |
| **Android phone** | Phone screenshots per Play Console spec (min 2; 1080×1920 or higher) |

**SV-first content ideas:** delad inköpslista, skafferi med utgångsdatum, checkoff i butiken, veckoförslag. See [BRAND_REFRESH_BRIEF.md](./BRAND_REFRESH_BRIEF.md).

Screenshots are **not** generated by the repo — capture manually before first upload.

---

## Capacitor version traceability

Keep native build numbers aligned with [`package.json`](../package.json) semver (`version` field) for support and crash correlation.

| Platform | Where to bump | Maps to |
|----------|---------------|---------|
| **iOS** | Xcode → target **App** → **General** → `MARKETING_VERSION` (user-facing) and `CURRENT_PROJECT_VERSION` (build number) in [`ios/App/App.xcodeproj/project.pbxproj`](../ios/App/App.xcodeproj/project.pbxproj) | e.g. `0.0.1` → marketing `0.0.1`, build `1`, `2`, … |
| **Android** | [`android/app/build.gradle`](../android/app/build.gradle) → `versionName` (user-facing) and `versionCode` (integer, must increase every upload) | e.g. `versionName "0.0.1"`, `versionCode 2` |

**Rule of thumb:** Each store upload increments **build** (`CURRENT_PROJECT_VERSION` / `versionCode`). Bump **marketing** version when `package.json` semver changes.

After bumping: `npm run cap:sync` before Archive / AAB.

---

## Turnstile (before beta testers register)

Capacitor loads `https://skaffu.com` — registration uses Cloudflare Turnstile. **Before inviting testers**, add store hostnames to the Turnstile widget:

1. Cloudflare dashboard → **Turnstile** → your widget → **Hostname Management**
2. Add **`skaffu.com`** and **`www.skaffu.com`** (keep existing dev/prod hostnames)

Missing hostnames cause error **110200** on `/register`. Full steps: [CAPTCHA.md](./CAPTCHA.md).

---

## USER_LOCAL only (not in repo)

| Task | Owner action |
|------|----------------|
| Apple Developer Program + App Store Connect app | Create / enroll |
| Google Play Console app | Create |
| iOS signing (distribution cert + profile) | Xcode / Apple Developer |
| Android upload keystore | Generate once; store securely; never commit |
| Xcode **Product → Archive** → TestFlight internal | Mac + physical smoke |
| Play **Internal testing** AAB upload | Android Studio signed bundle |
| Screenshots (SV) | Device/simulator capture |
| Physical device smoke | Login, session, `/scan`, share intent (Android) |
| Native push (APNs/FCM) | Post-beta — see [APP_STORE.md](./APP_STORE.md) |
| iOS Share Extension (Kivra) | V2 — post-beta |

---

## References

- [APP_STORE.md](./APP_STORE.md) — Capacitor flow, TestFlight, Play internal, repo prep checklist
- [CAPTCHA.md](./CAPTCHA.md) — Turnstile hostnames
- [privacy-content.ts](../src/lib/marketing/privacy-content.ts) — privacy policy source
- [DAY_90_DECISION.md](./DAY_90_DECISION.md) — public listing gates
