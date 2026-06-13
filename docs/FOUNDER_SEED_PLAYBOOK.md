# Founder seed — första 10 aktiva hushåll på 7 dagar

Operativ checklista för **founder-seed-10** (steg mot `first_50_households`). Mål: **10 hushåll** som gör minst en meningsfull handling inom 7 dagar — inte bara registrering.

**Aktivt hushåll (denna sprint):** registrerat + ≥3 poster på inköpslistan + antingen delad lista-länk **eller** inbjuden partner som gått med.

**Komplettera med:** [`BETA_TESTER_GUIDE.md`](./BETA_TESTER_GUIDE.md) (skicka till testare) · [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md) (15 min efter vecka 1) · [`LINKEDIN_COMPANY_PAGE.md`](./LINKEDIN_COMPANY_PAGE.md) (admin-kö).

---

## Veckoplan (7 dagar)

| Dag | Fokus |
|-----|--------|
| **1–2** | Rekrytera 10 kandidater; skicka personlig DM med länk |
| **3–4** | Följ upp som inte nått 3 listposter; hjälp med hushållsinvite |
| **5** | LinkedIn-inlägg #1 (admin → LinkedIn-kö) |
| **6–7** | Sista påminnelse; LinkedIn-inlägg #2 om kön har draft |

---

## Vem ska du rekrytera?

Prioritera **varma kontakter** — du känner dem, de svarar, de förlåter beta-strul.

| Källa | Mål | Varför |
|-------|-----|--------|
| **Vänner / syskon** | 4–5 hushåll | Snabbast feedback; ofta delat boende eller partner |
| **Föräldrar / svärföräldrar** | 2–3 hushåll | Handlar regelbundet; naturlig “dela listan”-vinkel |
| **Lokal FB-grupp du redan är med i** | 1–2 hushåll | *Inte* kall outreach — svara i tråd eller DM till någon du interagerat med |

**Profil som funkar:** SV-hushåll som handlar mat 2+ gånger/vecka, minst två personer i hushållet (eller vill koordinera med partner), ok med webbapp på mobil.

**Skicka inte massinbjudan.** 10 personliga DM > en stor post.

### DM-mall (kort)

> Hej [namn]! Jag testar **Skaffu** (skaffu.com) — hålla koll på mat hemma och delad inköpslista. Kan du prova i veckan? Tar ~5 min: skapa konto, lägg 3 saker på inköpslistan, och dela listan med [partner / mig] om du vill. Helt gratis beta — ärlig feedback uppskattas.

Länk: `https://skaffu.com`

---

## Onboarding — steg för varje hushåll

Gå igenom detta själv med dem vid behov (telefon / video).

| # | Steg | Var i appen | Klart när |
|---|------|-------------|-----------|
| 1 | **Registrera** | skaffu.com → Skapa konto | Inloggad på `/hem` |
| 2 | **Lägg 3 saker på inköpslistan** | **Inköp** → lägg till (t.ex. mjölk, bröd, ägg) | Listan har ≥3 rader |
| 3a | **Dela lista-länk** *eller* | **Inköp** → dela lista (publik read-only länk) | Länk skickad till partner/vän |
| 3b | **Bjud in partner** | **Mer** → **Hushåll** → delningslänk / e-postinvite | Partner öppnat `/invite/[token]` och gått med |
| 4 *(valfritt)* | **Ät det först → dela** | **Hem** → **Ät det först** → **Dela utgående lista** | `/dela/[token]` skickad om de har varor som går ut snart |

**Tips:** Steg 3a *eller* 3b räcker — inte båda krävs för “aktivt”. Partner som bara tittar på lista-länken räknas inte som andra medlem; invite räknas när de accepterat.

Skicka [`BETA_TESTER_GUIDE.md`](./BETA_TESTER_GUIDE.md) om de fastnar på skanning/kvitto — det är *inte* krav denna vecka.

---

## LinkedIn — 2×/vecka via admin

| # | Åtgärd |
|---|--------|
| 1 | Logga in på [`/admin`](https://skaffu.com/admin) → fliken **LinkedIn-kö** |
| 2 | Granska draft (agent eller du), redigera om behövs, **godkänn** |
| 3 | Publicera via API eller kopiera manuellt till företagssidan |
| 4 | Upprepa **två gånger** under 7-dagarsperioden (t.ex. dag 5 och dag 7) |

**Innehåll:** ärlig beta, ett konkret tips (delad lista, utgång), länk `https://skaffu.com`. Inga falska användarsiffror.

Se [`LINKEDIN_COMPANY_PAGE.md`](./LINKEDIN_COMPANY_PAGE.md) och [`LINKEDIN_REPOST.md`](./LINKEDIN_REPOST.md).

---

## Manuell spårningstabell

Fyll i Google Sheet / Notion / papper — **inte** bara `/admin` denna vecka. Du behöver namn och uppföljning.

| Hushåll (namn) | Medlemmar (antal) | 3+ listposter? | Delad lista-länk? | Partner inbjuden? | Anteckningar |
|----------------|------------------|----------------|-------------------|-------------------|--------------|
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |
| | | ☐ | ☐ | ☐ | |

**Veckoslut:** räkna rader där *3+ listposter* **och** (*delad lista* **eller** *partner inbjuden*) = mål **10**.

---

## Vad du INTE ska göra denna vecka

| Undvik | Varför |
|--------|--------|
| **Grannskafferiet kall outreach** (posta `/dela` i okända grupper, “gratis mat i [stad]”) | Tom feed / negativ social proof; kräver trust-first hushåll först ([`GRANNSKAFFERIET_V0.md`](./GRANNSKAFFERIET_V0.md)) |
| **PMF-dashboard som daglig hobby** | [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md) är för 4-veckors launch — med 10 hushåll ger siffrorna falsk precision; använd tabellen ovan + 2 intervjuer |
| **Community-launch i 3 FB-grupper** | Kommer i [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) *efter* seed-10 |
| **Lova features som ej finns** | Se “Vad INTE lova” i [`BETA_LAUNCH_SOFT.md`](./BETA_LAUNCH_SOFT.md) |
| **Optimera LinkedIn/analytics före 10 aktiva** | Distribution före retention-bevis |

---

## Definition of done (founder-seed-10)

- [ ] 10 rader i spårningstabellen uppfyller aktiv-kriteriet
- [ ] Minst **2** korta samtal noterade ([`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md))
- [ ] **2** LinkedIn-inlägg publicerade från admin-kön
- [ ] En lista med top-3 friktioner (1 rad vardera) — input till nästa sprint mot 50 hushåll

---

*Human ops enabler · `first_50_households` · senast skapad jun 2026.*
