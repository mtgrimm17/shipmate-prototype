# UI kit — Shipmate marketing splash

A recreation of `splash.html` from the `shipmate-prototype` repo — the page a
developer lands on before signing in.

## Anatomy

- **Header** — 1464px wide, the logo lockup at 52px, a hairline Sign In button.
- **Hero** — Inter 500 at 118px / 132.75px, "ship." in brand green; sub-line at
  48.2px / 62.4px in Inter 300, white at 50%.
- **Card pill** — a 48px-radius `#343434` container with a 2px 25%-white stroke,
  holding three 450×300 black cards at 22px radius, 25px apart. A periwinkle radial
  bloom sits under the cards in the top-right corner, behind Shippy.
- **Shippy** — body layer *behind* the pill, four tentacle layers *in front*. The body
  floats ±6px over 4.2s; each tentacle sways 2.4° on its own 5–7s cycle and phase.
- **CTA** — 320×68 brand-green slab, IBM Plex Mono 600 / 25px / 0.08em, dark ink.
- **Platform row + footer** — real storefront SVGs, then a single sentence of
  positioning copy behind a red heart glyph.

The whole page is scaled by `zoom: .78` in the source; that is reproduced here.

## Deliberately omitted

The source's cursor-tracking eyes, blinking, mouth states and the "press E" octopus
placement editor are dev tooling, not design — they are not recreated.
