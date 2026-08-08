# Shipmate Design System

Canonical reference for the Shipmate visual language, extracted from the prototype's
`style.css` and `splash.html` (repo `mtgrimm17/shipmate-prototype`, synced 2026-08-07).

Consumers link **one** file — `styles.css` — which imports the six token files below.
Everything is dark-first.

## Structure

| Folder | Contents |
|---|---|
| `tokens/` | `colors · typography · spacing · elevation · motion · fonts` — all CSS custom properties |
| `components/` | 42 React components across brand, core, feedback, forms, progress, submission, surfaces |
| `guidelines/` | 20 guideline cards (color, type, spacing, elevation, motion, brand) |
| `ui_kits/` | Click-through `app` and `marketing` recreations |
| `templates/` | `app-screen` and `marketing-page` starting points |
| `assets/` | Brand marks, Shippy layers, seven storefront icons, logos |

## Color

Surfaces stack dark: `--bg #0a0a0a` → `--panel #141414` → `--panel-2 #1c1c1c` →
`--panel-3 #242424`, with `--border #2a2a2a`. Marketing sits on pure black.

Text runs on three greys: `--text #f5f5f5`, `--text-dim #a0a0a0`, `--text-faint #555`.

Brand: **ship green** `--green-brand #2FDC80` and **Shippy periwinkle/purple**
`--shipmate #9F68F0`. Anything the product did *for you* wears the Shipmate purple.

Signal is strict — green = done, orange = attention/required, magenta `#FF3B76` = rejection
risk, blue `#60a5fa` = selected (never good or bad). Action-card impact headers are the only
large blocks of pure color: high `#EB3B3B`, medium `#D05017`, notice `#ECBE49`, done `#92FE85`.

## Type

Mono is the default; **Inter is the exception** (hero and marketing body). Families:
`--font-mono` JetBrains Mono, `--font-sans` Inter, `--font-display-mono` IBM Plex Mono.

App scale runs `10 → 20px` and nothing in the product is larger (`--fs-micro 10` …
`--fs-headline 20`). Marketing runs an order of magnitude up — hero at `118px`.
Uppercase micro-type carries structural hierarchy via letter-spacing tokens
(`--ls-label .08em` … `--ls-loc .20em`).

## Spacing & radii

2px-resolution scale (`--space-1 4px` … `--space-12 32px`; 5/7/9/11/18 are deliberate).
Radii `4 → 14` in the app, `22` and `48` on marketing, `999` for pills.
Border widths: hairline 1px, control 1.5px, rail 2px.

## Elevation

Shadow only when a surface floats (picklist → dropdown → modal); never at rest.
Emphasis is a **glow, not a drop shadow** — `--glow-cta` green bloom, plus selected/
required/ready rings.

## Motion

Fast and short, no bounce except the tab fill. Durations `--dur-instant .10s` …
`--dur-slow .25s`, with the `--dur-bar .6s` progress fill and the card flip
(`--dur-flip-out 160ms` / `--dur-flip-in 300ms`). Standard easing
`cubic-bezier(0.4,0,0.2,1)`; Shippy floats on `--octo-float 4.2s`.

## Components (42)

- **brand** — Wordmark, Shippy, PlatformIcon (7 storefronts)
- **core** — Button, CtaButton, IconButton, ChipButton, Pill, StatusPill, Toggle, YesNoButton
- **feedback** — TipBox, AlertBox, Spinner, Shimmer
- **forms** — FormLabel, Input, Dropzone, TooltipIcon
- **progress** — ProgressBar, StepDots, StepRow, TaskRow
- **submission** — ActionCard, InsightPanel, PartnerCard, NoticeBanner, CodeBlock, SuggestionCompare, FixItButton
- **surfaces** — Card, Menu, Modal (+ header/body/footer/scrim)

## Brand rules

Logo lockup: "ship" in white, "mate" in green, Shippy on top. Shippy the mascot **peeks
over surfaces, he never stands on them** — body behind, tentacles in front.

_See `_ds_manifest.json` for the full token values, component source paths, and card index._
