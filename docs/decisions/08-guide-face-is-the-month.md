### The guide's other face is the month

`buildGuideMiniCal()` (render.js) replaces the tab's checklist inside the same
`.guide-card`, picked by `.guide-faces` — a two-icon segmented control beside
the collapse chevron, its `right` derived as `14 + 26 + 4` so moving one moves
the other.

**IT IS A SEGMENTED CONTROL, NOT A TOGGLE BUTTON, AND THE DIFFERENCE IS
LOAD-BEARING.** It was one 26px icon button that flipped `guideCal`, which is
the right shape for "do a thing" and the wrong one for "pick which of two things
you are looking at" — the card has two faces and only one of them was ever
named. Two halves in a dark track now, the same language as Content Rating's
Unanswered/All: a groove at black 22%, the picked half lifted out of it in the
guide's own violet at 26%, no separator down the middle, radii nesting 7 inside
10.

**The halves SET, they do not flip** (`setGuideFace('list'|'cal')`, app.js).
Pressing the half that is already lit must be a no-op: a toggle there turns the
face OFF, so asking for Checklist while on Checklist would land you on Month,
which reads as the control breaking. `toggleGuideCal` still exists because
`_doFinalSubmit` really does mean "flip", and both now run through one
`_applyGuideFace` so the month-offset reset lives in a single place.

**TWO ICONS, NOT TWO WORDS, and the width is the reason.** The inner column is
254: the eyebrow is 16px uppercase mono and "SHIPPY GUIDE" eats ~115 of it, the
chevron takes 26 plus its gap. Labelled halves did not fit that row — they were
built, measured, and needed a row of their own at 124px a half, costing ~34px of
card height on BOTH faces (445.8 → 497.8). Two 26px icon halves make a **60×32**
track that drops straight into the space the single button already had, so the
control gains its second state for nothing. Measured: track at right 45, 4px
clear of the chevron, the eyebrow's ink ending 50.8px short of it.

**The glyphs are 16 and 15, not both 16.** The list mark is strokes with air
between them, the calendar mark is a filled block; at one size the filled one
reads heavier. Same reason the single button sized its calendar at 14 against a
stroked box's 13.

**The collapse chevron survives, and killing it was on the table.** It is worth
saying no to explicitly: `toggleGuide` is the only door into the collapsed rail,
so removing that button does not tidy a control away — it deletes a feature and
strands the rail's own expand arrow where nobody can reach it.

**Neither of those two wears a stroke, and nothing in this app's micro-buttons
should.** `.active-card-settings` (the platform card's gear) and
`.task-modal-close` (every modal's ×) are both `border: none` on a transparent
ground, bare until the pointer arrives and then a soft fill — that is the
pattern. These two shipped with a 1px violet outline AND a permanent fill,
which made the guide's chrome the loudest thing on a surface whose whole job is
to be read. The hue stays violet because it is the guide's own; only the
outline and the resting fill went. The `is-on` state keeps a fill, because
*pressed* is the one state that earns one. The add row's `+` follows the same
rule; the text field beside it keeps its border, because an input is not a
micro-button — it has to show where you can type before you go near it.

**The month half wears the app's own calendar mark**, `SM_CAL_SVG` in state.js —
the same art as the topbar's Calendar tab, verified identical path. It is a
FILLED 82×75 glyph, not a stroked 24-unit one: at this size a 1.8 stroke is
about one device pixel and the little date squares inside disappear. It is
sized 14 rather than 13 because a filled mark carries more ink than the stroked
box it replaced and needs a touch more room to read the same size as the
chevron beside it. **`index.html` holds a literal copy** inside `#nav-calendar`
— that button is static markup with no JS at parse time — so this is the one
symbol in the app that is knowingly twinned. Change the art in both.

**Submitting now puts something on the calendar — it never used to.** You could
send a build and the month would still be telling you to send it, because
`_calItems` derived its submission items purely as a **workback from the target
launch date** (`Submit to the App Store`, `Math.ceil(days × 2)` before launch)
and nothing anywhere read `state.platformFlipped`. Now a plan item becomes two
facts the moment it really happens: the planned `submit-<pid>` is **suppressed**
for any platform already sent, and in its place go `sent-<pid>` on the day it
went and `decide-<pid>` on the day its store is expected to answer. Both come
off `OB_PLATFORM_TIMING`, the same table the workback leads with, so plan and
fact cannot drift. Phases past the wait (`accepted` / `live` / `rejected`) print
no expected date — they have had their answer.

**The wait is a span, not two dots.** A submission is two dated facts — the day
it went and the day an answer is expected — and the days between them belong to
it just as much: they *are* the wait. Two lone dots made the month say
"something on the 13th, something on the 16th" when what is true is "the App
Store has had this since the 13th". So every day from sent through
expected-decision carries `in-span`, and only while the platform is still
`in_review` — once a store has answered there is no wait left to draw.
Overlapping platforms make **one** band: the question a glance asks is "am I
waiting on anything today", not "on how many".

Three things the band had to be taught:

- **It is a `::before`, not the cell's background.** The cell carries the week's
  rule as a `border-bottom`, and a background paints *under* that border and
  dulls it. The pseudo-element is inset 5px top and bottom so the stroke clears
  both rules and reads as something laid ON the table rather than as a coloured
  row of it.
- **`z-index: 0` on the band and `1` on the cell's children.** A positioned
  pseudo-element beats static content, so without that the band painted over
  the digit.
- **Rounded ends, square middle, and a ROW EDGE counts as an end** — the band
  cannot flow from Saturday to Sunday, it starts again on the next line. That is
  what the `i % 7` tests are doing, not arithmetic on dates. Verified on a span
  that crosses a week: two starts, two ends, one run per row.

**COLOUR IS THE ITEM'S STATUS, NOT ITS ORIGIN — and it was the other way round
until v6.26.** `CAL_KIND` carried a hue each, borrowed from the top-level tabs:
Submission green `#4ADE80`, Marketing yellow `#FACC15`. The submitted card, three
inches away, colours by STATE: `#2fdc80` done, `#FFD84D` the store has it,
`#FFB86B` it is back with you, magenta rejected. Two vocabularies, the same two
hues, on two surfaces you can see at once — the month said "green = this came
from the Submission tab" beside a card saying "green = finished", and it drew the
review WAIT, the one stretch of days in which nothing has been achieved and
nothing can be done, as a green band.

So `CAL_STATUS` (render.js) is now the only source of colour on any calendar
surface, and `_calStatus` / `_calColor` are how every one of them reads it:

| state | hue | what it is |
|---|---|---|
| `todo` | white 55% | not done yet — information, so no hue at all |
| `waiting` | `#FFD84D` | the store has it — the same constant `.sub-seg.is-current` paints |
| `yours` | `#FFB86B` | accepted, the release is yours to make |
| `bad` | `#ff3b78` | rejected |
| `done` / `launch` | `#2fdc80` | |

**The phase is stamped once, in `_calItems`,** on the `sent-`/`decide-` items,
because that is the only place the calendar knows which phase a submission is
in. Everything downstream reads `it.status` through `_calColor` and never looks
at `platformFlipped` again, so the month and the card cannot drift.

**The kind did not go away — it stopped being a colour and became a SHAPE.** It
is still a field, still cycled from the day panel, still what the popover and
the tooltips name; `.gcal-kind` is square for Submission and round for
Marketing, and its FILL is the item's state. That pairing is forced: the dot is
one slot, and a control whose only feedback was a hue it no longer owns would
have been unpressable. Shape says what a thing is, colour says how it is going.

What this costs, knowingly: the glance that separated a marketing beat from a
submission one. It was never legible in a 4px dot, and the day panel names every
item in words. Three follow-ons that had to move with it — the legend now lists
the STATES (`In review` / `Needs you` / `Done`, and not `todo`, because a legend
entry for the absence of a mark explains most of the month); the popover's kind
picker went neutral white, since a picker painting a colour it does not set is a
lie you can see; and the guide grid prints **one dot per STATE**, not per kind,
because a glance at a month asks "is anything waiting on me today".

**The band is `rgba(255,216,77,.13)`** — `#FFD84D` at 13%, the card's in-review
yellow to the digit, so the segment and the band are one statement made twice.
And `.gcal-dot.is-est` draws `var(--d)`, the dot's own colour, where it
hard-coded `#4ADE80` for as long as it existed: invisible while every submission
item was green, and a bug the moment they stopped being.

**An estimate is drawn hollow.** `decide-<pid>` carries `isDecision`, and a day
whose only item of a kind is a decision gets a ring instead of a filled dot
(`.gcal-dot.is-est`) — a date the app worked out and a date something really
happened on must not read as the same kind of mark. A day holding both is
filled: a fact outranks a guess.

**Launch day is the only cell that fills.** It was a 1.5px green ring, which put
it in the same register as the picked day's violet ring — two outlines
competing, and the one that matters reading as a selection. It is a solid
`#2fdc80` box now, green being the app's word for done. Today and launch day can
be the same cell; launch wins the fill (you cannot miss today, it is where you
are) and today keeps a violet ring around the outside so the coincidence still
shows. The launch date itself is `state.formData.releaseDate`, Mark's too,
pre-filled to the 29th of next month.

It is a **window onto the calendar that already exists**, not a second one. It
reads the same `state.calendar.monthOffset`, `_calItems`, `_calGridStart` and
`CAL_KIND` as `buildCalendarMonth`, so the two can never disagree about what is
on a day, and `_calRerender` already repainted the guide. Weeks start on Sunday
because the full calendar does — the reference it was drawn from (Notion)
starts on Monday, and matching it would have put two week starts in one app.

**The grid takes 16px back from the card's padding**, 8 a side (`margin: 0 -8px`
on `.gcal-grid` only, so the month name and the day panel keep the card's real
text column). The card is padded for prose and this is a table: 254px over seven
columns was 36.3 a cell, and 270 makes it **38.3** — the ~2px a day that lets
the number, its disc and the rule under it stop touching. Measured: grid 268
wide, sitting 11 from each card edge, discs at 25 (they were 21).

Even so a cell holds two digits and a dot and nothing else, which is why there
are no chips, no drag and no week selection — all of that is one tab away.
**One dot per KIND, never one per item**, or a day with four marketing items
grows a row of identical dots; and the 4px dot strip is reserved on every cell
so a day that gains an item does not get taller and shove its row.

**The weeks are ruled, and the CELL carries the rule** — `border-bottom` on
every day plus `:nth-last-child(-n+7)` to drop it on the last week. Seven
borders meeting edge to edge read as one line, so nothing has to be laid over
the grid to draw it. Two things that has to say out loud: `box-sizing:
border-box`, because `aspect-ratio` measures the border box and without it every
row comes out a pixel taller than the ratio asked for; and **white at .12, not
.07** — the guide's ground is a dark violet rather than the app's near-black,
and 7% over it was a line you had to be told was there.

**A row is 46px, not a square**, because a square distributes its slack evenly
and the two vertical gaps here are not the same job. The 38.3 cell held 32 of
content and so left ~3px above the number and ~3px under the dots — and a 4px
dot 3px off the rule below it reads as part of the rule. Now `padding: 4px 0
8px`, measured 4.5 from the rule above to the number and **9.5 from the dots to
the rule below**. The content is 25 (disc) + 3 (gap) + 4 (dots) = 32, so both
paddings are derived from it: grow the disc again and they follow.

**Today and the picked day are rounded RECTANGLES, not discs** — 28×24 at
radius 7. A circle round a two-digit number has to be as wide as the number is
tall and then some, so it spends the cell's width on air at the corners; 28
gives the digits room across and takes 3px of height back (5.1 of side air in a
38.3 cell). It also keeps the app's shape language: the step discs are the only
circles here and they hold ONE character. Radius 7 rather than a pill, because
the table's own rules are straight lines and a fully rounded chip beside them
reads as a tag stuck on.

With the rows ruled, **the hover moved onto that box**: a rounded fill spanning
a cell that now has a ruled edge reads as a box someone drew over the table.

**NO RINGS ANYWHERE IN THIS GRID — every state is a fill, and the order of the
rules is what arbitrates.** The picked day is declared FIRST, so any day that
already has a fill of its own (today's violet, launch's green) simply keeps it
and the selection never lands. Two rings were tried and both failed for the same
reason: an outline on a box that is already filled is two marks on one 28×24
shape — drawn *inside* it, launch day came out white-on-green and illegible;
floated *around* it, a halo in a grid of flat rectangles. There was no ambiguity
to solve in the first place: the panel that opens underneath names the day in
words. Launch + today is one green box, full stop.

Opening the face resets `monthOffset` to 0. The Calendar tab starts at 1 on
purpose — it is a planning surface and opens on next month — but a glance that
opens on a month with no "today" in it is the one thing this must not do. Only
on the way in, so paging here and going back keeps your place; it does move the
Calendar tab with it, which is the price of one shared calendar.

**A day opens downwards, it does not navigate.** Pressing a cell used to jump
to the Calendar tab, which is a big move for a small question ("what is on the
18th?") and threw away the month you were looking at. `_guideCalDayPanel` drops
out under the grid instead (`state.guideCalDay`, and pressing the same day
again closes it, so the gesture is its own undo). The way to the full calendar
is now a link inside that panel rather than a side effect of pointing at a
date.

**Treat the panel as the only surface there is** — that is the brief it was
re-cut to, and it is what justifies the extra controls. A row is **three
controls, not one**: the dot sets the kind, the label ticks, the × removes.
It began as a single `.mcal-task` button that only ticked, which is all the
Calendar tab's checklist needs because everything else about an item is a
double-click away in that view's popover; here the kind was unreachable and
nothing could be removed. (A `<div>` holding three buttons, because buttons
cannot nest.) The add row repeats the same three-slot shape, so the dot that
says what a thing IS and the dot that says what the next thing WILL BE sit on
one column — the kind is chosen in the same gesture as the typing.

**Two kinds of item, changed in two different places**, which is why these are
functions and not one-liners. An item you added is a record in
`calendar.custom` and is edited in place. A built-in (`CAL_RECURRING` /
`CAL_ONEOFF`) is a constant: its kind is changed by writing an **override**
keyed on the occurrence, and it is removed by writing to `calendar.hidden`.
Both maps already existed — `calDraftSave` and `calDraftDelete` write the same
two — so this reaches them without the popover. An override replaces the whole
displayed record, so `guideCalCycleKind` spreads what the occurrence is showing
and changes the one field; carrying less would blank the rest.

`_gcalRerender` is the single repaint for all of it, and it does the two things
a repaint here always has to: carry the half-typed title across (innerHTML
throws the input away) and put the caret back. `guideCalAdd` is the one caller
that wants the field emptied, so it clears it *before* calling.

**No rule over the panel.** The grid's last week already stops drawing one, so
a line there was a second ending a few pixels under the first; 18px of space
separates instead. And there is **no "Open in Calendar" link** — a way out is
not a feature of a surface that is meant to be sufficient.

Still light on purpose: no note, no repeat, no time. Those are the popover's.

**The header folds the panel; it is not an ×.** There was one, and the problem
was adjacency: it sat a few pixels above the rows' own ×, which *remove an
item*. Two of the same glyph that close together, one meaning "put this away"
and one "destroy this", is the collision worth designing out. A chevron says
fold, says it in a different shape from delete, and lets the whole header be
the target instead of an 18px box in a corner. (The header is pulled −6px and
given it back as padding, so the date still starts on the panel's text column
while its hover box overhangs the way a row's does.)

The picked day wears a **ring**, not a fill: the fill is today's, and a day can
be both. The × on a row is **bare until the row is hovered** — a delete on every
line, always visible, is a row of invitations to lose something.
