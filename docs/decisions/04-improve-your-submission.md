### Improve Your Submission — three batches, one axis

`buildImproveSubmissionSection()` (render.js) draws three batches — Store Page,
Localization, Binary. Each is a `.iv-card` with its school-grade `.iv-grade-tab`
sticking out from **behind** it (the card is offset `margin-right: 52px`), and a
numbered carousel in the header. Everything is scoped under `.improve-v2`, on
the section's own wrapper rather than on the modal, because this step shares
`.submit-modal` with every other step.

**The list stopped shrinking, and that is what the carousel rests on.**
`_mergedStoreItems()` (app.js) returns every suggestion with a derived
`status` — `applied` / `kept` / `open`, read off `acceptedFixes` and
`dismissedFixes` rather than stored — where it used to filter answered ones
out. A tab cannot be drawn for an item the list has forgotten. Answering no
longer moves you either: you pressed a box on the card you were reading.

**One axis for the header.** Type label, file chip, carousel and grade letter
all centre on the same line, from three tokens with the grade's position
*derived*:

```css
--iv-head-h: 26px;      /* the tallest thing a header holds — the file chip */
--iv-card-pad-top: 8px; /* and the head's margin-bottom, deliberately equal */
--iv-grade-lh: 27px;
padding-top: calc(var(--iv-card-pad-top) + (var(--iv-head-h) - var(--iv-grade-lh)) / 2);
```

Equal top padding and bottom margin is what makes the gap above the header's
content equal the gap below it. The file chip carries an explicit `height`: left
to its padding it came out 27.4px and *it* decided the header's height, pushing
the binary batch off the axis the other two sat on.

**Collapse means "this is no longer asking anything", not "hidden".** It is a
three-state override (`_improveCollapsed`): undefined follows the work,
true/false is the header toggle. Derived-only was tried and locked the batch
shut, because the condition that collapsed it never stops being true. Two rules
follow: a collapsed batch has **no selected dot** and **no per-item button** —
both claim a card that is not on screen — and the "looking good" line is only
printed when everything really is answered. Folded away with work outstanding it
shows its header and nothing else.

**A grade rates the submission, not the reading of it.** Localization's grade is
`locAccepted ? 'A' : locGrade`, not `locDone ? …`: "Not now" used to score the
same as "Add language", so the batch went to A for having been answered, and a
grade that rises for dismissing its own advice is worth nothing. Declining a
language leaves the submission exactly as weak as it was. Dismissed still
*collapses* the batch and still prints "Localization handled" — being no longer
asked is a different fact from being better, and only the first is true.

**Only two of the three auto-collapse.** Binary and Localization are
acknowledgements: answered, there is nothing left to do with them. A Store Page
answer is *not* finished when it is made — the accepted fix stays editable
through its pencil, and the text it wrote is the real store copy — so its
default is `false` and it only ever collapses by hand. That is why the all-clear
and no-build states wear `.iv-card-collapsed` too: they are the same claim, and
it buys them the right padding and no divider.

A divider divides two things, so **summaries never have one**: the two
all-clears, Binary's "upload your build to scan for…" caption, and any collapsed
card. `.iv-head:last-child` is what drops the header's bottom margin only when
the header really is the whole card — a blanket `margin-bottom: 0` left those
captions flush against the label above them.

An all-clear and a completion line make the **same claim**, so they wear the
same format: `.iv-strong-line`, uppercase mono at 11px in #50F88A, no icon.
`_allGood()` used to draw a green circle-check with sentence-case text in
`.iys-all-good-inline` — the last of the legacy `iys-` styling inside this
section, and the reason "Localization looks strong for your target markets" and
"YOUR STORE PAGE IS LOOKING GOOD" looked like two different kinds of statement.
(`.iys-all-good-inline`'s rule in style.css now has no live consumer.)

**The carousel nudge answers an answer, not a click.** `_impAfterSelect`
(app.js) pops the circle you pressed; the glint on the *next* one is reserved
for `_impQueueResolve`, called only from the four actions that actually resolve
something (apply, accept-edited, keep, and Binary's "Got it"). It used to run on
every carousel press, so merely reading suggestion 2 lit up suggestion 3 — a
"keep going" shown to someone who had not done anything. The target is the next
unresolved circle **forward from the one answered, wrapping**, not the first
unresolved in the row: answering #3 with #1 still open points at #4, because the
eye is already at #3.

The glint changes **only light**, on a sine (`cubic-bezier(.37,0,.63,1)`). The
first version scaled the dot to 1.18 and threw a 7px ring out of it, which on a
28px circle reads as a control demanding a press rather than as a hint.

**But the light it changes is FILL AND INK, never opacity — and read this
before touching either animation.** The bare `.improve-v2 .iv-tab` rule says
`opacity: .2`, and it is a decoy: every carousel that renders is inside
`.imp-list.iv-blueconfirm` (see the `return` of
`buildImproveSubmissionSection`), where the modifier resets the tab to
`opacity: 1` and carries all four states in `background` / `color` instead —
resting is white **5%** fill with white **35%** text. Both animations were
written against the decoy and so did the exact opposite of what they meant:
each drove the one circle it was pointing at *down* to opacity .2 and a
transparent fill. Twice, because the second was "fixed" by measuring a probe
built without the `.iv-blueconfirm` wrapper. **If you measure a carousel tab,
put it inside `.imp-list.iv-blueconfirm` or you are measuring dead CSS.**

- **The one-shot glint** (`tabNextGlint`, 900ms) runs 5%/35% → 28%/white →
  5%/35%. 0% and 100% must *be* the resting fill, because the class is stripped
  on `animationend` and anything else jumps.
- **The persistent breath** (`_impBreatheNext()`, app.js) is the opposite case
  and takes the opposite floor. It marks the next open circle for as long as it
  is next, and a curve returning to rest spends half of every cycle
  indistinguishable from the dots either side of it — the dot reads as
  *dimming*. So its floor sits **above** resting: 12%/60% → 28%/white, measured
  against a neighbour's 5%/35%. It is lit the whole time and the sine only says
  how lit.

(`startTime = 0` still puts every rebuilt node on one phase; note that writing
`currentTime` to sample it recomputes `startTime`, so a probe cannot check both
at once.)

**Every control in a card is 30px, and the sum has to be integral.** `.imp-cta`
was `line-height: 1.2` on 12px — 14.4, so the pill measured **30.4**, and a
fractional box straddles the device pixel grid: two identical buttons painted a
pixel apart purely from the y they landed on, which is what looked like "some
are 28 and some are 29". It is 16px of line-height + 6 + 6 of padding + two 1px
borders = 30 exactly, which is also `.iv-undo`'s and `.iv-code-copy`'s size. The
footer's own override (`min-height: 39px`) is unaffected. Retune it if you like,
but keep the total a whole number.

**Four bugs worth not repeating.** A `contenteditable` inside a `<button>`
cannot take focus, so the edit pencil did nothing — the boxes are `<button>`
while they are a choice and `<div>` once they are an answer. `focusout` does not
fire reliably here, so the save button commits directly instead of blurring and
hoping. `tabNextPulse` and `impFixFloat` are referenced by the reference's CSS
and defined nowhere in it; both rules were inert until they were written. And a
stroked icon at 13px on a 24-unit viewBox scales to about one device pixel —
the revert arrow was present and invisible, and is a filled path now.
