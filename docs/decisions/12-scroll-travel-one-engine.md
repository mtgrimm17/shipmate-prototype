### The travel is ours, not the browser's

### AND EVERY MEASUREMENT IN THIS FILE WAS TAKEN IN ONE ENGINE

Read that heading first, because it is the expensive half. Claude measures in a
Chromium pane. **Jaco develops in Safari.** Nobody said so for two sessions, and
a scroll bug he could see on every single press was un-reproducible here on every
single press — sixteen trips, all smooth, all measured. Three separate "fixes"
shipped against Chrome-only evidence before the word *Safari* appeared and
explained all of it at once.

So: when a report and a measurement disagree flatly, **ask which browser before
writing a line of code**. And prefer a mechanism with no per-engine behaviour to
one that has to be verified in an engine you cannot drive.

`_smScrollCentre` (app.js) is that preference applied. It replaced
`el.scrollIntoView({ behavior: 'smooth', block: 'center' })`, which looked like
the obvious tool — one line, and it finds the scrolling ancestor for you.
**Finding it for you is the problem.** Which box an engine decides to scroll, and
whether it honours `smooth` on a NESTED scroller, is per-engine, and this surface
stacks two: the modal's `.submit-modal-scroll` (`overflow: hidden` on the Mac
face — still a scroll container) and `.mac-spp-main` inside it. Chrome picked the
inner one and animated it, measured 466 → 2 in eleven interpolated steps. Safari
moved the page and left the scrollbar where it was — the signature of the other
box having been scrolled, or of the smooth behaviour being dropped.

It now names its own scroller (`_smNearestScroller`, the nearest ancestor that
really overflows), computes the `scrollTop` that centres the target, clamps it to
the scrollable range, and writes it frame by frame. That removes three engine
differences in one move: nothing else can be chosen to scroll, no engine's smooth
implementation is involved, and any scrollbar follows because the position really
is changing every frame.

- **420ms** is the card's own advance duration (`.is-advancing`), borrowed rather
  than picked so two travels in one app do not run at two speeds.
- The curve is the app's sine — the shape `cubic-bezier(.37,0,.63,1)` draws for
  the carousel glint — written as its closed form, `0.5 − cos(πt)/2`.
- **A user gesture wins.** A wheel, touch or key aborts the animation where it
  stands rather than fighting whoever grabbed the scroller. Verified: interrupted
  at 82, settled at 82.
- `prefers-reduced-motion` jumps instead, the one case where an instant landing
  is right.

Verified in Chromium across all sixteen trips (eight targets from the top, eight
from the bottom): every trip with real distance takes 12 interpolated steps, none
jumps, and the no-op cases correctly do nothing. iOS's own scroller — the modal
body — travels 0 → 512 and 671 → 0 on the same twelve. **Safari is unverified
from here and has to be checked by hand**; that is the honest state of it.
