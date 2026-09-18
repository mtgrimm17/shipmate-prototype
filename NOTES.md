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

- **The re-split, not yet started** (2026-09-18). `CLAUDE.md` is **586 KB,
  ~146,000 tokens** — larger than a context window, so it now costs a
  conversation most of its room before anything is asked. The v6.37 split
  (162 KB → 22 KB) was discarded as stale; `docs/decisions/` and this file are
  in, built from that older version. Redo the split against the current file:
  archive the long narrative sections verbatim, keep architecture, invariants,
  versioning, security and Git Workflow resident, index the archive by one line
  each. Verify every `###` heading is either kept or archived before committing.
  No app file changes, so no version bump.

- **Existing `docs/decisions/01`–`16` are cut from the v6.37 file**, so several
  are stale — `Shippy is two layers` was replaced upstream by
  `Shippy is the live rig (v6.80)`, and the Versioning and ship.sh files predate
  the `.ship-message` workflow. Re-cut them from the current `CLAUDE.md` rather
  than keeping them.

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

- **v6.82** per `CLAUDE.md`'s own header; `origin/main`'s tip reads
  **v6.96 — the description gets its room, and Data privacy stops waiting**.
  Read the live number the way Git Workflow prescribes before minting one.

---

## Must survive the re-split

_Things the v6.37 split added that the current `CLAUDE.md` does not have. Carry
them across when redoing it. The ship workflow is NOT on this list — the team's
file documents it properly already (Claude writes `.ship-message`, Mark runs
`./ship.sh` bare, Claude runs no git at all)._

- **A Working Agreement at the top**: read `NOTES.md` first every conversation,
  update it without being asked, and **never read a source file whole**.
- **The file-size warning, which is the expensive one.** `render.js` 1.09 MB,
  `app.js` 901 KB, `style.css` 848 KB, `splash.html` 402 KB, `state.js` 314 KB,
  `index.html` 275 KB. Grep for the function or rule by name, then read that
  range with offset+limit; delegate broad exploration to a subagent so the file
  dumps stay out of the main thread.
- **A one-line index of `docs/decisions/`** at the foot of `CLAUDE.md`, with the
  instruction to open a file only when the task touches its subject.

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
