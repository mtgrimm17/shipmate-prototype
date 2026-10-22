# Steam → Epic Games Store field-coverage audit

_Oct 21, 2026. Scope: the `egs` card (the four-step card Jaco has been shaping in
v8.31–v8.42; `egs_full` is noted where it differs). Same method as the Mac audit
(`field-coverage-audit.md`): three things and the gaps between them._

1. **Epic requires** — what the Developer Portal makes mandatory, surface by
   surface, read from Epic's own docs on Oct 21 (Store Presence → Configure
   Store Settings, Regions & Ratings, Manage Pages, Offer Details, Manage
   Artifacts, and the Storefront Media Guide).
2. **Steam exposes** — what we can take from a Steam app id without the
   developer typing it: our `/game` endpoint (`search.dev.shipmate.gg/game`,
   the only Steam call Shipmate makes today), Steam's public `appdetails` API,
   and Steam's CDN art. Checked live against Cult of the Lamb (1313140).
3. **Shipmate collects** — what the `egs` card and the shared state actually
   hold today, and whether anything maps it to Epic's field.

Nothing in the code was changed to produce this. **Nothing goes to Epic's portal
automatically yet** — there is no Epic equivalent of the Mac agent's `/populate`,
so "covered" here means *collected and shown on the Epic card in Epic's shape*,
which is what the colleague's current work is about.

---

## Executive summary

**Epic's shape is close to Steam's, and most of the text is already shared.**
Product display name, short description, long description, developer,
publisher, supported languages, support URL/email, website and release date all
come from Steam today and are already read by Epic's Store Page Preview and
Localizations (one copy of the text, by design — `EGS_LOC_REVIEW_FIELDS` reads
Steam's accessors).

**What is missing, in priority order:**

- **P0 — Art is collected in Steam's sizes, not Epic's.** Epic has six fixed
  slots with exact dimensions (logo 960×540 PNG; offer landscape 2560×1440;
  offer portrait 1200×1600; carousel 1920×1080; about images ≥700 wide;
  additional images 1920×1080 JPG ≤1 MB; social 1200×1200). Steam's header
  (460×215), capsules (231×87 / 616×353), library hero (3840×1240), portrait
  capsule (600×900) and 1920×1080 screenshots are the inputs. The preview
  currently picks "any landscape art or the first screenshot". Needs a mapping
  table + the re-cut/validation the Mac flow already has for its icon.
- **P0 — Genres and Features are Epic pick-lists, not free text.** Epic: up to
  three genres from its list; Features selected from its list. Steam gives
  `genres[]` (Action, Adventure, Indie, Strategy) and `categories[]` (Single-
  player, Co-op, Full controller support, Steam Cloud, Achievements…). Shipmate
  keeps Steam's genres as one string (`webSite.genres`) and never ingests
  categories. Needs two translation tables (Steam genre → Epic genre; Steam
  category → Epic feature) and the two fields on the card.
- **P0 — Content rating: the IARC questionnaire is NOT filled in Epic's portal.**
  Epic sends the developer to IARC's own site for the questionnaire; the one
  thing Epic's portal accepts directly is an **existing IARC certificate ID /
  Global Rating ID** — which Google Play issues from the same questionnaire.
  So the right translation is not "push answers to Epic" but **"carry the
  Google Play IARC certificate ID to Epic"**, plus **Steam's existing
  traditional ratings** (`appdetails.ratings`: USK, OFLC, DEJUS, KGRB, IGRS with
  descriptors — Epic *requires* any traditional rating the product has to be
  uploaded, with its PDF). Shipmate's shared IARC answers remain the right
  pre-fill for the IARC site; they are not the deliverable.
- **P1 — Specifications (system requirements) are not collected for Epic at
  all.** Epic requires per-platform minimum/recommended specs; Steam's
  `pc_requirements` / `mac_requirements` carry them (HTML, but regular:
  OS / Processor / Memory / Graphics / Storage / DirectX). Needs ingest + a
  small parser + a Specs block on the card (the preview already draws an
  `egs-spp-specs` block with nothing behind it).
- **P1 — Legal footer, privacy policy, terms/EULA.** Legal footer is
  mandatory; Steam's `legal_notice` ("Copyright Massive Monster 2022…") is
  exactly it. Privacy policy URL is collected for the App Store and should be
  reused. Terms of Use is conditional.
- **P1 — Offer: price, dates, product login, default install folder.** Price
  now lives in the buy box (v8.41) as an Epic tier; Steam's `price_overview`
  (USD) should pre-select the nearest tier. "Initial release date on another
  platform" is literally Steam's `release_date` and Epic asks for it. Product
  login (Epic account required? none?) and the artifact's default folder
  (alphanumeric, ≤25, starts with a letter) are small required fields nobody
  collects.
- **P2 — Trailer, closed captions, social links, FAQ page, Early Access flag,
  blockchain disclosure.** Steam `movies[]` give the trailer (already ingested
  for Assets); Epic's carousel wants an MP4 ≤300 MB 1080p — a Steam movie URL
  is a direct fit. `links[]` from `/game` partially cover social. The rest are
  flags with a known default.

**What is NOT a gap:** the binary. Epic uploads happen through the BuildPatch
Tool against an artifact; that is the Epic twin of the Mac agent and is out of
scope for this audit (it is the "Upload Build" step, and today it is a manual
upload like Steam's own).

---

## 1. Store Settings → Product Configuration

| Epic field | Required | Steam source | Shipmate today | Gap / action |
|---|---|---|---|---|
| Product display name | yes | `/game.name` | `formData.title` → preview title; localized names via `localizedStoreText` | covered |
| Short description (≤280 chars all languages; ~200 EN) | yes | `/game.summary` (Steam short_description, localized per `?lang=`) | `formData.description` / `webSite.localizedStoreText[lang].description`; Epic Localizations shows it | covered — **add Epic's 280-char limit** to `_steamLangHasOverLimitField`-style check for the Epic surface (Steam's limit is 300) |
| Genres (up to 3, Epic list) | yes | `/game.genres[]` ← Steam `genres[].description` | `webSite.genres` as one comma string, shown on preview | **translate**: Steam genre → Epic genre table; cap at 3; a `genres[]` field on `egsSubmitAnswers` |
| Features (Epic list) | yes | Steam `appdetails.categories[].description` — not in `/game` | not collected | **ingest + translate**: Single-player→Single Player, Multi-player/Online→Multiplayer, Co-op→Co-op, Full controller support→Controller Support, Steam Cloud→Cloud Saves, Steam Achievements→Achievements, Shared/Split Screen→Local Multiplayer… (verify Epic's list in the portal) |
| Product logo (960×540 PNG ≤1 MB) | yes | Steam `logo.png` (CDN, transparent, 640×360 for CotL) already pulled into the pool (v7.09) | pool has it; preview does not use it | **re-cut** to 960×540 (1.5× upscale + letterbox, keep alpha); validate PNG ≤1 MB |
| Supported languages — Text (required) / Audio | yes (text) | `/game.supportedLanguages[]` (Steam marks full-audio with `*` in appdetails; `/game` drops the marker) | `formData.localizations` + the Steam supported-language sync | covered for text; **audio** needs appdetails' `*` marker or a manual tick |
| Legal footer | yes | Steam `appdetails.legal_notice` — not in `/game` | `macFull…copyright` exists for Mac; nothing for Epic | **ingest** `legal_notice` → `egsSubmitAnswers.legalFooter`; fall back to Mac copyright |
| Privacy policy URL | recommended | — | collected for App Store (`privacyPolicyUrl`) | **reuse** |
| Terms of Use / EULA URL | if the game needs consent | — | none | field with "none" default |
| User support: URL or email (one required) | yes | `/game.supportUrl`, `/game.supportEmail` | `state.steamSupportUrl` / `steamSupportEmail` (App Store reuses) | **reuse** on the Epic card |
| Developer / Publisher | yes | `/game.developers[]`, `publishers[]` | `webSite.developer` / `publisher`; on preview + Localizations | covered |
| Product login (which logins are required) | yes | — (Steam games: none) | none | field, default "No login required" |
| Specifications — platforms (Windows / Mac) | yes | Steam `appdetails.platforms` | Shipmate knows the Steam build's platform from the Mac flow only | **ingest** `platforms` → which Epic platforms to enable |
| Specifications — min / recommended per platform (OS, CPU, RAM, GPU, storage, DirectX) | yes | Steam `pc_requirements.minimum/recommended`, `mac_requirements` (HTML with `<strong>Label:</strong> value`) | not collected; preview's `egs-spp-specs` block is empty | **ingest + parse** into labelled rows; show on card; editable |
| Social media links | optional | `/game.links[]` (name,url) — Steam lists official site + community | nothing | map website/community/discord links where present |
| Banner (beta / early access callout) | optional | — | none | skip |

## 2. Store Settings → Regions and Ratings

| Epic field | Required | Steam source | Shipmate today | Gap / action |
|---|---|---|---|---|
| IARC rating — via the **external IARC questionnaire** or an **existing IARC certificate ID / GRID** | yes, unless opting out ("unrated" — limited regions) | Steam has no IARC | shared IARC answers (`state.cqAnswers`), the rebuilt Content Rating step (v8.31–37) | **capture the Google Play IARC certificate ID** when the Play flow receives it, and present it on Epic as "Add existing IARC rating"; keep the answers as the pre-fill for the IARC site. **Epic's portal has no field for the answers themselves.** |
| Traditional ratings (ESRB, PEGI, USK, GRAC/KGRB, OFLC, DEJUS, IGRS…) — *must* be uploaded if they exist, with PDF | conditional | Steam `appdetails.ratings` object: for CotL — dejus 14 (+descriptors), kgrb 15, oflc m, usk 12, steam_germany 12, igrs 13 | not collected | **ingest** `ratings` → a "Ratings you already hold" list on the card, each needing the certificate PDF (developer upload) |
| Content descriptors / interactive elements | per rating | Steam `content_descriptors` (ids + notes: "Cartoon Violence"), `ratings.*.descriptors` | not collected | ingest; map Steam descriptor ids → IARC descriptor wording for the pre-fill |
| Distribution regions (IARC-gated: AU, BR, DE, ID, RU, SA, KR, TW) | yes | — | `egs_full` had distribution/excludedRegions/korea (removed from `egs` in v8.41) | decide where regions live on the four-step card; default "all regions the ratings allow" |

## 3. Offers (base product offer)

| Epic field | Required | Steam source | Shipmate today | Gap / action |
|---|---|---|---|---|
| Offer name | yes | `/game.name` | title | covered (same as product name) |
| Offer short description | yes | same as product short description | same | covered |
| Metadata (genres, features, dev/pub) — "Use Product Metadata" | yes | see §1 | see §1 | follows §1 |
| Price (Epic tier) / Free | yes | `/game.price` {currency,value}, `isFree`; `appdetails.price_overview` | buy box, `egsSubmitAnswers.price` default 'Free' (v8.41) | **pre-select the nearest tier from Steam's USD price**; free games stay Free |
| Dates: initial release date on another platform | if previously released | `/game.releaseDate.date`, `appdetails.release_date` | `webSite.releaseDate` | **map** — it is exactly this field |
| Dates: viewable date, available date type (specific / estimated / unknown), available date | yes | — | none on `egs` (was `releaseDate` on `egs_full`) | fields; default "available: specific = Steam release date if past" |
| Early Access product flag | yes (yes/no) | Steam `genres` includes "Early Access" when true | none | derive from Steam; FAQ page becomes mandatory when yes |
| NFT / blockchain disclosure | yes (yes/no) | — | none | default No |
| Offer images: general landscape 2560×1440 + portrait 1200×1600; library landscape + portrait | yes (both orientations) | Steam library hero (`library_hero.jpg`, 1920×620 on the hash-free URL), header 460×215, capsule 616×353, **library portrait `library_600x900_2x.jpg` = 600×900** (the un-suffixed URL is the 300×450 half) | pool has hero/header/capsule; nothing portrait | **pull `library_600x900_2x`**; neither Steam source reaches Epic's pixel sizes, so both slots are an **upscale + pad** (hero → 2560×1440 letterboxed; 600×900 → 1200×1600 at 2× with padding) — flag as "generated from Steam art, replace if you have the original" |
| Artifact: default install folder (alnum, starts with letter, ≤25) | yes | derive from title | none | derive, show, editable |
| Artifact: EAS application id | optional | — | none | skip |

## 4. Pages (product home page)

| Epic field | Required | Steam source | Shipmate today | Gap / action |
|---|---|---|---|---|
| Media carousel ≥1 asset: video MP4 1080p ≤300 MB (+ optional .vtt) and/or images 1920×1080 ≤4 MB | yes | `/game.movies[]` (dash/hls/mp4 variants), `/game.images[type=screenshot]` (Steam 1920×1080) | trailer → Assets (`uploads.steamTrailer`), screenshots in the pool; preview strip shows 5 | **order**: video first, then screenshots; validate 1920×1080; the Steam MP4 (`movie_max.mp4`) fits Epic's spec — needs a download path, not a URL |
| About section: ≥1 text block, ≤10,000 chars, up to 12 blocks text/image, images ≥700 wide | yes | `/game.description` (Steam about_the_game, HTML-ish) | `webSite.localizedStoreText[lang].aboutGame` (Steam's long description) | covered as text; **add the 10,000 limit**; optionally split Steam's inline images into image blocks |
| Additional images (≤20, 1920×1080 JPG ≤1 MB) | optional | remaining screenshots | pool | select "the rest"; convert PNG→JPG ≤1 MB |
| Social preview 1200×1200 JPG | optional | capsule / cover | pool | re-cut the cover square |
| FAQ page | mandatory for Early Access / blockchain | — | none | only when the flag is on |

## 5. Localize Store Presence

Epic: English required; 15+ languages supported; text and media both
localizable; recommended launch set EN/FR/DE/RU/ES. Shipmate already
translates and reviews the shared text per language, and Steam supplies
genuine localized prose for languages the game ships (`/game?lang=`). Covered;
the only Epic-specific pieces are the per-field limits (280 short, 10,000
about) and localized *media*, which is optional and should stay out of scope.

## 6. Artifacts & Binaries (Upload Build)

BuildPatch Tool upload to the offer's artifact, set the binary active, choose
update type (bugfix / minor / major), content notes for major updates. No
Steam source and no Shipmate automation today — the Epic twin of the Mac agent.
**Out of scope for this pass**; "Upload Build" stays a manual step with Epic's
instructions.

---

## What Steam gives us that we are not asking for

`/game` returns 18 fields. Steam's `appdetails` has everything in `/game` plus
these, all useful above: `categories` (features), `ratings` (existing
traditional ratings + descriptors), `content_descriptors`, `pc_requirements` /
`mac_requirements` / `linux_requirements`, `legal_notice`, `platforms`,
`controller_support`, `required_age`, `price_overview`, `metacritic`, `dlc[]`,
`background` art, and `supported_languages` with the audio marker. The browser
cannot call `appdetails` directly (no CORS — the old proxy path was removed),
so the clean move is **extending `/game` to pass these through** rather than
re-adding a proxy. On the CDN, `library_600x900_2x.jpg` (600×900, Epic's portrait) and
`logo.png` (640×360 transparent) are stable, hash-free URLs like the hero we
already load — checked live; the un-suffixed sizes are half-resolution.

## Suggested order of work

1. **Backend: `/game` passthrough** of `categories`, `ratings`,
   `content_descriptors`, `pc_requirements`, `mac_requirements`,
   `legal_notice`, `platforms`, `controller_support`, `price_overview`.
   (Whoever owns `search.dev.shipmate.gg`.)
2. **Translation tables** in `state.js`: Steam genre → Epic genre (cap 3),
   Steam category → Epic feature, Steam rating board → Epic rating authority,
   Steam descriptor id → IARC descriptor. Data, not UI — safe alongside the
   colleague's render work.
3. **Ingest** in `_applySteamAboutData`: the new fields into
   `egsSubmitAnswers` (genres, features, legalFooter, specs, heldRatings,
   platforms) and the two missing CDN images into the pool.
4. **Art mapping + re-cut** for Epic's six slots (reuse the Mac icon
   re-cut machinery).
5. **Card fields** on `egs` — after agreeing with the colleague where they
   go on a four-step card: Specs and Legal probably on Store Page Preview
   (the blocks exist), Features/Genres as pills on the preview, ratings held +
   IARC certificate ID on Content Rating, offer dates/price/login on the buy
   box.
6. **Google Play → Epic IARC certificate ID** hand-off, once the Play flow
   surfaces the certificate.

## Verify in the portal (things the docs do not state)

- Epic's exact Genre and Feature lists (the docs say "select from the list").
- Whether Short Description is per-offer or per-product on the four-step card
  (docs show it in both places; "Use Product Metadata" copies it).
- Whether a Steam `movie_max.mp4` passes Epic's audio spec (AAC stereo 48 kHz
  320 kbps) without re-encoding.
