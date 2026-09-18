### The Mac sidebar's glyphs are the real art now

`_buildMacSppSidebar()` (render.js). **Six of the eight are Jaco's exported
SVGs** — Discover (star), Create (paintbrush), Work (paper plane), Develop
(hammer), Categories (grid) and Updates (download arrow) — so those six stopped
being redraws. **Play (rocket) and Arcade (joystick) are still mine** and are the
only two left to replace; he has said he will supply them.

**That makes the column two families, and the split is temporary rather than a
design.** The exported art is FILLED — outline shapes drawn as filled paths with
their own counters, the way SF Symbols are authored — where the two redraws are
1.3px strokes. Both read as outlines at 14px, which is all that matters here: a
genuinely filled mark in this column would read as the selected one, and these do
not, because the fill only ever paints the outline itself.

**EVERY GLYPH IS ON THE SAME 16-UNIT BOX, exported art included.** The source
files are 128-unit canvases carrying a `matrix(4.01085, …)` of their own, so each
export's matrix is multiplied by 0.125 (scale → 0.501356, translations ÷ 8) and
baked into its `<g>`. One viewBox for all eight is what lets one CSS rule size
them; two canvases would have them bobbing against each other the way the
platform marks did before `SM_TILE_MARKS`.

Two details that are easy to lose:

- **`fill-rule` is carried per glyph**, not left to the default. `hammer.svg` is
  authored `evenodd` and the other five `nonzero`; at `nonzero` the hammer loses
  the holes in its claw.
- **`overflow: visible` on the filled `<svg>`.** The exported art really does
  reach the edges — the hammer's ink measures 0 → 16 on the box exactly — so at
  the default `hidden` its outermost antialiased pixel is the one being clipped.

Measured ink (w × h in the 16-unit box): Discover 14.5 × 13.85, Create 13.88 ×
15.52, Work 13.68 × 13.68, Develop 16 × 15.15, Categories 12.02 × 12.02, Updates
11.59 × 14.09 — the variation is the art's own optical balance (a diagonal hammer
has a bigger box than a grid) and is left alone. My two placeholders are visibly
lighter at 10.8 and 7.4 wide, which is the tell that they are still placeholders.

**THE AVATAR IS AN EMPTY DISC AND THE NAME IS GENERIC.** The row carried a
person glyph inside the circle and the literal name "Jacobo Abril". Both went,
for different reasons. The glyph, because a picture OF a person sitting beside a
person's NAME says the same thing twice and the drawing is the half carrying no
information — an account with no photo is a plain disc, here and in the real
app. Its fill goes .14 → .20 to pay for that: the lower value was chosen while a
glyph sat on top and only had to be a ground for it, and alone it read as a hole
rather than a deliberate blank, which is the exact failure the original stroked
version had. `overflow: hidden` stays so a real `<img>` drops in later and clips
to the circle with no second rule.
The name, because it was the one value on that screen that was true about a
real person rather than about the prototype. "Developer" is seeded the way every
other fake value here is (My Game, Pixel Forge, Your Company). There is still no
account model to read it from; when one exists, that is the one line to change.

**NO ROW IS CURRENT, and the highlight was removed rather than moved.** This
sidebar is decorative chrome around a PRODUCT PAGE, and a product page is not
any of the eight destinations listed in it — lighting "Discover" claimed you had
navigated somewhere you had not, on the surface whose whole job is to say "this
is your game's page". The real app leaves those rows unselected while a product
page is open, for the same reason. The `current` parameter and
`.mac-spp-nav-item.is-current`'s two rules went WITH it rather than being left
dormant: a state nothing can set is a control waiting to be turned back on,
which is the argument the dev bar was deleted under.

**The traffic lights are in, and I argued against them once.** When this sidebar
was first nailed against the reference I left them out on the grounds that they
are WINDOW chrome rather than sidebar — true about the object, wrong about this
drawing. Everything else in the column exists to say "you are looking at the Mac
App Store app", and those three dots are the most recognisable thing on a macOS
window; without them the column read as a web sidebar that happens to list
Apple's sections. They are the cheapest fidelity in the whole preview.

They are **dead by construction** — no hover, no `cursor: pointer`, no handler,
`aria-hidden` — because a control that looks pressable and does nothing is worse
than a picture of one, and this is a picture. Apple's colours as LITERALS
(`#FF5F57` / `#FEBC2E` / `#28C840`) on purpose: they belong to macOS, not to
this app's palette, and pointing them at `--alert-*` or the done green would
quietly have made them mean something here. 11px at 7px apart rather than the
real 12 and 8 — the column is 176 wide against a real window's hundreds, so the
trio is scaled to the drawing it sits in.

**The search field got shorter.** At 7px of vertical padding it measured 30
tall, which is the height of a real control in this app and is what it looked
like: something to press, above eight rows that are not. 4px of padding brings
it to ~25, close enough to the nav rows that the column reads as one rhythm.
The horizontal 11 stays — it is what keeps the magnifier off the pill's curve.

**THE LANGUAGE SWITCHER IS CHROME, NOT AN ANSWER.** `_macSppLangDropdownHTML`
puts a `.loc-primary-pill` in the modal's header, and it was the loudest thing
there. The diagnosis is sharper than "too heavy": it wore `--pill-on-bg` /
`--pill-on-color`, the SELECTION blue, which in this app means *you confirmed
this*. In Localization that is right — the primary language is a declaration the
submission carries, chosen inside a form, and that copy of the pill is
untouched. Here the same component picks which language you are LOOKING at. It
is a lens, not an answer; nothing about the submission changes when you move it.
Blue was making a claim the control cannot make, in the brightest colour
available, two inches from the title.

**The fix is `.rel-track`'s, wholesale** — that rule was written for this exact
situation (a picker living in chrome rather than in a form) and a third
treatment for one component was not needed. Ghost trigger: no fill and no ring
at rest, both arriving on hover, and the hover box is deliberately
`.task-modal-close`'s own — 30px tall, 8px radius, flat grey, no stroke — because
that button is one sibling away and two controls in one row inventing separate
boxes is the only reason they would look like two different things. The ring is
switched off with `display: none` rather than deleted, so Localization keeps
its. Scoped to `.submit-modal-header-actions`.

**And it shrink-wraps**, the third piece of that copy: the card's track picker
takes the room its value needs, while this one was pinned at a fixed 150px with
the label stretched across 102 of it. `swSelect` now gets `'auto'` and
`.loc-primary-name` drops its `flex: 1` (that stretch is what kept the word
floating in an oversized box). Measured: 150 → 98.4 wide, 30 tall, radius 8,
transparent, ring `none`, label `--text-dim` → `--text` on approach, same height
and radius as the × and centred with it, 20px apart. The panel still opens
right-aligned; open still lights the same 6% fill; Localization's copy still
measures `rgba(0,154,255,.35)` with its ring `block`.

**THE PAGE DISSOLVES AT BOTH ENDS INSTEAD OF BEING CUT.** The store column
scrolls 464px under a bar that is no longer inside it, and there was no fade at
all: the modal's own top fade sits at opacity 0 on this face (its wrap is
`overflow: hidden` here, so `_smModalFades` reads it as unscrollable), and the
page was chopped dead on the bar's bottom edge.

It is `.cr-pinned::after`'s fade, re-hung on the surface that actually moves.
That bar hangs its fade off its own bottom edge because it is sticky INSIDE the
scroller; this one sits outside the shell, so an `::after` on it would also lie
across the top of the SIDEBAR, which does not scroll. **The fade belongs to the
column that moves.**

**A sticky `::before` on the scroller**, which costs no markup and no geometry —
no need to know the sidebar's width or the shell's gap. As the first in-flow
child it would push the page down 36px, so a negative `margin-bottom` gives that
space straight back (measured: the page still starts at the scrollport's top +
`.ias-device-wrap`'s own 4px, exactly where it did before). Sticky rather than
absolute is the load-bearing part: an absolutely positioned child of a scroll
container is laid out against the padding box and scrolls away with the content.

**The colour follows the ground, and the ground MOVED.** It was solved in
rgb(28) while the page still carried its own `--panel-2` container; that
container is gone (below), so what sits under this fade is the modal's
`--panel` and the stops are re-solved in 20. Leaving 28 would paint a strip
LIGHTER than what it covers — a glow, not a fade.

**It reaches full opacity and it ramps EVENLY, which is where it stops copying
`.cr-pinned::after`.** That bar tops out at 0.96 and spends more than half its
drop in its first 20px — front-loaded, because there it only has to kill a 34px
row sliding under an already-opaque strip. Here there is no opaque strip: this
fade IS the whole boundary. A top that never quite reaches the ground colour
leaves the cut faintly visible underneath it, and a front-loaded ramp reads as a
smudge with a hard edge above it rather than as a dissolve. So it starts at a
true 1.0 — exactly `--panel`, so content stops existing rather than dimming —
across eight stops instead of five, over **48px** rather than 36: the span is
the dissolve now, not a softener laid on top of one.

**It is only there while something is above it**, which the CR bar does not
bother with (it is opaque and always has rows under it). At `scrollTop` 0 a fade
over the page's own header is a shadow claiming content that is not there. The
default is OFF and `_smModalFades` adds `.is-scrolled` — inverted on purpose, so
a freshly rendered scroller at the top never flashes a fade for one frame before
the class lands.

**AND THE BOTTOM GETS THE SAME FADE, WHICH IT DID NOT FOR ONE VERSION.** This
column shipped with only the top one, on a line written in the CSS and in this
file and never measured: *"there is no bottom fade on this column — the page ends
in the footer's own space and nothing is cut there."* Measured, it is cut. With
464px still below the fold an `.ias-achv-section` sat hard on the scrollport's
bottom edge, and only **12px** separate that edge from the modal's footer — far
too little for anything to absorb it. A column that dissolves at one end and is
guillotined at the other says the boundary is real at the top and an accident at
the bottom.

It is the top fade **mirrored**, not a second design: `.mac-spp-main::after`,
sticky at `bottom: 0`, same 48px, the same eight stops in `--panel`, read
bottom-up, and `margin-top: -48px` giving back the space it would otherwise add
below the page as the last in-flow child. Sticky for the same load-bearing reason
as the top one — an absolutely positioned child of a scroll container is laid out
against the padding box and scrolls away with the content.

So it is **two classes after all**, and the second rests on the first's own
argument: a fade at the very end of the scroll claims content that is not there
exactly as one at `scrollTop` 0 does. `_smModalFades` adds `.is-scrollable-down`
only while `scrollTop + clientHeight < scrollHeight - 2`. Both are stated
positively rather than as `at-top` / `at-bottom`, so the resting state at each end
needs no class at all. Measured across a full scroll: top 0 / bottom 1 at the
start, both 1 in the middle, top 1 / bottom 0 at the end, `pointer-events: none`,
and `scrollHeight` **identical** with the pseudo-element and with it disabled —
the negative margin costs zero layout.

**AND `.mac-spp-main` CARRIES NO `padding-bottom`, WHICH IS A CONSTRAINT OF THAT
FADE AND NOT A TIDY-UP.** A sticky element cannot leave its **containing block**,
and for a child of this scroller that is the scroller's CONTENT box — not its
scrollport. The 4px of bottom padding this element used to carry (the tail
matching `.ias-device-wrap`'s own 4px of padding-top) therefore held `::after`
4px short of the scrollport, leaving a hairline of un-faded page between the
gradient and the footer's opaque edge. Measured with a sticky probe: **exactly
4.0px**, the padding to the pixel — the kind of thing that looks like a
half-pixel rounding bug and is arithmetic.

The tail air did not go, it **moved onto the content it belongs to**
(`.mac-spp-main > .ias-device-wrap { padding-bottom: 4px }`, scoped so iOS and
Mac Full are untouched), so the page still ends with the same air and
`scrollHeight` is unchanged — verified at 4px exactly, with the rule on and off.
The rule to carry forward: **anything added to this scroller's bottom padding
pushes the fade up by that amount.** Put tail space on the child.

**`_smModalFades` arms it, and that is not an arbitrary home.** Pressing a pill
calls `setStorePreviewFocus` → `reRenderStepModal()`, which rebuilds the modal
with innerHTML and takes the old scroller's listener with it — the exact reason
that function already re-arms after every render. Verified across three pill
presses: Description → `scrollTop` 169 with the fade on, Data privacy → 455 on,
Title → 0 with the fade off again, target in view and the right pill lit every
time, and the class correctly re-armed on the new node each round.

**THE PAGE WEARS NO CONTAINER OF ITS OWN, and that is FIDELITY rather than
tidying.** `.ias-page` gives every preview a `--panel-2` fill, a 1px border and
a 16px radius — a card. In the real Mac App Store the product page FILLS THE
WINDOW beside the sidebar; it does not sit in a rounded box. That card was a
Shipmate invention, and it also made this a panel inside a panel, since the
modal already is one.

**The sidebar KEEPS its box, and dropping both was the wrong tidier-looking
option.** The two columns are not the same kind of thing: the sidebar is a fixed
rail that never moves and its edge is what says so, while the page is the
surface that scrolls under the pills. A rail with a box and a page without one
is the real app's own arrangement. Verified: the sidebar holds `rgb(28)` fill,
`rgb(42)` border, 12px radius and does not move a pixel while the page scrolls
300.

**Scoped to `.mac-spp-page`.** iOS and Mac Full share `.ias-page` and are
deliberately untouched — those previews are drawn as a device showing a page,
where a card edge is exactly right. Verified both still measure `rgb(28)` with
a `rgb(42)` border at 16px radius.

Two things it drags with it, both handled: the top fade's stops are re-solved in
`--panel` (above), and the page's inner boxes — the screenshot frames at
`rgb(36)` — now sit on rgb(20) rather than rgb(28) and read a step heavier. Left
as they are; if they are ever re-tuned, that is the ground to measure against.

**THE SCROLLBAR MOVED OUT OF THE PAGE, AND THE PAGE DID NOT MOVE WITH IT.**
`margin-right: -24px` + `padding-right: 24px` on `.mac-spp-main` — bleed and pay
back, the same two-line trick `.cr-pinned` uses on its own scroller. The
scroller's BOX grows 24px to the right; the padding hands that space straight
back to the content. So the page keeps its 754 width with its right edge on the
body's content column at 1220.5 — flush under the pinned bar, verified to 0.6px
— while the scrollbar, which paints at the scroller's padding-box edge, moves
out to the modal's own edge.

**24 IS NOT A GUESS — it is `.submit-modal-scroll`'s own side padding**, which
is what makes this land where the app already puts a scrollbar rather than at a
third position. Every other step scrolls on that element: its box reaches the
modal's inner edge while its 24px of padding holds the content column 24 short,
so its bar paints on the modal's edge. Paying back exactly 24 here reproduces
that. Verified by measuring the INSET from each scroller's right edge to its own
modal's — Content Rating 1px, the Mac preview 1px. (Absolute x cannot match:
those modals are 680 and 1000 wide. A first pass used 12, half the gutter,
eyeballed — and put the bar somewhere neither modal uses.)

**It only became visible when the page lost its container.** A scrollbar sitting
on a card's edge reads as that card's; the same scrollbar with no card under it
reads as a line drawn through the page — a leftover of a box that is no longer
there.

**THE PAY-BACK IS `24px − var(--sm-bar)`, NOT 24.** The bar is drawn INSIDE the
padding box, so it eats its own width out of whatever the padding hands back. At
a flat 24 the store page ended 11px short of the pinned bar it is supposed to sit
flush under — measured 11.0, the bar's width to the pixel. Written as the
subtraction rather than as 13 so the two cannot drift.

That correction only became possible once the bar was real. **An earlier version
of this note said "`scrollbar-gutter: stable` reserves NOTHING here — this
browser's scrollbars are overlay", and that was the symptom mistaken for the
cause**: they were overlay because this app's own CSS was asking for it. See
"`scrollbar-color` is not a Firefox-only hint" below. With that removed the lane
really is reserved (`offsetWidth − clientWidth = 11`), the page is flush again
(measured 0.0 against the pinned bar, page still 754 wide) and the bar still sits
1px inside the modal's edge, exactly where it was designed to.

**THE SIDEBAR IS DIMMED AS ONE OBJECT, and `opacity` is the right lever here for
once.** This app's rule is the opposite — dim by COLOUR, never by opacity,
because an opacity paints a thing through gauze and composites it to a muddier
version of whatever it was (see the submitted card's ticks). That rule is about
CONTENT, where the muddied colour still has to mean something. This column is a
PICTURE: eight rows nobody can press, a dead search field, three dots that do
nothing. There is no state in it to misread, so there is nothing for a composite
to corrupt. One lever also beats four — labels, glyphs, panel and border recede
together and keep their relationships, where dimming each by hand is four
numbers that will drift. `opacity: .42`, which puts the labels near rgb(79) on
the modal's rgb(20): legible as chrome, and no longer arguing with the store
page beside it.
