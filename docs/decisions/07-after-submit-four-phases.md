### After Submit: four phases, in each store's own words

`buildSubmittedCard()` (render.js) draws the card's back face, and the phase it
is in lives on `state.platformFlipped[pid].phase` — one of
`STORE_REVIEW_PHASES` (`in_review` / `accepted` / `live` / `rejected`). Older
submits wrote only `{track, time}` and read as `in_review`, so nothing needed
migrating. Before this there were two faces: amber IN REVIEW, and green LIVE
for Web only.

**The words come from `STORE_REVIEW` in state.js, verified against vendor docs
on 14 Sep 2026** — three of those strings are ones the internet gets wrong.
Apple's `AppStoreVersionState` is deprecated in favour of `AppVersionState`,
which renamed READY_FOR_SALE to **READY_FOR_DISTRIBUTION**; Apple says
**Accepted**, never "Approved"; and it is **Pending Developer Release**, not
"Waiting for Developer Release".

**`accepted` is its own phase because all three stores stop there and hand the
release back to you** — Apple with a *Release This Version* button, Google with
*Publish changes*, Steam saying outright that "Approved titles will not release
themselves". The pattern the card copies: the state names the approval, the
line names the obligation, and the verb is the developer's.

**Amber moved, and that is the design decision to argue with first.** IN REVIEW
used to wear the amber gradient, so the card shouted for days about a state in
which there is nothing to do. Under the app's own colour rule — green done,
amber *this needs you*, red wrong — a wait is none of the three, so `in_review`
is a flat panel grey and amber went to `accepted`, the one phase actually
waiting on the developer.

**A day counter needs days to count.** Apple's verified figure is "90% in less
than 24 hours", so `REVIEW_DAYS`-style arithmetic printed "Day 1 of 1", which
reads as a bug. Under two days the store's own claim goes in that slot instead
("Usually under 24h"). Android counts to 7, Steam to 5.

**ONE TABLE FOR HOW LONG, AND IT IS MARK'S.** `STORE_REVIEW` shipped with a
`days` per store and for one day the app had two answers to the same question:
`OB_PLATFORM_TIMING` (render.js:352, Mark Grimm, v0.58) already fed the Release
Timing panel, the dashboard timeline and the calendar's workback, so the same
submission came out a different length depending on which surface you read it
on. `STORE_REVIEW.days` is gone; `buildSubmittedCard` reads
`OB_PLATFORM_TIMING[pid]` with iOS's number for `macos` (it is App Store review)
and 0 for `web` (a deploy has no review). The vendor claims that justified the
old numbers survive where they belong — as **copy**: Apple's "90% in less than
24 hours" is a sentence in the card, not arithmetic.

**Mark's numbers are fractional (2.2 / 4.3 / 7.1) because they are averages**,
and two things follow. `setDate(+2.2)` silently truncates to 2 — the quiet kind
of wrong, it looks fine and is a day short on every platform — so the card uses
`_addDays`. And **whoever rounds must round the same way**: a calendar cell is a
whole day, so its decision item is `Math.ceil(days)` off the send date; adding
the raw 2.2 in the card put "Est. live" on Sep 15 against the calendar's Sep 16,
one submission with two dates on two surfaces you can see at once. Both ceil
now — verified matching on all three stores.

Two things left deliberately visible rather than tidied away:

- **Steam's `rejected` label is the only string with no vendor source.**
  Steamworks documents no rejection state and no withdrawal at all — the model
  is "feedback sent" or "Ready for release".
- **The card promises an "Est. live" date that no store gives.** Apple
  publishes an aggregate percentage, Google states there is no SLA. That is
  Shipmate's arithmetic wearing the store's authority, and it predates the
  phases.

The height lock is now `min-height`, not `height` + `max-height` +
`overflow: hidden`. The old lock stopped the flipped card stretching its
siblings and also silently clipped it the moment a face held more than the
steps face it replaced — which `accepted` and `rejected` both do.

**Cancelling is a HOLD, not a dialog.** The first version opened two buttons
inside the card — which is a dialog wearing a card's clothes: it asked the
question in the place that had just been answered, and put the safe option one
pixel from the destructive one. Holding makes the gesture and the consent the
same act; there is no wrong button to land on, and letting go is the undo.
`cancelHoldStart` / `cancelHoldEnd` (app.js) own it, and while the button is
down a red sweep crosses the card and the status line becomes **CANCELING
SUBMISSION**, blinking. **The sweep IS the timer** — its duration comes from
`--cancel-hold`, set in JS from the same `SM_CANCEL_HOLD_MS` the timeout uses,
so the bar cannot finish early or late relative to the thing it measures. One
number, two consumers. Releasing early costs one class removal and no render;
only the completed hold re-renders, because only then has anything changed.
Verified: mid-hold the line reads CANCELING SUBMISSION in `rgb(255,59,118)` with
`subCancelSweep` running 1.4s; released at 300ms the card is untouched, the
estimate is back and it is still submitted; held through, `platformFlipped` is
gone and no class is left behind.

Three things the sweep learned by being wrong first:

- **No blink.** The word stepped between full and 25% opacity, and a blinking
  label reads as a fault indicator rather than as a countdown. It also competed
  with the bar: the sweep is already the clock, and a second thing keeping time
  beside it is noise. The word turns red and stays still.
- **Flat, not a gradient.** A gradient has a bright end and a faint one, so the
  bar looked like it was fading out exactly where it was still filling — it
  described its own progress twice and disagreed with itself. One even
  `rgba(255,59,120,.22)`.
- **The card's EDGE goes red with it, and the numbers are borrowed rather than
  picked.** `.submit-ready` is the only other state in this app that colours a
  card's border, and it does it with `0.55` on the border plus a `0.12` ring
  just outside; this is that same pair in the sweep's `#ff3b78`, so "the border
  is carrying a state" is one idea in two places instead of two inventions. It
  is deliberately NOT part of the timer — the sweep measures the hold and must
  stay the only thing that does, so the edge arrives at once and holds, saying
  only which state you are in. No transition had to be written: `.active-card`
  already carries `transition: border-color .15s`, which eases it in on the
  press and back out on an early release. The selector is
  `.active-card.submitted-card.is-cancelling`, three classes on purpose —
  `.active-card:hover` also sets a border-color and the pointer is by definition
  on the card during a hold, so at two classes each the two rules tie and only
  source order decides. Measured: rest `rgba(255,255,255,.08)` / no ring, held
  `rgba(255,59,120,.55)` with `0 0 0 1px rgba(255,59,120,.12)`, released back to
  rest with the card still submitted.
- **Three things GO, they do not dim** — the wait estimate and both links.
  "Usually 3 days" answers a question you stopped asking the moment you started
  withdrawing, and it sits on the same line as the word that replaced it. "Quiet
  time. Go plan your launch" and "Review what was submitted" are invitations to
  go somewhere else, offered in the middle of an act you have to stay put to
  finish — dimming still leaves them there to be aimed at, so they take
  `opacity: 0` and `pointer-events: none`. What stays at .35 is only what
  remains TRUE while the bar runs: the progress, the store's sentence, the
  dates. Measured through a full cycle: 1 → 0 / 0 / .35 → 1, and the card is
  still submitted on release.

**The steps are still reachable once sent, read only.** Hiding them the moment
they were done made the work unreachable exactly when you most want to check it:
you could not see what you had declared without withdrawing first.
`_submittedSteps` redraws the steps face's own `.ios-step-card` rows — same
disc, same tick, same columns — minus the chevron, the risk dot (a risk you can
no longer act on is just a worry) and the Submit row. Folded behind **See what
you sent**, because the card's job now is the wait, not the form.

**Same rows means the same BLEED**, `margin: 0 -12px` on `.sub-steps`, copied
from `.ios-step-cards`. A row is padded 12px inside, so a list left sitting in
the card's own 20px padding puts its discs on 33 while every other disc, label
and release value on that card sits on 21 — the rows looked indented because
they were, and a negative margin on the container is the only thing that pulls a
padded row back onto the column. The bottom `-12` is NOT copied: there the list
is the card's last child and it cancels the card's bottom padding, here the
toggle follows it. Measured against the steps face, both at 418: row left 9,
width 400, disc 21, name 55, height 50.

**The ticks go quiet in this list, and only in this list.** That looks like it
contradicts "DONE IS NOT DIMMED" and does not: that rule was written for the
steps FACE, where green marks progress against rows that are still pending, so
the contrast is the information. Here every row is complete by definition —
being complete is the premise of the list, not news about any row in it — so a
column of solid `#31DC80` discs informs nobody, and since the Release button
went green it also pulls the eye off the card's only control. Dimmed BY COLOUR,
never by opacity on the row, which is the half of the original rule that still
holds: an opacity would paint the disc through gauze and composite to a muddier
version of whatever it was, reading as the wrong colour rather than a quiet one.

**It leaves green ALTOGETHER**, and a green at 18% was the intermediate step
that showed why. Green is this app's word for done *as news* — it exists to mark
one finished thing against others that are not — and nothing here is news: the
list is by definition entirely finished work you are re-reading. A faint green
still made the claim, just quietly, and still competed with the Release button,
which is now the only green on the card and should stay that way. So the disc
takes the PENDING disc's own soft white fill and the tick goes white at 60%,
which is the informational register the colour rule reserves for exactly this.
Measured across all three: pending `rgba(255,255,255,.07)` with a `.42` number,
steps-face done `rgb(49,220,128)` with a `rgb(15,42,26)` tick, submitted list
`rgba(255,255,255,.07)` with a `.60` tick.

**The toggle comes BEFORE the thing it toggles.** It sat after the list, so
opening pushed it down by the list's whole height — you pressed "See what you
sent" and the button fled from under the pointer, landing four rows lower as
"Hide what you sent". A control that moves as a result of being pressed makes
its own second press a hunt, and on a disclosure the second press is the
likeliest next thing you do. Above it, the list unrolls into space the button
never occupied; measured, the toggle's `top` is identical before and after
(334.3 → 334.3, moved 0).

It also stopped wearing `.ios-step-card--inline`. That modifier belongs to the
*modal's* inline lists and says `cursor: default` plus `background: transparent
!important` on hover — so rows that DO open something had no pointer and no
hover pill while claiming to be the same object, and the `!important` quietly
ate a `.sub-step:hover` written to put the fill back. Wearing the plain row
there is nothing to put back.

It said *Review what was submitted* first, and "review" was wrong twice:
reviewing is what you did BEFORE pressing Submit, and the word is already taken
on this very card — the STORE is the one reviewing. It is also **not violet**:
violet is the guide's, and on this card it belongs to the one link that sends
you somewhere else (the Marketing nudge). This opens in place, so it wears the
card's own `--text-dim` and brightens on approach, and carries no arrow —
an arrow means elsewhere.
Opening one goes through `openSubmittedStep`, which sets
`state.stepModalReadOnly = pid` for that visit; `closeStepModal` clears it on
every exit, so no path can leave a modal locked behind it.

**The banner IS the Content Rating bar**, because it is the same kind of object:
a strip above the step's body that says something about the whole of it. They
appear in one modal at once — open Content Rating from a submitted card — and
were two different boxes, this one at white 6% with an 8px radius, 11px type and
a 28px inset against the bar's 15% fill, 18px radius, 12px type and 24px. Four
points of difference for one claim. The width is the tell and it is **24, not
28**: `.cr-pinned` bleeds `-24` out of the scroller and pads 24 back, so the bar
lands on the scroller's content column, while this note lives OUTSIDE the
scroller (a sibling of `.submit-modal-body-wrap`) and has to reach that column
through the modal's own box. Everything else is `.cr-pinned-bar`'s, copied
rather than approximated — including the inset 1px ring instead of a border, for
the reason written there. Measured: both span 422.5 → 1052.5, 630 wide.

**Two things it does NOT copy.** The radius is the ANSWER PILLS' `--field-radius`
(8), not the bar's `+10`: that +10 exists so the bar's curve stays concentric
with a track at +3 wrapping a pill at +0 — three nested boxes — and this wraps a
line of text, so the arithmetic does not apply and at 18 it bowed out beside the
8px `.yn-btn`s below it. And its vertical margin is symmetric (10/10) where it
used to be `0 … 10`, flush against the header and clear of the body, which read
as something the header had grown. The POSITION is right and stays: outside the
scroller, because this is a statement about the whole modal and must not scroll
away, where `.cr-pinned` is about the list underneath it and sticks with it.

**It is a POINTER
lock, not a permissions model** — one class on the scroller plus a banner rather
than `disabled` on every control, because the step bodies come from a dozen
builders across four platforms and teaching each of them a second mode is how
they drift. A keyboard can still reach a field. Right trade for a prototype,
wrong one for a product.

**Submitting turns the guide into the month.** `_doFinalSubmit` sets
`state.guideCal = true` and `monthOffset = 0`, because pressing Submit answers
the question the checklist was asking and replaces it with a different one — not
"what is left to do" but "when do I hear back, and what until then" — and the
month is the surface that answers it. Set ONCE, at the moment of the event,
never derived from "is anything in review": derived, it would drag you back onto
the calendar every time you closed it for the next three days. `renderDashboard`
does **not** rebuild the guide column, so `renderGuide()` has to be called by
name or the face change lands on the next unrelated repaint. `smCardState`
copies the same two lines, or the face would only be reachable by walking every
step for real.

`_guideCalLede` is the why, printed above the month name — a surface that
changes under you without saying so is a glitch. It names the store, the date an
answer is expected (in the wait's own yellow, so the sentence and the band below
it are visibly one fact) and the one thing worth doing meanwhile, in violet with
an arrow, the card's rule for a link that leaves. It exists only while something
is `in_review` and is **not dismissible**: it is not a notification, it is the
state of the month you are looking at, and it leaves on its own.

**The wait note only exists during the wait.** It was gated `!isYours && !isBad`,
which let "Usually 3 days" survive into `live` — beside READY FOR DISTRIBUTION,
on a build that was finished and on sale. It answers "how long will this take",
and past the decision that question has no referent.

**The phase action is the STEP ROW's box, not a pill.** Release This Version is
the last act of the whole submission and the only control on that face, and it
wore `.imp-cta` — 30px, left-aligned, identical to the "View fix" button three
screens away. It is 400×50 at radius 8 with the rows' ±12 bleed now, measured
equal to a real `.ios-step-card`: the row that used to say Submit is replaced by
a row that says Release, same place, same size.

**And it is SOLID GREEN, both halves of which were argued.** Solid, because a
14% wash is what a state wears in this app, not a button — the first attempt
filled it with the phase's amber at 14%, which over the card's `#141414`
composites to `rgb(53,43,32)`, a muddy brown panel with a word in it. It had
been asked to look "like a step row being hovered", and that was the wrong
reference: a hover fill is faint on purpose because it only means "you COULD
press this", where this is the one thing there is to press. Green although the
phase is amber, because the two say different things — amber is the STATE, and
the card already prints it twice (PENDING DEVELOPER RELEASE, plus the 5% wash),
while the button is the act that ENDS the state, and finishing is green
everywhere else here. The known risk is that green also means *already done*, so
a faint green would have read as a finished thing; filled `#2fdc80` with `#08140d`
ink is the app's shape for a call to action, and nothing merely done is ever
painted that way. `is-bad` keeps its faint magenta on purpose — READ THE NOTES
is not a celebration and must not be dressed as one.

**It takes the STEP ROW's type and the step list's full bleed**, because the box
is already claiming to be a step row and half-measures showed. It shipped with
`margin: 0 -12px` and 13px mono at `.06em` in small caps, which measured 9px from
each side but **21 from the bottom** — the sides are pulled out of the card's
20px padding while the bottom sat inside all of it — and read thin and stretched
beside a `.ios-step-name`. `.ios-step-cards` solves the first with a third margin
value, so this takes the same `0 -12px -12px` and lands on the list's own 9 / 9 /
9. The family was never the difference (both are IBM Plex Mono); size, tracking
and case were, so all three go back to the row's — 15 / normal / none — and the
label keeps its sentence case, which is what the stores actually call these
buttons ("Release This Version" is Apple's, verbatim). Measured identical to
`.ios-step-name` on all five properties.

**The gear still turns the card over from here.** Reaching settings while a build
is out is the same want as reaching them while you are filling the form, so the
submitted face routes to `platformGearFromSteps` like the steps face does —
verified rotating out of the submitted card and landing on the account face, and
"Back to steps" returning to the submitted card with its disclosure still open.
The flip is correct on that button precisely because it IS a reverse: the same
press, reversed, brings you back to exactly what you left.

**It is the LAST thing in the card**, because on the other face it already is:
the steps list ends in the Submit row, and Release is that same object seen from
this side. One shape serves both faces — the facts at the top, everything you
read in the middle, the single act at the bottom. It used to sit above "See what
you sent", which made the quiet link read as the card's conclusion. The
read-only steps are reference, so they belong in the middle with the other
things you read. The cost, paid knowingly: opening the list pushes the button
down by the list's height — which is NOT the bug the toggle had, where the
control you pressed fled from under your own pointer and made its second press a
hunt. Here a different control moves as an ordinary consequence of a list
growing, exactly as a Submit row sits below a list that gained a step. Verified
order, collapsed and expanded: head, release block, segbar, state, note,
toggle, [steps], action — `lastElementChild` is the button either way.

**SUBMITTING DOES NOT FLIP THE CARD — IT CLOSES IT.** Read this before reaching
for `rotateY` in `_doFinalSubmit` again.

The flip is already spoken for, and it means one specific thing: **the other
side of this card**. The gear turns the card over to the account/connect face,
the same gear turns it back, and nothing has changed in between — a reversible
look at the reverse of the same object. Submitting is not that: the card moves
FORWARD into a state that costs a 1.4s hold to undo. Turning something over to
say it has advanced spends the "look at the back" gesture on a change of state,
and then the two cannot be told apart.

That overload had already produced a measurable bug, which is how it was caught.
`_platformHeadActions` branched only on `steps` vs everything-else, so a
submitted card fell into the ACCOUNT arm: its gear came out **lit** (`--active`,
the highlight that means "you are inside a temporary, reversible view") with the
tooltip **"Back to steps"** — the card announcing itself as a settings detour you
could reverse with one press, on the one face where going back is a withdrawal.
Submitted now shares the STEPS arm (both want a way to the account); the alert
dot is kept for `steps` only, since nagging about an unconnected account after
the build has gone points at a door that has already closed.

The motion is vertical: the steps go and the box closes over the space they
occupied, from the steps face's height to the submitted card's own, measured
both ways in JS because only JS knows them. `cancelSubmission` is the same
mechanism run the other way — the box OPENS and gives the height back — so the
two cannot drift into different curves, which two hand-written rotation blocks
120 lines apart were already halfway to doing.

Three details that are load-bearing:

- **The header and the release block are excluded from the fade**
  (`.active-card.is-advancing > *:not(.active-card-head):not(.card-release-block)`).
  They are identical across both faces, and fading what did not change is what
  makes a swap look like two cards trading places instead of one card losing its
  list.
- **`overflow: hidden` is set and then CLEARED.** It makes the close read as a
  close rather than as content spilling past a shrinking frame; left on, it
  would clip a card that later grows — which "See what you sent" does by 216px.
- **There is no out-phase.** Nothing needs animating away: the header and
  release block survive the swap, and the steps are precisely what the closing
  box removes.

`state.platformFlippedCardHeight` went with the rotation. It pinned the new card
at the OLD card's height so the flip did not end in a jump, and was written and
deleted in four places while no render function ever read it. Here the height
change IS the animation; pinning it would pin the thing being animated.

Verified by sampling every 55ms: submit 376 → 231.3, cancel 231.3 → 376, both
interpolating smoothly with `transform: none` at every sample, every inline
style cleared and `is-advancing` removed at the end. The gear's own flip still
rotates, "Back to steps" from the account face lands back on the submitted card,
and expanding the steps afterwards grows the card to 447.3 with all four rows
21px clear of its bottom edge.

**To see any of it:** `smCardState(pid)` (app.js) cycles the four phases 2.5s
apart, `smCardState(pid, 'accepted')` holds one, `smCardState(pid, 'off')`
returns to the steps face. It writes the same state a real submit writes, so it
is the real card, not a mock. These faces went a long time unexamined because
reaching them took every step, an account, a track and a press.
