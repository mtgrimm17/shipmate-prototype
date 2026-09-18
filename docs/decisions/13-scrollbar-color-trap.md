### `scrollbar-color` is not a Firefox-only hint

Three scrollers carried `scrollbar-color: rgba(255,255,255,.13) transparent`
with a comment saying it was for Firefox — `.main`, `.submit-modal-scroll` and
`.mac-spp-main`. **In Chrome that property is neither ignored nor additive:
specifying it switches the element to the standard scrollbar path, which makes
every `::-webkit-scrollbar` rule in this file inert on that element, and on
macOS the standard bar is the OVERLAY one.**

Measured on `.mac-spp-main`, one line apart:

| | `offsetWidth − clientWidth` |
|---|---|
| `scrollbar-color` as authored | **0** |
| `scrollbar-color: auto` | **11** |

So the 11px bar this file carefully styles had never once been drawn on those
three elements, and `scrollbar-gutter: stable` reserved nothing because there was
nothing to reserve. Firefox keeps the styling through
`@supports not selector(::-webkit-scrollbar)`, where the two cannot collide.

**AN OVERLAY BAR DOES NOT FOLLOW A PROGRAMMATIC SCROLL, and that is the bug it
was reported as.** Wheel to the bottom of the Mac preview (the thumb appears),
press a pill in the pinned nav, and the page travels while the thumb sits where
you left it and fades — *"me lleva al sitio pero la barra no se mueve"*. Two
sessions went into the travel code looking for a teleport that was not there:
`scrollTop` was measured animating 466 → 2 in eleven interpolated steps every
single time. **The thing that was stuck was the only thing you can see.** When a
report and a measurement disagree this flatly, suspect that they are about two
different objects.

**Killing it exposed a second bug the same minute, and the two had been hiding
each other.** `.submit-modal-mac-spp .submit-modal-scroll` is `overflow: hidden`
— it hands scrolling to `.mac-spp-main` — but it still inherited
`scrollbar-gutter: stable`, and **`overflow: hidden` does not switch that off**:
a hidden box is still a scroll container, so the gutter stays reserved. With
overlay bars that reserved 0px and nobody noticed; with real ones it became 11px
of permanently empty lane down the modal's right edge, for a bar that can never
appear because there is nothing there to scroll — a second, dead track beside the
live one. `scrollbar-gutter: auto` on that override kills it (measured 11 → 0).

Two wrongs that both measured zero is why this survived so long. The width is a
token now (`--sm-bar`), because one consumer has to subtract it — see the Mac
preview's bleed.

Verified after: dead gutter 0, live bar 11, thumb 369px tall travelling 269px top
to bottom, page flush under the pinned bar at 0.0 and still 754 wide, bar 1px
inside the modal edge, Content Rating's own `.cr-pinned` bleed still landing on
its rows' column to the pixel (bar right 963, row right 963), and the dashboard's
`.main` reserving its lane with no horizontal overflow.
