# Shipmate — Design Audit & Unification Plan

Audit of the existing prototype (v2.33) against the newly-attached `design-system/` tokens,
plus a plan to unify splash + app into one continuous experience with persistent chrome.

---

## Part 1 — Headline finding

The design system was reverse-engineered *from* the prototype, but the prototype does not
yet *consume* it. `style.css` (7,926 lines) references the tokens almost nowhere:

| Token family | `var()` uses in style.css |
|---|---|
| Font size `--fs-*` | 0 |
| Spacing `--space-*` / `--pad-*` | 0 |
| Radius `--r-*` | 0 |
| Weight / letter-spacing / line-height | 0 |
| Motion `--dur-*` / `--ease-*` | 0 |
| Elevation `--shadow-*` / `--glow-*` / `--ring-*` | 0 |
| Font family `--font-*` | 1 |
| Color | partial — via a *duplicate* `:root`, not the token files |

So the tokens are currently dead code. Unification = pointing the prototype at the one
source of truth, then fixing the drift that swap exposes.

---

## Part 2 — Colour

`style.css` redeclares its own `:root` (lines 6–40), a 34-variable subset. Most values
match the tokens exactly (safe to delete and inherit), but there are real conflicts:

**The Shipmate-tip colour is a three-way contradiction — the single most important fix.**
The design system rules (colors.css 64–69) say Shipmate's own voice — tips, inferred
answers — is **purple**, and orange means only "you still need to answer this." But today:

- `style.css` `:root` (lines 32–34) defines the tip as **orange**.
- The actual rules hardcode **green** fallbacks (`.sw-tip-icon`, `.sw-tip-box`, lines 1244–1245 / 1279–1280); the section comment at line 1113 even calls it a "Green informational box."

So the same concept renders orange-or-green and must become purple.

**Other divergences and drift:**

- **Brand-green bug** (lines 7477, 7606, 7609, 7618): `var(--green, #2FDC80)` names the *signal* green `#4ade80` while intending *brand* green `#2FDC80`, so the Shipmate-Fix button renders the wrong green.
- **157 hex + 176 rgba literals** used directly. ~45 hex are exact token matches (mechanical `var()` swap). A dangerous set are near-duplicates — visually identical, so they silently resist unification: `#f5f5f7`×9 (vs `--text #f5f5f5`), `#1c1c1e`×4 (vs `--panel-2`), `#3a3a3c`×3 (vs `--border-hover`), `#ff3b78`×3 (vs `--magenta #ff3b76`), `#2a2a2e`×2 (vs `--border`).
- **Too many of each colour for one idea:** 9 distinct greens, 6 blues, 5 reds/magentas in use. Success/affirmative is variously `#4ade80`, `#2fdc80`, `#30d158`, `#22c55e`. `#ff3b78` (drift) is used *more* than the correct `#ff3b76`.
- **A parallel untokenized "store-chrome" palette** (~50 uses) mimics iOS/Android store previews — Apple blue `#0a84ff`×14, grays `#2c2c2e`×12, Apple green `#30d158`. This may be intentional native mimicry; it needs a product decision (bless as `--store-*` tokens vs replace).

---

## Part 3 — Type, spacing, motion, elevation

All hardcoded; each maps cleanly to tokens for the bulk of uses, with an off-scale tail
that needs a ruling (adopt as token or eliminate):

- **Font size:** 407 literals, 0 tokenized. ~380 map 1:1 (`12px`→`--fs-small`, etc.). Off-scale: `9px`×18, `16px`×9, plus one-offs.
- **Font family:** three *different* JetBrains-Mono stacks in use, plus off-brand `-apple-system` / `SF Mono` faces that aren't in any token.
- **Weight:** clean 1:1 map (`600`×85, `700`×66, `500`×43…), 0 tokenized.
- **Letter-spacing / line-height:** exact matches tokenized at 0; notable off-scale drift — `0.06em`×17 and `1.5`×26 are the *most common* values yet have no token.
- **Radius:** on-scale for the bulk; drift at `20px`×7 (near `--r-mk-card 22px`).
- **Motion:** durations & easings are exact token values, just never referenced (`0.15s`×83 = `--dur-base`, `cubic-bezier(0.4,0,0.2,1)`×7 = `--ease-standard`).
- **Elevation:** several shadows are byte-for-byte token values (`0 24px 80px rgba(0,0,0,0.6)` = `--shadow-modal`); a few bespoke drift shadows should collapse into the tokens.

---

## Part 4 — Splash + app are two separate worlds

Today the splash is a **standalone page loaded in an `<iframe>`** (index.html 130–137, z-index 9999) that overlays the whole app. Consequences:

- **The header is built twice and differently.** The app's `.topbar` (index.html 96–128) has logo + Sign In + language picker + profile. The splash's `<header>` (splash.html 441–446) has logo + a bare Sign In only — no language picker, no profile. While the splash iframe is up, the app topbar is hidden beneath it, so the two never reconcile.
- **The footer only exists on the splash.** "Built by indie devs and game industry veterans to empower the indie game community." lives only in splash.html (1035–1037). The app has no footer.
- **Two version badges.** Splash `#splash-version-badge` (v2.33) and the app `.build-badge` (v2.33) are separate elements.
- **The splash has its own `:root` and a `zoom: 0.78` canvas-scaling model** (splash.html 11–21, 35, plus a `fitZoom()` resize handler) that the app doesn't use — so shared chrome can't simply straddle both as-is.

The logo is the one thing already shared (both use `Assets/Shipmate_Logo.png` via `.topbar-logo`).

**Net:** to get the experience you described — splash first, click through to onboarding, one header (logo left; language picker + Sign In / username right) and one footer (tagline + version) persistent throughout — the cleanest path is to **retire the iframe** and make the splash a section inside `index.html`, so a single header and footer in the app shell persist across every state (splash → onboarding → dashboard). The alternative (keeping the iframe and syncing duplicated chrome) is more fragile and keeps the `zoom` mismatch.

---

## Part 5 — Recommended plan

**A. Persistent chrome (the structural win)**
1. Move the splash's hero / card-pill / Shippy / CTA / platform-row into `index.html` as a `#splash` section; drop the iframe. Reconcile the `zoom` scaling into that section only.
2. Build one `<header>` component: logo (left) · language picker + Sign In / username (right). Persist across all states; the right cluster swaps Sign In → username once signed in.
3. Build one `<footer>`: "Built by indie devs…" tagline + version number. Persist across all states. Collapse the two version badges into it.
4. Single source for the version string so it updates in one place.

**B. Token unification (the consistency win)**
5. Import the six token files (via `styles.css`) and delete `style.css`'s duplicate `:root`.
6. Fix the two real bugs first: Shipmate-tip → purple; `--green` → `--green-brand` on the Fix button.
7. Mechanical `var()` swaps for exact-match colour, type, motion, elevation.
8. Collapse near-duplicate drift colours and the extra greens/blues/reds onto tokens.
9. Rule on the off-scale tail (`0.06em`, `1.5`, `9px`, `16px`, store-chrome palette): adopt as new tokens or eliminate.

**C. Verify**
10. Serve locally (`python3 -m http.server 8080`), click splash → onboarding → dashboard → submit, and screenshot each state to confirm no visual regressions.

Versioning note: the live prototype is at **v2.33** (CLAUDE.md still says v2.27 — stale). Any change here bumps to the next version across index.html + splash.html per the repo rule.
