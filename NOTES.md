# Shipmate — Working Notes

**Claude maintains this file. Mark does not edit it.**

Volatile state only: what is in flight right now, what was just tried, what is
half-done. Stable architecture lives in `CLAUDE.md`. The team backlog lives in
`TASKS.md`. Design rationale lives in `docs/decisions/`.

Keep this under 100 lines. When a thing is done and shipped, delete it — the git
log is the changelog.

---

## Now

_What is actively being worked on. One entry, usually._

- **⚠️ DO NOT RUN `./ship.sh` UNTIL THE PULL IS DONE** (2026-09-18). The working
  tree holds a `CLAUDE.md` split made from **v6.37**, and origin is 44 commits
  ahead at **v6.91** with 14 new `###` sections. ship.sh does `git add -A`, so
  shipping now would commit the stale file and delete the team's additions.
  Sequence: save the slim copy aside → `git checkout -- CLAUDE.md` → commit
  `NOTES.md` + `docs/` (uncontested, absent upstream) → pull → re-run the split
  against their current file.

- **Context hygiene pass** (2026-09-15) — `CLAUDE.md` split: 162 KB → 22 KB, with
  fifteen narrative sections moved verbatim to `docs/decisions/`. `NOTES.md`
  created. Nothing shipped yet; no version bump, as no app file changed.
  **Upstream `CLAUDE.md` is now 586 KB (~146k tokens)** — the problem got roughly
  four times worse in three days, so the re-split matters more, not less.

## Next

_Picked up as soon as Now clears. Full briefs:
`docs/decisions/16-open-work-carried-from-v6.26.md`._

- **Editable-field affordance in the Mac preview.** Jaco's brief sharpened from
  "boxes and outlines are too loud" to an affordance problem: nothing says
  *which fields are editable*. Target is one resting mark on every editable
  field; the loud colours can then come down. Decide this before touching
  values — three edges are load-bearing state and must keep their weight.
- **Make the Submit button celebratory.** Debt taken on deliberately in shape 4.
  Reference is the Release button on the other face. Trap: it must not also ask
  a question.
- **Animate submit → in-review properly.** Current 420ms close is the honest
  minimum. Header and release block must not animate.
- **Mac App Store preview fidelity.** Navigation and sidebar are done (v6.28);
  the page's fidelity to Apple's layout is still open.
- **Calendar pass.** No brief yet.

## Tried and rejected

_So it doesn't get re-attempted. Include why._

- _(empty)_

## Open questions

_Blocked on a decision, Mark's input, or someone else's work._

- **Production inference model** — Sonnet 5 is the leading candidate for
  real-time; open-weight fine-tuning (Qwen2.5-32B range) is a later option once
  labelled data exists. Benchmark spec: `shipmate-ai-benchmark-spec.md`.
- **Play and Arcade sidebar glyphs** — still Mark's redraws; Jaco has said he
  will supply the exported SVGs. Swap is one line each when they land.

## Last shipped

_Most recent published version and what was in it._

- **v6.37** — Submission: submitted card leads with its state, tab selection
  carries weight, three Improve end-cards.

---

## Must survive the re-split

_Facts added to `CLAUDE.md` after the v6.37 split. When redoing the split against
upstream's current file, carry these across — they are not in the team's copy._

- **`./ship.sh` is how this repo publishes.** Never hand Mark a raw `git push`.
  Pass the commit message as its argument: `./ship.sh "v6.38 — what changed"`.
  It adds, commits, rebases and pushes, and clears the stale `.git` locks the
  sandbox leaves. Now written into `CLAUDE.md` → Git Workflow.
- **ship.sh runs `git add -A`** — it commits the whole working tree. Check
  `git status` before telling Mark to ship.
- The **Working Agreement** section, the **file-size warning**, and the
  **Decision Archive index**.

---

## How Claude updates this file

- **On picking up work** — write it under `Now`, with the date.
- **On a dead end** — move it to `Tried and rejected` with the reason, same turn
  it fails. This is the highest-value section; it is what a fresh conversation
  cannot reconstruct.
- **On a version bump** — replace `Last shipped`, clear the finished item from
  `Now`.
- **At the end of any conversation that changed a file** — make sure `Now`
  reflects reality, so the next conversation can start from one read.
- **Prune while writing.** If an entry is finished and shipped, delete it rather
  than moving it to a Done list. This file is a handoff, not a history.
