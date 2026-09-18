### Editing a field must not move the page

`_iasMountInlineEditor` (app.js) and `.ias-editing` (style.css). Clicking Title
in a Product Page Preview used to shove everything under it down 21.6px, and
clicking Subtitle 41px. Three separate causes, stacked, all measured:

- **The counter row was INSERTED** as a brand-new line under the field: +19.4px.
- **The input's 1px border** made its box taller than the text it replaced: +2px.
- **`.ias-inline-input`'s `margin` SHORTHAND wiped the field's own margins** — so
  the subtitle lost its −5px top margin the instant it became an input. That is
  the sneaky one, and the reason Subtitle moved twice as far as Title.

**THE EDITOR IS MOUNTED INSIDE THE FIELD NOW, NOT IN PLACE OF IT**, and that
answers all three by construction rather than with three corrections. The field
element stays in the DOM and becomes a flex row holding its own input and its
own counter. The box that holds the text is the same box either way, so it
cannot change size; the field's margins are still the field's; and the counter
is not in the sibling chain at all.

**That last part deleted three CSS rules.** Five `:has()` rules had grown up
around this file's own mount: the old editor replaced the field (so Title
stopped being `.ias-app-name`) and wedged the counter between it and Subtitle
(so Subtitle stopped being its sibling), and every clearance rule had to be
rewritten for each arrangement — anchored on the input, on the counter row, on
the counter row while over-limit. They all said the same thing. One rule covers
every state now.

**THE COUNTER SITS BESIDE A ONE-LINE FIELD, NOT UNDER IT** — Jaco's call, and
the right one: there is room to the right, and this is a DRAWING of the Mac App
Store, where the counter is editor chrome rather than part of the drawing.
Chrome must not push the drawing around.

**Its column is reserved and MEASURED, and the first measurement was wrong in a
way worth repeating.** It holds "Must be less than 30 characters." (148.3 at
11px) + an 8px gap + the count. Sizing the count from a two-digit overshoot gave
172 — and the real row then measured **172.0 exactly**, so the sentence wrapped
and the page moved 12.6px the moment you crossed the limit. Same bug, one state
further in. Sized from a four-character overshoot (`-970`: paste a paragraph
into a 30-character field) it is 148.3 + 8 + 31 = 187.3 → **188**, the next
multiple of the 4px this row is spaced on. The sentence is `nowrap` with an
ellipsis as the belt to that braces: past some absurd overshoot a shortened
sentence is a far better failure than a taller row.

Reserved (`flex: 0 0`) rather than fitted, for the pinned nav's reason: a column
that grows when the error appears would shrink the input you are typing in at
the exact moment you cross the limit.

**The ring is an OUTLINE, and a box-shadow was tried first and broke the
description.** An inset box-shadow costs no layout either, but `box-shadow` is
one property and half the things edited here already spend it — the
description's box carries the preview's amber glow, and an empty field's pulse
*animates* it. Whichever rule won, one mark vanished; measured, the
description's blue ring was simply gone. `outline` + `outline-offset: -1px`
draws in the same place on the same radius, collides with nothing, and makes the
ring the real focus ring instead of a look-alike beside `outline: none`.

**SCOPED TO `.ias-editing`; the shared `.ias-inline-input` rule is untouched on
purpose.** The same trade is wrong one surface over: a Localization Review
card's field has a real 1px border of its own, so the bordered editor is exactly
its height and a borderless one measures 1.9px short — swapping it there would
have introduced the very jump this removes here. Verified: the shared rule still
computes `1px solid rgb(10,132,255)` with `outline: none`, so Loc Review and IAP
are bit-for-bit as they were.

**`ias-placeholder` STAYS ON while a field is open**, which stripping it taught
the hard way: the subtitle jumped 14px *up* on click, because the empty-field
clearance rule stopped matching. The class is what the layout reads to mean
"still empty", and clicking a field does not fill it — that happens on commit,
when the body is rebuilt and the class is recomputed from the real value. Only
the pulse has to go, and it goes in CSS (`.ias-editing { animation: none }`).

**SINGLE-LINE FIELDS ONLY.** Description and What's New stay on `replaceWith`:
their host is a `-webkit-line-clamp` box inside the `.mac-spp-desc-flex` grid,
and nesting a textarea in a clamped box clamps the textarea. There is also no
"beside" next to a four-row textarea. Editing the description still opens the
page by 31.4px — a multiline box genuinely has to grow, which is a different
thing from a one-line field moving for no reason, but it is the case left open.

Measured on both previews, empty and filled, under limit and over: Title and
Subtitle move **0.0px** on click, on going over the limit, and on blur — and the
text itself lands on the same x it was drawn at (604.5 → 604.5).
