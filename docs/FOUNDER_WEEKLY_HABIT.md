# Founder weekly habit — retention_core_value

Operativ checklista för **founder-pairs-10** (todo `retention_core_value`). Mål: **10 hushåll à 2 medlemmar** som handlar **tillsammans på samma inköpslista** varje vecka — inte fler registreringar.

**Kärnvärde:** delad `/inkop`-lista som båda använder vid samma handelstillfälle.

**Komplettera med:** [`BETA_TESTER_GUIDE.md`](./BETA_TESTER_GUIDE.md) (hjälp vid kvitto) · [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md) (15 min efter vecka 2) · föregående sprint: [`FOUNDER_SEED_PLAYBOOK.md`](./FOUNDER_SEED_PLAYBOOK.md) (rekrytering).

---

## Rekrytering — 10 par-hushåll

| Krav | Varför |
|------|--------|
| **Exakt 2 medlemmar** — du + partner (eller två personer som redan handlar tillsammans) | Retention mäts på *delad* lista, inte solo |
| **Varma kontakter** | Du kan följa upp varje vecka utan kall outreach |
| **Handlar mat 2+ gånger/vecka** | Annars blir veckokravet artificiellt |

**Profil:** SV-hushåll, ok med webbapp på mobil, partner som faktiskt kan gå med i samma vecka.

**Skicka inte massinbjudan.** 10 personliga DM där du ber om *två veckors vana*, inte bara “prova appen”.

### DM-mall (kort)

> Hej [namn]! Jag kör **Skaffu** (skaffu.com) med några hushåll — delad inköpslista ni båda använder när ni handlar. Kan du och [partner] vara med två veckor? Vecka 1: konto, 3 saker på inköpslistan, bjud in partner, handla en gång tillsammans. Vecka 2: lägg utgång på 3 varor *eller* importera ett kvitto, sen handla igen. ~10 min totalt per vecka. Ärlig feedback uppskattas.

Länk: `https://skaffu.com`

---

## Veckokrav (båda veckor)

**En gemensam handel per vecka:** båda öppnar `/inkop`, samma lista, minst en post avbockas under samma shopping-tillfälle (samma dag räcker).

| Vecka | Minimikrav | Klart när |
|-------|------------|-----------|
| **1** | Registrera → lägg **3 saker** på inköpslistan → **bjud in partner** → **handla tillsammans en gång** | Partner accepterat invite + ≥1 avbockad rad samma dag som partner var aktiv |
| **2** | **Utgång på 3 varor** *eller* **importera 1 kvitto** → sedan **handla tillsammans igen** på `/inkop` | 3 utgångsdatum satta *eller* 1 kvitto importerat + gemensam handel |

**Tips:** Gå igenom steg 1 live (telefon/video) om de fastnar på hushållsinvite — det är den vanligaste friktionen.

---

## Onboarding — steg för varje par

| # | Steg | Var i appen | Klart när |
|---|------|-------------|-----------|
| 1 | **Registrera** | skaffu.com → Skapa konto | Inloggad |
| 2 | **Lägg 3 saker på inköpslistan** | **`/inkop`** → lägg till | ≥3 rader |
| 3 | **Bjud in partner** | **Mer** → **Hushåll** → delningslänk / e-postinvite | Partner accepterat `/invite/[token]` |
| 4 | **Handla tillsammans (v1)** | Båda på **`/inkop`**, avbocka under samma tillfälle | ≥1 rad avbockad samma dag |
| 5 *(v2)* | **Utgång eller kvitto** | **Hem** → utgång på 3 varor *eller* kvittoimport | 3 datum *eller* 1 kvitto |
| 6 *(v2)* | **Handla tillsammans igen** | **`/inkop`**, samma lista | ≥1 rad avbockad vecka 2 |

Publik lista-länk räcker **inte** — partner ska vara **inbjuden medlem** i hushållet.

---

## Spårningstabell (veckovis)

Fyll i Google Sheet / Notion / papper. Uppdatera **varje söndag**.

| Hushåll | Medlemmar aktiva (2/2?) | Gemensam handel denna vecka? | Lista: avbockade poster | Anteckningar |
|---------|-------------------------|------------------------------|-------------------------|--------------|
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |
| | ☐ ☐ | ☐ | | |

**Veckoslut:** räkna hushåll där **2/2 medlemmar aktiva** **och** **gemensam handel = ja** = retention-signal.

---

## Vad du INTE ska mäta

| Undvik | Varför |
|--------|--------|
| **PMF-dashboard som daglig hobby** | [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md) / `/admin`-aggregat ger falsk precision med 10 par |
| **Product events / funnel i admin** | D7/D30 och event-räknare säger inget om *delad handel* |
| **Registreringar eller “aktiva hushåll” utan par + lista** | Acquisition-metric; inte retention_core_value |

Använd tabellen ovan + **2 korta samtal** efter vecka 2.

---

## Vad du INTE ska be användare göra

| Undvik | Varför |
|--------|--------|
| **Grannskafferiet** (dela `/dela`, grupp-postning) | Distribution, inte delad lista-vana ([`GRANNSKAFFERIET_V0.md`](./GRANNSKAFFERIET_V0.md)) |
| **Måltids-AI / veckoplan / “Ät det först”-flöden** | Sidospår; vecka 2 ska vara utgång *eller* kvitto, inte recept |
| **Utforska `/hem`-features** (skafferapport, wrapped, onboarding-tips) | Brus; håll fokus på `/inkop` + hushållsinvite |
| **LinkedIn / community-launch** | Kommer efter retention-bevis ([`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md)) |

---

## Definition of done (founder-pairs-10)

- [ ] 10 par-hushåll rekryterade (2 medlemmar vardera)
- [ ] Vecka 1: ≥8/10 med gemensam handel på `/inkop`
- [ ] Vecka 2: ≥6/10 upprepar (utgång/kvitto + gemensam handel)
- [ ] Minst **2** korta samtal noterade ([`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md))
- [ ] Top-3 friktioner (1 rad vardera) — input till nästa retention-sprint

---

*Human ops · `retention_core_value` · jun 2026.*
