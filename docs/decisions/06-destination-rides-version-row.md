### The destination rides the VERSION row

**Shape 4, and the one the section below predicted.** The picker is back in the
release block — but not on a row of its own: it sits in the FIRST row's value
cell, hard right, beside the build it routes. The row already ended in empty
card, so the destination now costs **no vertical space at all** and the block
stays the two lines it has been since shape 2. Measured on a 418px card: label
at 21, facts at 97, picker 160×30 with its right edge at 21 — the same box, to
the pixel, as the Upload Build pill two rows down.

It wears **`.submit-track-pick`, the same class it had in the Submit row**, so
its 160×30 is one rule in one place; there is no second sizing rule to drift.
`.rel-value--pick` is all that is new — the cell becomes a flex row, the picker
is `flex: none`, and the text takes what is left.

**It breaks, it does not clip.** The grid is `minmax(320px, 1fr)`, so at the
narrow end the value cell has ~200px and the picker alone wants 160 — there is
no arrangement where "v1.0 BUILD 42" also fits. Shrinking the text to make room
turned the build number into "4…", and a clipped build number is worse than a
second line, because it is the one fact on the row nobody can reconstruct. So
the line holds a floor of `min-width: 120px` and the picker **wraps under it**
when the card cannot seat both (measured: one 30px row at 418 and at 420, two
rows totalling 50 at 360), with `margin-left: auto` keeping it on the same right
edge either way. The ellipsis stays only as the last resort.

The Submit row keeps **nothing** of it — `trackPicker` there is now the empty
string. A value in two places drifts, which is what shape 1 was punished for.
The cost, paid knowingly: `submitStepClick`'s gate 3 now spotlights **up** the
card rather than at its own row. That works because
`.active-card.is-spotlight .card-release-block:not(:has(.is-spotlit))` already
existed — the block stays lit when the lit thing is inside it (measured: card
rows at .18, block at 1, chip `is-spotlit`).

Three earlier shapes and why each went:

1. **A pill in the release block.** An empty "Select track" spent a row of a
   status card asking a question, and `submitStepClick`'s third gate had to
   spotlight it — a prerequisite you could only satisfy by finding a ghost
   control elsewhere on the card.
2. **Three inline pills**, grown by the row when Submit was pressed. They
   overflowed the card at App Store label lengths, and they only existed after
   every other step was done, which made the last decision the least reachable.
3. Labels **"TestFlight / internal"** → **"TF (internal)"**: measured, the chip
   leaves 114px for the label and "TestFlight (Int)" needs 115. One pixel.

Nothing is preselected, here or anywhere — the destination is a decision, and a
silent default would make it on your behalf. Gate 3 now spotlights the chip in
its own row, so the row points at itself.

4. **The chip in the Submit row** (shapes 1–3's successor, and what shape 4
   replaced). The tension it never resolved: a Submit button should
   *celebrate*, and that one also asked a question, so the picker and the act
   of sending competed for one row. Shape 4 is the resolution this file
   predicted — the destination back in the card's chrome, Submit reduced to the
   single confident act.

**`.rel-track`'s rules in style.css are still dormant — do not sweep them.**
Shape 4 did NOT revive them: it reuses `.submit-track-pick` instead, because
that is where the 160×30 already lives and duplicating a size is how two copies
of a control start to disagree. `.rel-track` remains the older, pulled-left
ghost-pill treatment from shape 1. Keep or delete it deliberately, not by
sweep.

Still missing, and wanted by every shape so far: a Submit step with a body that
states what each destination implies, since they are different review paths
with different waits.
