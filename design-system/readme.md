# Shipmate Design System

Shipmate helps game developers submit to any platform's portal by consolidating
seven storefront workflows into one. A developer enters their game once — binary,
description, screenshots, compliance answers — and Shipmate turns that into a
per-store checklist, pre-filling routine fields and flagging rejection risks before
the platform does.

The product's own line: **"Everything you need to ship."**

## Sources this system was built from

| Source | Location | What was taken from it |
|---|---|---|
| Shipmate prototype (codebase) | mounted locally as `Shipmate Prototype/` | Colours, type, spacing, component anatomy, app screens |
| Shipmate prototype (repo) | <https://github.com/mtgrimm17/shipmate-prototype> | Same tree, branch `main` — see `github.md` |
| `style.css` (7,927 lines) | prototype root | Every token value in `tokens/` |
| `splash.html` | prototype root | Marketing page, Shippy layers, marketing icons |
| `render.js`, `index.html`, `locales/en.json` | prototype root | Screen structure, component markup, product copy |

The prototype is a static HTML/CSS/JS app with no build step. Its `style.css` has a
`CANONICAL UI COMPONENTS` block near the top listing the reusable pieces by name —
that block defined this system's component inventory. **Read the repository directly
when you need more than this system carries**: the store-page preview flip, the
privacy matrix, the launch timeline and the screenshot cropper all live there.

## Products

1. **Shipmate app** — the signed-in dashboard. Onboarding modal, one card per
   storefront, per-step questionnaire editors, submit with release-track selection.
   Recreated in `ui_kits/app/`.
2. **Shipmate splash** — the marketing landing page that loads before sign-in.
   Recreated in `ui_kits/marketing/`.

Both share `styles.css`. They diverge in one place: the app sits on `#0a0a0a` and
sets everything in JetBrains Mono; the splash sits on pure black and leads with
very large Inter.

---

## Content fundamentals

**Voice: informed, trustworthy, approachable.** Shipmate knows more about platform
policy than the developer does, and never makes them feel it.

**Second person, present tense, active.** The product addresses "you" and refers to
itself as "we" only when it is about to do something on the developer's behalf.

> "Let's get your game ready"
> "We'll collect the essentials once — then you focus on each platform."
> "Where do you intend to make the game available?"
> "Add your binary, description and screenshots a single time — no per-store re-entry."

**Sentence case everywhere except micro-labels.** Titles, buttons and menu items are
sentence case ("New release", "Delete anyway", "Choose Track"). Only 10px structural
labels go uppercase, and they get letter-spacing to compensate.

**Copy is short and load-bearing.** Empty states are two lines: a statement and the
next action. "No platforms activated yet" / "Activate a platform below to start your
submission checklist." No paragraph explains what the product is once you are inside it.

**Arrows carry direction, not decoration.** `←` on back, `→` on forward and submit:
"← Back", "Next →", "Launch Dashboard →", "Submit →", "Create release →".

**Destructive copy is specific about consequence, not scary.** "This is the only
release for this project. Create a new release first, then delete this one."
"…this won't unpublish anything already live."

**Em dashes join a statement to its consequence.** Used sparingly and always with
spaces: "We'll collect the essentials once — then you focus on each platform."

**AI is disclosed, never hidden.** Inferred answers get a ✦ badge and drop to 50%
opacity; a permanent footer reads "Please review all inferred answers before
submitting". Shipmate says what it did and hands the decision back.

**No emoji.** Not in the app, not in the marketing page, not in the logo. Flags
appear in the language picker as regional glyphs; a ✦ and a `!` appear inside
17px circles. That is the whole glyph vocabulary outside the icon set.

**Platform names are always the storefront's own name** — "App Store", "Google Play",
"Steam Store", "Epic Games Store", "PlayStation Store", "Xbox Store", "Nintendo eShop".
Never "iOS", never "Switch".

---

## Visual foundations

### Colour

A dark terminal stack — `#0a0a0a` canvas, `#141414` panels, `#1c1c1c` insets,
`#242424` chips, `#2a2a2a` hairlines — with saturated colour used only where it
carries meaning. Three greys (`#f5f5f5` / `#a0a0a0` / `#555`) do all of the type
hierarchy.

The signal system is strict and worth memorising:

- **Purple** `#9F68F0` = **Shipmate itself.** Anything the product did on the
  developer's behalf wears purple: AI-inferred answers, the pre-answer banner, tips,
  the "ShipMate Suggestion" panel, the Fix it button, and Shippy. As of the 2026
  unification this is the brand's primary accent.
- **Green** `#4ade80` = done. Brand green `#2FDC80` = ship (the CTA, build pills, the
  ready-to-submit card border).
- **Orange** `#fb923c` = you still need to answer this. Since purple took over tips,
  orange means only "unanswered".
- **Magenta** `#FF3B76` = rejection risk, or destructive.
- **Blue** `#60a5fa` = selected. Never good, never bad. Both YES and NO turn blue.
  `#0099F8` is the separate outbound-link blue on partner and documentation links.

**Impact bars** are the exception to everything above: the Improve Your Submission
action cards carry a saturated full-width header — red `#EB3B3B` (rejection), orange
`#D05017` (costs reach), yellow `#ECBE49` (optional), green `#92FE85` (resolved).
These are the only large blocks of pure colour in the product.

Two background colours per surface at most. No gradients anywhere except the
periwinkle radial bloom behind Shippy on the splash and a 90° shimmer on loading
placeholders.

### Type

`JetBrains Mono` is the app's **body face** — the terminal feel is the baseline, not
an accent. `Inter` is reserved for headlines, modal titles and the wordmark.
`IBM Plex Mono` is the marketing display face, always uppercase with `0.02em`.

The app scale runs 10 → 20px and stops. Structure comes from 10px uppercase labels
at `0.08–0.12em`, not from size jumps. Marketing runs an order of magnitude larger:
118px hero, 48.2px sub-line at 300 weight in white-at-50%.

### Layout

Dashboard is `max-width: 1100px`, centred, `28px 32px 80px` padding. Platform cards
grid at `repeat(auto-fill, minmax(320px, 1fr))` with a 16px gap. Modals are 640px
(step and onboarding) or 460px (confirm). Forms cap at 600px.

The topbar is the only fixed element and sits at `z-index: 200` — above modals, so
the logo never disappears behind a scrim. A build badge and an AI disclaimer sit
pinned at the bottom corners.

### Spacing

2px resolution, not a 4/8 grid. 5, 7, 9, 11 and 18 all appear deliberately — copy
exact values from `tokens/spacing.css` rather than rounding.

### Corners, borders and cards

Radii climb with surface size: 4–8px on controls, 10–12px on cards and dropdowns,
14px on modals, 999px on buttons and status pills. Marketing breaks the scale
entirely with 22px cards inside a 48px pill.

**A card is a hairline, a fill and a radius — no shadow.** `--panel` background,
1px `--border`, 12px radius. Hover lifts the border to `--border-hover`; nothing
moves. When every step is done the border turns brand-green with a 1px ring. There
are no left-accent-border cards in Shipmate.

Pills and dropzones use a **1.5px** border, not 1px — the heavier stroke is what
distinguishes an interactive outline from a structural hairline.

### Shadows and elevation

Sparse and layered by function: `0 6px 24px / .35` picklist, `0 10px 30px / .5`
dropdown, `0 24px 80px / .6` modal. Resting surfaces get none. Emphasis is expressed
as a **glow**, not a shadow — `0 0 30px 4px rgba(47,220,128,.22)` under the CTA.

### Transparency and blur

Blur appears exactly once: the modal scrim, `rgba(0,0,0,0.75)` with `blur(4px)`.
Everywhere else transparency is a flat white veil — 3% for a resting well, 6% for a
hover, 10% for the marketing card hover.

### Animation

Short, unshowy, colour-only. 0.12s row hover, 0.15s default control, 0.2s toggle
knob, 0.25s modal entrance and field validation, 0.6s progress fill. Easings:
`cubic-bezier(.2,.8,.2,1)` for the modal, `(.4,0,.2,1)` for anything travelling a
distance, `(.34,1.16,.64,1)` only for the onboarding tab progress fill — the one
overshoot in the product.

**Hover changes colour and border. Press changes nothing.** No scale, no translate,
no shrink — the sole exception is the marketing CTA, which lifts 2px. The only
celebratory motion is the platform card's 3D flip after a successful submit
(160ms out, 300ms in).

Shippy floats ±6px over 4.2s; his tentacles each sway 2.4° on their own 5–7s cycle
and phase, so the rig never syncs up.

### Imagery

There is no photography and there are no illustrations beyond Shippy. The visual
interest comes from real storefront logos, the mono type and the dark stack. When a
design needs an image, use a labelled placeholder rather than inventing one.

---

## Iconography

**Three sources, in this order of preference.**

1. **Storefront logos** — real marks, lifted from the prototype. The source splits
   them two ways and so does this system: **iOS, Google Play and Steam** are inline
   24×24 paths in `currentColor`; **PlayStation, Xbox and Nintendo** are transparent
   PNGs in `assets/platforms/` whitened with `filter: brightness(0) invert(1)`. Do
   not apply that filter to the first three — their source PNGs are opaque and would
   render as solid white squares. 28px inside a 40px `--panel-3` well on card
   headers, or 14–18px bare. **Never redraw these.** Use the `PlatformIcon` component.
2. **Inline stroke SVGs**, drawn in the markup at 16px with `stroke-width: 1.8`
   (navigation) or `2` (actions), `stroke-linecap: round`, `fill: none`,
   `currentColor`. The globe, pencil, trash, chevron and 3-dot glyphs are all this.
   There is no icon font and no icon library — the prototype hand-writes each SVG.
   For new glyphs, match that spec; **Lucide** is the closest CDN set if you need
   volume (1.8–2px round-cap stroke, 24px box) — flag any substitution.
3. **Product illustration icons** — four 18px PNGs for the onboarding tabs
   (`assets/icons/icon-about|distribution|assets|compliance.png`) and three 86px
   dot-grid SVGs for the marketing cards (`assets/icons/mk-*.svg`), lifted verbatim.

**Unicode is used as iconography in three places and nowhere else:** `⌄` for a
dropdown chevron, `›` for a row affordance, `✦` for an AI-inferred answer. Plus `←`
and `→` in button copy. Regional-indicator flag glyphs appear in the language picker.

**No emoji.**

---

## Index

```
styles.css                  Global entry point — @import lines only
thumbnail.html              Design-system tile
readme.md / SKILL.md        This guide; Agent Skills wrapper
github.md                   Upstream source association

tokens/                     colors · typography · spacing · elevation · motion · fonts
guidelines/                 18 foundation specimen cards (Colors, Type, Spacing,
                            Elevation, Motion, Brand)
assets/
  logos/                    shipmate-logo.png (lockup), logo-mark.png (white wordmark)
  brand/                    Shippy — current mascot, clinging pose, and legacy/ layers
  platforms/                PlayStation, Xbox, Nintendo PNGs (the other three
                            marks are inline paths inside PlatformIcon.jsx)
  icons/                    Onboarding tab PNGs; marketing SVGs (mk-*)
components/                 See below
ui_kits/app/                Click-through Shipmate dashboard
ui_kits/marketing/          Splash / landing page
templates/app-screen/       Starting point — app shell + dashboard grid
templates/marketing-page/   Starting point — splash / landing page
```

### Components

Grouped by concern; every one has a sibling `.d.ts` contract and `.prompt.md` usage note.

**`components/core/`** — `Button`, `CtaButton`, `IconButton`, `Toggle`, `ChipButton`,
`YesNoButton`, `Pill`, `StatusPill`

**`components/forms/`** — `FormLabel`, `Input`, `Dropzone`, `TooltipIcon`

**`components/feedback/`** — `TipBox`, `AlertBox`, `Spinner`, `Shimmer`

**`components/surfaces/`** — `Card` (with `CardHeader`, `CardSection`),
`Modal` (with `ModalScrim`, `ModalHeader`, `ModalBody`, `ModalFooter`),
`Menu` (with `MenuItem`)

**`components/progress/`** — `ProgressBar`, `StepRow`, `TaskRow`, `StepDots`

**`components/brand/`** — `Wordmark`, `Shippy`, `PlatformIcon` (plus the `PLATFORMS`
id → label map)

**`components/submission/`** — `ActionCard` (with `ActionCardSection`,
`SuggestionCompare`), `InsightPanel` (with `InsightSection`, `FixItButton`),
`PartnerCard`, `NoticeBanner`, `CodeBlock` — the Improve Your Submission surface

### Intentional additions

- **`CtaButton`** — the splash's green slab is styled inline in `splash.html` rather
  than as a shared class. Promoted to a component because it is the brand's single
  most recognisable control.
- **`Spinner` / `Shimmer`** — defined in the prototype as loose keyframes
  (`ob-spin`, `build-proc-rotate`, `shimmer`). Wrapped so loading states stay consistent.
- **`Wordmark` / `Shippy` / `PlatformIcon`** — asset wrappers, so no design ever
  hand-rolls a brand mark.

Nothing else was invented. Families the source does not define — Avatar, Tabs as a
primitive, Toast, Accordion, Breadcrumb — are deliberately absent.

## Known gaps

- **Fonts are loaded from the Google Fonts CDN**, matching the prototype. No binaries
  are vendored, so an offline consumer will fall back to system mono/sans.
- **`assets/logos/logo-mark.png`** is a white-only wordmark with no mascot; the full
  lockup is `shipmate-logo.png`.
- **Shippy exists in two generations.** The current mascot — round head, star on his
  crown, blue-glow pupils — is `assets/brand/shippy.png`, plus a clinging pose in
  `shippy-cling.png`. The previous periwinkle `#727BF0` octopus still ships on the
  live splash page; his five layers are in `assets/brand/legacy/` and are used only
  by the marketing kit and template.
- **`assets/brand/shippy.svg`** is the real Figma vector export — use it everywhere.
  `shippy.png` is a raster fallback keyed from a screenshot, kept only for contexts
  that cannot take SVG (PowerPoint, email).
- **`assets/logos/shipmate-wordmark-purple.png`** is the new purple wordmark
  (`#8359FF`). The green lozenge lockup is still what the live product ships.
- The prototype's Chinese locale, launch timeline, privacy matrix, screenshot
  cropper and store-page-preview flip are documented but not recreated.
