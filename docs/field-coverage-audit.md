> **Update (v7.65, Oct 1):** most gaps below are now closed — see
> "## Implemented in v7.65" at the bottom. The matrix is left as the original
> audit for reference; read the Implemented section for current state.

# Shipmate → App Store Connect field-coverage audit

_Overnight audit (Oct 1, 2026). Scope: the Steam → Mac App Store flow (`macos`,
with notes on `macos_full` and `ios`). Goal Mark set: "ensure we have all fields
going from Shipmate into a compatible submission in ASC" before expanding
engines._

Nothing in the code was changed to produce this. It's a map of three things and
the gaps between them:

1. **Collect** — what Shipmate gathers (state model).
2. **Send** — what `upf.js buildListing()` / `achievementsForBuild()` actually
   put on the wire to the agent's `/populate`, `/prepare`, `/gcsync`.
3. **Write** — what the agent (`upf-mas`) PATCHes/POSTs to App Store Connect.

A field is only truly covered when all three line up. The surprise from the
audit is that the **bridge (`buildListing`) is the narrowest point** — Shipmate
collects far more than it sends, and the agent can write more than it's given.

---

## Executive summary

**Covered end to end (collect → send → write):** app name, subtitle,
description, support URL, privacy-policy URL, "what's new", primary category
(hardcoded GAMES), the Apple age-rating declaration, the app-privacy /
data-collection disclosures, the build binary itself, and Game Center
achievements (name + localized text, synced after upload).

**The big gaps, in priority order:**

- **P0 — Localizations never leave Shipmate.** `buildListing` hardcodes
  `locale: 'en-US'` and sends only the primary-language copy. Everything in
  `formData.localizedStoreText` / `macAppStoreListing.localizedStoreText` /
  `macFull…` and the whole `localizations[]` list is collected, translated
  (often by AI), and then dropped. A multi-language store listing is impossible
  through this path today.
- **P0 — No screenshots/media reach the listing.** `buildListing` deliberately
  omits screenshots (browser data-URLs vs. the files the agent needs). The
  agent *can* upload screenshots from file paths (`appScreenshotSets` /
  `appScreenshots`), but Shipmate never hands it any. So the ASC listing has no
  media. Same for app-preview video (trailer collected, never uploaded).
- **P1 — Keywords, promotional text, marketing URL, secondary category are
  collected but never sent.** `macos_full` gathers keywords, promotional text,
  marketing URL, copyright, secondary category and subcategories; `buildListing`
  includes none of them (`marketingUrl` is even hardcoded to `undefined`), and
  for the `macos` (non-Full) flow Shipmate doesn't collect keywords/promo at
  all. The agent's `/populate` contract already accepts every one of these.
- **P1 — Pricing, availability, and in-app purchases aren't submitted at all.**
  Shipmate collects price, per-country availability, IAP products and
  subscription groups; neither `buildListing` nor the agent touches any ASC
  pricing/IAP endpoint. (ASC often treats price/availability as a separate
  surface, so this may be acceptable for a first pass — but it's a true gap.)
- **P2 — Copyright, export-compliance ERN, Game Center leaderboards/multiplayer,
  achievement images, App Review details and release options** are collected
  (mostly on `macos_full`) but not sent/written. Most only matter for a full
  App Store *review* submission, which is deliberately out of scope (internal
  TestFlight only), so these are correctly deferred — listed here so nothing is
  lost track of.

**To verify at runtime (inferred, not proven):** that `_ageRating` emits every
one of Apple's 13 intensity + 11 boolean declaration keys; that `_privacy`'s
category/purpose ids are all valid Apple vocabulary; and that the
export-compliance answer actually reaches the build's
`ITSAppUsesNonExemptEncryption` plist key (see §4).

---

## Coverage matrix

Legend: ✅ covered · ⚠️ partial · ❌ collected but not sent · ➖ not collected ·
🔒 deliberately out of scope.

### Listing text & URLs

| Field | Collect (Shipmate) | Send (`buildListing`) | Write (agent → ASC) | Status |
|---|---|---|---|---|
| App name / title | `formData.title` | `name` | `appInfoLocalizations.name` (≤30) | ✅ |
| Subtitle | `formData.subtitle` | `subtitle` | `appInfoLocalizations.subtitle` (≤30) | ✅ |
| Description | `formData.description` | `description` | `appStoreVersionLocalizations.description` (≤4000) | ✅ |
| What's New | `formData.releaseNotes` | `whatsNew` | `…whatsNew` (≤4000; often rejected on v1) | ⚠️ written but frequently dropped by Apple on a first version |
| Support URL | `formData.supportUrl` | `supportUrl` | `…supportUrl` | ✅ |
| Privacy-policy URL | `formData.privacyUrl` / per-platform answer | `privacyPolicyUrl` | `appInfoLocalizations.privacyPolicyUrl` | ✅ |
| Marketing URL | `macFull…marketingUrl` (+ Steam import) | **`undefined` (hardcoded)** | `…marketingUrl` (accepted) | ❌ never sent |
| Keywords | `macFull…keywords` | — | `…keywords` (≤100, accepted) | ❌ never sent; ➖ not collected for `macos`/`ios` |
| Promotional text | `macFull…promotionalText` | — | `…promotionalText` (≤170, accepted) | ❌ never sent; ➖ not collected for `macos`/`ios` |
| Copyright | `macFull…copyright` | — | plist `NSHumanReadableCopyright` (from build default, not Shipmate); ASC `copyright` never set | ❌ Shipmate's value isn't used |

### Language

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Primary language | `formData.primaryLanguage` | **hardcoded `'en-US'`** | localization locale | ⚠️ ignored — always en-US |
| Additional localizations | `formData.localizations[]`, `localizedStoreText[lang]`, per-store `localizedStoreText`, AI translations | — | agent writes one locale per call; Shipmate sends one | ❌ **P0** no localized listings reach ASC |
| `appInfos.primaryLocale` | ➖ | — | never set | ⚠️ minor |

### Category

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Primary category | ➖ (assumed Games) | `'GAMES'` (hardcoded) | `appInfos` primaryCategory rel | ✅ (fixed value) |
| Secondary category | `macFull…category.secondary` | — | secondaryCategory rel (accepted) | ❌ never sent |
| Subcategories | `macFull…category.subcategory1/2` | — | not in contract | ❌ / ➖ |

### Age rating (Apple `ageRatingDeclaration`)

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Intensity questions (13) | `iosSubmitAnswers.*` (shared ios↔macos), AI + dev | `ageRating` via `_ageRating(pid)` | `ageRatingDeclarations` PATCH (`_full_age_rating` fills all keys + overlays) | ✅ **verify `_ageRating` emits all 13 keys** |
| Yes/No questions (11) | `iosSubmitAnswers.*` | `ageRating` | same | ✅ **verify all 11 keys** |
| Kids age band / overrides | `ageCategory`, `kidsAgeRange`, `overrideRating` | via `_ageRating` (`kidsAgeBand`) | passed through | ⚠️ verify override mapping |
| Age-suitability URL | `ageSuitabilityUrl` | — | no ASC field for it | ➖ n/a |

### App privacy / data collection

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Collects-data flag | `iosSubmitAnswers.collectsData` | `privacy.collected` | `DATA_NOT_COLLECTED` row when false | ✅ |
| Per-type usage (type, purposes, identity-linked, tracking) | `iosSubmitAnswers.dataPerType` | `privacy.items[]` via `_privacy(pid)` | `appDataUsages` (category + purposes + dataProtection; tracking → extra row) | ✅ **verify category/purpose ids are valid Apple vocabulary** |
| Publish vs. stage | — | `publish:false` (always) | `appDataUsagesPublishStates` only if publish truthy | ⚠️ always staged, never auto-published (deliberate, correct) |

### Media & build

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Screenshots (per device, cropped) | `platformScreenshots[pid]`, `uploads.screenshots` | **omitted** (data-URLs, not files) | `appScreenshotSets`/`appScreenshots` (agent supports it) | ❌ **P0** none reach ASC |
| App preview / trailer | `uploads.trailer`, `formData.trailerUrl` | — | not written | ❌ |
| App icon | `uploads.appIcon` | — | from `.icns` in the bundle at build time | ✅ (via binary, not ASC) |
| Build binary | `platformBuilds[pid]` (the real .pkg from the agent) | `/prepare` → `.pkg` | `buildUploads`/`buildUploadFiles` | ✅ |

### Pricing / business / IAP

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Base price | `iosSubmitAnswers.price`, `formData.price` | — | no ASC pricing write | ❌ **P1** |
| Availability / countries | `selectedCountries`, `distPreset`, `macFull…availability` | — | — | ❌ **P1** |
| In-app purchases | `iapProducts[]` | — | — | ❌ **P1** |
| Subscription groups | `macFull…subscriptionGroups[]` | — | — | ❌ **P1** |
| Tax category | `taxCategory` (default games) | — | — | ❌ minor |

### Export compliance

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Uses encryption / exempt | `iosSubmitAnswers.usesEncryption`, `encryptionExempt` | via `/prepare` `target` (see §4) | plist `ITSAppUsesNonExemptEncryption` | ⚠️ **verify the answer reaches `target.usesNonExemptEncryption`** |
| ERN (has / number) | `hasERN`, `ernNumber` | — | — | ❌ not used |

### Game Center

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Achievements (name, points, hidden, localized text) | `*GameCenterAchievements[]` | `achievementsForBuild(pid)` → `/gcsync` (after upload) | `gameCenterAchievements` + localizations + releases | ✅ |
| Achievement images | `a.image` | — | agent has `upload_achievement_image` but it's **never called** | ❌ artwork not pushed |
| Leaderboards | `macFull…gameCenter.leaderboards[]` | — | not written | ❌ |
| Multiplayer | `macFull…gameCenter.multiplayer` | — | not written | ❌ |

### App Review & release (full App Store submission)

| Field | Collect | Send | Write | Status |
|---|---|---|---|---|
| Review contact / demo account / notes / attachment | `macFull…reviewContact/demoAccount/reviewNotes` | — | `appStoreReviewDetails` never written | 🔒 out of scope (TestFlight-only) |
| Release option (auto/manual/scheduled), phased | `macFull…releaseOption` etc. | — | `releaseType` never written | 🔒 |
| App Store version submission | — | — | `appStoreVersionSubmissions` never created | 🔒 production deliberately staged, not submitted |

---

## Prioritized fixes

**P0 — needed for a listing a human would call "complete":**

1. **Send screenshots.** The agent uploads from file paths; Shipmate has pixels
   in the browser. Options: (a) have the agent pull screenshots it already has
   on disk (the inspected bundle / a Shipmate-written temp dir), or (b) POST the
   images to a new agent endpoint that writes them to the project dir, then pass
   the paths in `listing.screenshots`. Needs a small agent addition — flag for
   Mark, since it crosses the browser/file boundary.
2. **Send localizations.** `buildListing` should emit one listing per selected
   language (or the agent's `/populate` should accept a `localizations` map) and
   stop hardcoding `en-US` — read `formData.primaryLanguage` and iterate
   `localizedStoreText`. Frontend-only on Shipmate's side if the contract grows
   a localizations array; otherwise call `/populate` once per locale.

**P1 — cheap wins, frontend-only (the contract already accepts them):**

3. In `buildListing`, stop hardcoding `marketingUrl: undefined`; send
   `macFull…marketingUrl` (and the Steam-imported site) where available.
4. Add `keywords`, `promotionalText`, `secondaryCategory` to `buildListing`
   from `macFull…` (and collect keywords/promo for the `macos` flow, which has
   no field today).
5. Decide on pricing/availability/IAP: either wire ASC pricing endpoints in the
   agent + send from Shipmate, or explicitly scope them as "set on the ASC
   website" and say so in the Game Build flow. (A decision for Mark.)

**P2 — defer with the production-submission work:** copyright → ASC
`copyright`, ERN, Game Center leaderboards/multiplayer, achievement images,
App Review details, release options. These pair naturally with wiring the
actual App Store (production) submission, which is intentionally not built yet.

---

## Scope notes (correct as-is)

- **App record creation** stays manual — Apple's API forbids it; the agent
  stops and links out. (Matches the Game Build "Create your app in App Store
  Connect" user step.)
- **Production + external-TestFlight submission** are deliberately staged, not
  sent. Only internal TestFlight writes. So everything tagged 🔒 above is
  expected to be absent until that work is scoped.
- **App privacy is staged, never auto-published** — right call; it's a public,
  semi-permanent declaration.

---

## Verify list (quick runtime checks for the morning)

1. `_ageRating(pid)` output vs. Apple's 24 declaration keys — does every
   intensity + boolean key come through, and are override/kids-band values
   mapped? (upf.js ~133.)
2. `_privacy(pid)` category ids (`USER_ID`, etc.) and purpose ids
   (`ANALYTICS`, `APP_FUNCTIONALITY`, …) — all in Apple's live reference lists?
   The agent silently drops ids it can't resolve. (upf.js ~169.)
3. Export compliance: trace `iosSubmitAnswers.usesEncryption/encryptionExempt`
   → `/prepare` `target.usesNonExemptEncryption` → plist. If it doesn't flow, a
   build can land in "Missing Compliance." (upf.js `upfBuild` target; agent
   `prepare.py:363`.)
</content>
</invoke>

---

## Implemented in v7.65

Done (frontend `upf.js`, live on reload):

- **Localizations** — `buildListing(pid, lang, appLevel)` is per-locale; `_syncNow`
  pushes the primary language + every added localization, reading each store's
  `localizedStoreText`. New `_ascLocale()` maps Shipmate codes → ASC locales
  (unmapped skipped). No longer hardcodes `en-US`.
- **Screenshots** — `_screenshots(pid)` sends the ordered selected shots (data:
  URLs → base64, remote → URL), cap 10, `APP_DESKTOP`, change-hash guarded so
  debounced saves don't duplicate.
- **Keywords, promotional text, marketing URL, secondary category, copyright**
  (`macos_full`) — now included in the listing; secondary category display label
  mapped to an ASC id.

Done (agent `upf-mas`, needs `serve` restart):

- `populate.py` accepts screenshot items as `{data}` / `{url}` / path
  (`_materialize_shot`); copyright written to the app-store version
  (`asc.patch_app_store_version`).

Still open (unchanged from above — need a decision or a separate ASC surface):

- **Pricing / availability / in-app purchases / subscriptions** — no ASC pricing
  or IAP endpoints wired; a dedicated pass + a decision on scope.
- **Game Center leaderboards & multiplayer**, **achievement images** — agent
  only handles achievement text today.
- **Production submission** (review details, release options,
  `appStoreVersionSubmissions`) — intentionally out of scope; internal TestFlight
  only.

Not yet verified end to end (no Mac/ASC in the dev env): the locale mapping, the
screenshot materialize/upload path, the secondary-category id transform, and the
copyright PATCH — all code-complete and syntax-checked, not run.
