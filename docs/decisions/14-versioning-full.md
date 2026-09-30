### Versioning — required on every change

Bump **once per publish**, not once per edit — a batch of changes that ships
together is one version. (v5.36→v5.48 burned twelve numbers by bumping on every
tweak; the cost is only cosmetic, but it makes the history unreadable.)

**ONE EXCEPTION: A CACHE THAT HAS ALREADY DIVERGED.** `?v=` is not decoration,
it is the only cache key these files have. A long session of edits under one
unpublished number means a browser that loaded the app early is still holding
those bytes while the files on disk have moved on — and the symptoms are
indistinguishable from real bugs. That is exactly how an afternoon went: a scroll
teleport that had been fixed and measured kept being reported, because the tab
reporting it was running the pre-fix `app.js`. If the file changed and anyone has
loaded the old one, bump. Test with a hard reload before concluding anything
about behaviour that "should" already be fixed.

**BUT THE NUMBER IS A SHARED RESOURCE, AND THAT EXCEPTION COLLIDED WITH IT.** The
bump above was taken mid-session as v6.28 → v6.29 — while Mark was shipping his
own **v6.29, v6.30 and v6.31** from the Distribution side. Two people minted the
same number on the same afternoon, and the local repo had no idea because its
`origin/main` was a day stale. This work went out as v6.32 for that reason, not
v6.29.

**THE FETCH IS FOR WHOEVER WRITES THE NUMBER INTO THE FILES, NOT FOR WHOEVER
RUNS `ship.sh`.** That distinction was missing for a version and the note
quietly became a chore for the wrong person. The workflow at the terminal is
unchanged and is still exactly one command:

```bash
./ship.sh "v6.xx — description of change"
```

`ship.sh` already pulls and rebases; nothing needs to be run before it. The
collision risk belongs to the step BEFORE that — choosing the number, which
happens hours earlier, in a session that may be holding a stale `origin/main`.
When Claude is the one choosing, Claude cannot check: **it is barred from every
git command in this repo** (see Git Workflow). So it either asks, or it picks
and accepts the conflict.

**AND THE CONFLICT IS A REAL BACKSTOP, WHICH IS WHY PICKING BLIND IS SAFE
ENOUGH.** A duplicated number cannot publish quietly: both sides edit the same
fifteen version lines, so `ship.sh`'s rebase conflicts on `index.html` and
`splash.html` *every* time. There is no path where new bytes go live under a
number already taken — the failure this section exists to prevent is caught by
construction. The cost of tripping it is one paste of the conflict and one pass
to resolve it (see "`ship.sh` REBASES" below), not a bad publish.

So: no extra step at the terminal. A fetch is worth it only when someone who
CAN run git is picking the number and happens to know the other side has been
shipping that day.

Current version: **v6.37** → next is **v6.38**, then **v6.39**, etc. (v6.29 –
v6.31 are Mark's Distribution work, shipped in parallel.)

Update the version in **three places**:
1. `index.html` — all `?v=X.XX` cache-bust params on script/style tags (14 of them)
2. `index.html` — the footer badge: `<span class="app-footer-version" id="app-footer-version">vX.XX</span>`
3. `splash.html` — the version badge text (around line 1366)

Note on splash.html: the iframe that used to load it was ported into `splash.js`
back in v2.34, so nothing references `splash.html` any more. Its badge is
updated for consistency only — there is no `src="splash.html?v=X.XX"` to change,
despite what earlier versions of this file said.

Always include the new version number in the ship note, e.g. `"v6.26 — add tooltip to age rating cell"`.

---

## Security — Read This First

`config.js` is gitignored. It contains real API keys and must never be committed.

```js
// config.js (gitignored — never commit)
const CONFIG = {
  CLAUDE_API_KEY:     'sk-ant-...',
  IGDB_CLIENT_ID:     '...',
  IGDB_CLIENT_SECRET: '...',
};
```

The repo contains placeholder keys in `index.html`:
```js
const CONFIG = {
  CLAUDE_API_KEY:     '__CLAUDE_API_KEY__',
  IGDB_CLIENT_ID:     '__IGDB_CLIENT_ID__',
  IGDB_CLIENT_SECRET: '__IGDB_CLIENT_SECRET__',
};
```

**Never replace these placeholders in index.html with real keys.** Real keys go in `config.js` only.

API keys are injected automatically by GitHub Actions at deploy time — contributors do not need a local `config.js`.

---

## Git Workflow

**Claude must NOT run any git command in this repo — no `git add`, `commit`, `pull`,
`push`, `gc`, or `maintenance`, and no `rm` of `.git/*.lock`.** The Cowork sandbox is
denied permission to delete files inside `.git` (even ones git itself just created),
so any git operation Claude runs leaves stale `.git/*.lock` files and half-written
`.git/objects/tmp_obj_*` behind. Those leftovers then break the human's `./ship.sh`.
This was the cause of the recurring "index.lock: File exists" failures.

Division of labor:
- **Claude** edits files only, and bumps the version number (see Versioning). Claude
  never commits. When done, Claude tells the contributor to run `./ship.sh`.
- **The contributor** runs everything git via `./ship.sh` from a real terminal (which
  *can* clean up `.git`, and self-heals any stale locks on startup).

Typical workflow:
1. Describe changes to Claude in Cowork — Claude edits the files (no git).
2. Test locally: `python3 -m http.server 8080` → open `http://localhost:8080`
3. Publish: `./ship.sh "v5.xx — description of change"` (commits, pulls, pushes).

GitHub Pages auto-deploys from `main` within ~30 seconds of a push.

Include the version number in the ship note: `./ship.sh "v6.26 — description of change"`.


---

## Renumbering history (relocated from CLAUDE.md)

Every time a batch of edits under one unpublished number was collapsed to a single published version, or a number was burned as a local cache-bust — with the lesson each left. Kept as history; the live rule is in CLAUDE.md.

Current version: **v6.82** → next is **v6.83**. (v6.29 – v6.31 are Mark's
Distribution work, and **v6.42 and v6.48 are Adam's** — shipped in parallel and
touching none of this.)

**AND v6.83 – v6.90 ARE LOCAL CACHE-BUSTS, WHICH IS THE TENTH TIME.** Live was
read as **v6.81** by both of this section's cheap doors — `.ship-message.sent`
sitting on disk with no unconsumed `.ship-message` beside it (so the push really
landed), and a fetch of the live page with a throwaway query on it, which is the
step the fetch must never skip. So 6.82 was the next free number and is what this
batch takes.

The pinned-nav work was MEASURED at 6.88 – 6.90 because this pane had already
been served 6.74 – 6.87 in earlier sessions, and **a number this session has
already used is not a cache-bust**. None of 6.83 – 6.90 has ever been served to
a cold browser, so shipping at 6.82 costs nothing; what is poisoned is this pane
only, and anything further that needs measuring here has to start above 6.90.


It ships as **v6.76**, the next number after live. 6.77 and 6.78 were served to
the pane while measuring, so they are not cache-busts in this session any more —
which costs nothing for the publish (a cold browser has never seen either) and
means the NEXT thing that needs testing has to bump past 6.79 rather than
re-loading one of them.

**AND IT DID — THE THREE FIXES BELOW WERE MEASURED AT 6.80 AND SHIP AS v6.76.**
The description's stagger, the found line's survival and the well's probe all
had to be seen in the pane, and that is exactly the rule the paragraph above
states: a number this session has already served is not a cache-bust, so testing
had to start above 6.79. Jaco: *"necesito que sea 6.76."*

**And 6.76 is still free, which is the only thing that matters.** `.ship-message`
was still sitting unconsumed when the three landed — `ship.sh` renames it only on
a successful push — so **v6.76 was never pushed** and nothing has ever been
served under it. Live is v6.75, 6.76 > 6.75, and the key only goes UP. The two
batches publish together as one version, which is this section's opening rule
rather than an exception to it.

**What it costs is local and temporary**: 6.76 through 6.80 have all been served
to this pane, so none of them is a cache-bust here any more and the next thing
needing a measurement has to start above 6.80. A cold browser has seen none of
them, so the publish pays nothing. Seventh time this file records the move.

**AND THE EARLIER BATCH COLLAPSED 6.78 → v6.75, WHICH IS THE SIXTH TIME.** Jaco:
*"vamos a pushear esto a v6.75."* Fetched before renumbering, exactly as the
habit below says: the footer badge reads **v6.48**, so every number from 6.49 up
has been minted by EDITING and none of them has bytes behind it. 6.75 > 6.48, so
the key still only goes UP — the one thing that makes a renumber safe.

**The numbers this session burnt are all local cache-busts.** 6.74 through 6.78
were each needed to get the pane to fetch a fresh `app.js` / `render.js`, which
is this section's ONE EXCEPTION working as written. The cost is the cosmetic one
this section opens with: 6.76 – 6.78 are gaps with nothing behind them.

**AND THE HEADINGS WERE RELABELLED HERE, AGAINST THE USUAL RULE.** Every earlier
renumber kept its edit-time labels because they marked decisions made across
real sessions. These three did not: 6.76 and 6.78 are one afternoon's work on
one surface, and the "v6.76 → v6.78" on the description's wait was a correction
inside a single unpublished batch rather than a version anyone could have run.
So the entry keeps the correction and states it as a first pass, and there is no
live v6.76 to go looking for. **Keep the labels when they are a history; collapse
them when they are only a cache key.**

**AND THE WELL BATCH COLLAPSED 6.82 → v6.74, WHICH IS THE FIFTH TIME.** Jaco:
*"v6.74 por favor."* Fetched before touching a line: **live is v6.48**, so every
number from 6.49 up was minted by EDITING and not one of them has bytes behind
it — the library-inside-the-well work alone burnt 6.74 through 6.82 getting
itself testable. 6.74 > 6.48, so the key still only goes UP, which is the one
thing that makes a renumber safe.

**The fetch is what turns this from a guess into a fact**, and it is the whole
reason that habit is written down: the sections below reason at length about
Claude being unable to read `origin/main`, and the live page answers the only
question that matters in one request. It also corrected this file's own
assumption — several entries above talk as though live had moved past 6.60.

**One thing it costs locally, and it is the cache trap in reverse:** this
session has already served `?v=6.74` to the pane while testing, so that number
is NOT a cache-bust here any more. It does not matter for the publish (a cold
browser has never seen it), and it does mean any further measuring in this
session needs a number above 6.82 rather than a re-load of this one. The note
headings keep their edit-time labels, as always.

**AND v6.63 – v6.67 WERE BURNT ON THE PANE'S OWN CACHE, WHICH IS THE ONE
EXCEPTION WORKING AS WRITTEN.** Live was v6.62 and this batch should have been
v6.63 — but the number had to move five times to be testable, and once for a
reason worth carrying: **the pane had already fetched `render.js?v=6.64` at an
earlier point in the same session**, so bumping BACK to a number it had seen
served the stale file while `app.js` came back fresh. The tell was
`buildObLangList.toString()` not containing the attribute that was plainly in
the file — this file's own "check the running function, not the file", one
layer out: it is the URL that is cached, so **a number you have already used is
not a cache-bust**. Collapsing to 6.63 was the tidier option and was refused for
that reason: 6.63 – 6.67 are poisoned locally, and the cost of skipping them is
the cosmetic one this section opens with. Ships as **v6.68**.

**AND THE WHOLE 6.45 – 6.70 RUN COLLAPSED BACK TO v6.45, WHICH IS THE THIRD
TIME THIS FILE RECORDS THE SAME MOVE.** Jaco: *"necesito que lo pusheemos a
6.45, ya que la live actual es 6.44."* Everything from the cell rewrite through
the accordion, the travel work and this batch was minted by EDITING — twenty-six
numbers, none of them by publishing — so live never moved off **v6.44** and not
one byte was ever served under any of them.

The rule is unchanged and is the only thing that makes this safe: **never go
back past LIVE.** 6.45 > 6.44, nothing is cached under 6.45, so the key still
only goes UP. Had any one of those twenty-six gone out, the only correct move
would have been forward.

**The note headings keep their edit-time labels** (v6.46, v6.51, v6.52–70 …),
deliberately, for the reason the v6.62 → v6.39 renumber gives: they are the
order the decisions were made in, which is what makes them readable as a
history. All of them ship together in **v6.45**. Don't go looking for a live
v6.70.

**AND THE 6.46 – 6.54 RUN COLLAPSED TO v6.46, WHICH IS THE FOURTH TIME.** Jaco:
*"me lo pushees en v6.46 por favor."* Live is **v6.45**; everything since — the
forced alignment, the count column, the tooltip discs, the blue leaving the open
row and the layout flag's storage — was minted by EDITING, nine numbers, none of
them ever served. So it all publishes as **v6.46**, and 6.47 – 6.54 are gaps
with no bytes behind them.

Safe for the one standing reason: **never go back past LIVE.** 6.46 > 6.45 and
nothing was ever cached under any of the nine. The note headings keep their
edit-time labels for the usual reason — they are the order the decisions were
made in.

**AND THEN IT WENT TO v6.47, WHICH IS THE SKIP-IF-UNSURE RULE DOING ITS JOB.**
The sticky-header fix landed minutes after that renumber, and by then *"pushees
en v6.46"* had been acted on or not — unknowable from here, because Claude
cannot read `origin/main`. Staying on 6.46 risks publishing new bytes under a
key browsers may already hold, which is the diverged-cache failure this section
exists to prevent; going up costs one number this section's own first line calls
cosmetic. So 6.47. If 6.46 never shipped, both batches simply publish together
as 6.47 and 6.46 joins the gaps.

**AND 6.48 AND 6.49 CAME BACK TO v6.47 — ASKING BEATING THE SKIP RULE TWICE IN
ONE SESSION.** The 5px tooltip gap took 6.48 and the count's colour 6.49, both
under the skip-if-unsure rule, because this session cannot read `origin/main`.
Jaco supplied the two facts it cannot get for itself — *"just minor changes so
we can push on the same?"* and then *"6.47 is fine"* — so the whole batch
publishes as **v6.47**, and 6.48 and 6.49 join the gaps with no bytes behind
them. Safe for the one standing reason and only that one: the key still only
goes UP against LIVE. The headings below keep their `(v6.48)` / `(v6.49)` labels
for the usual reason — they are the order the decisions were made in.

**AND v6.51 THROUGH v6.53 WENT THE SAME WAY, for the same reason.** v6.51 was
written up and, as far as this session could tell, never shipped; the accordion
port then needed the key to move three more times to be testable — once to load
the new `.pvt-*` rules at all, once after the `.tooltip-anchor` display fix, and
once after the scrollbar lane. So the whole port publishes as **v6.54**, one
version, and 6.51 – 6.53 are gaps with no bytes behind them.

**If v6.51 DID go live**, this is still correct and the key still only went UP —
nothing published under 6.52 – 6.54, and 6.54 > 6.51. Worth knowing which,
though, because it decides whether the v6.51 privacy-matrix work is already out
there or is riding along inside this publish.

**v6.45 THROUGH v6.50 WERE MINTED AND NEVER SERVED, which is the ordinary case
and not a mistake.** v6.44 was live, so the cell rewrite took 6.45; then the
specificity fix 6.46, the box-becomes-the-cell correction 6.47, the meta slab
6.48, the header band 6.49, the 2px scroll 6.50 and the block anchor 6.51 — each
one needing the cache key to move again to be testable at all, because `?v=` is
the only key these files have and the pane will happily serve the old bytes.

That is this section's ONE EXCEPTION — a cache that has already diverged —
working exactly as written: the number only ever went UP, and none of the six
skipped ones had bytes behind them. Nothing to reclaim, and **all seven publish
as one version**, which is the rule this section opens with. The cost of the
exception is cosmetic by design: a gap in the history, against a class of bug
that is indistinguishable from a real one.

**AND v6.43 IS WHAT ASKING BUYS.** Live went to v6.41 (ours) and then v6.42
(Adam's, nothing of ours in it), so the next free number is 6.43 — and the only
way to know that from here is that Jaco said so. Claude cannot read
`origin/main`. Left to the skip-if-unsure rule below it would have picked 6.42
and collided with a number already served, which is the one failure that rule
exists to prevent; guessing upward would then have been *wrong in the other
direction* only by luck. The ordering holds: **ask first, guess up only when
nobody can say.**

**THE SKIP-IF-UNSURE RULE, AND THE ONE THING THAT BEATS IT: ASKING.** This
batch was written up to v6.42 mid-session on the reasoning that v6.41 had been
minted by editing and Claude could not tell whether it had been served — being
barred from git, it cannot read `origin/main`. The asymmetry is real and worth
keeping: staying on a number that is LIVE publishes new bytes under a key
browsers have already cached, which is the diverged-cache failure this section
exists to prevent, where skipping one burns a number this section's own first
line calls cosmetic. **When the number's status is unknown, go up.**

**But Jaco knew** — *"push this to 6.41"* — and it shipped as v6.41, put back
across all fifteen lines. Safe for the standing reason and only that one: live
was v6.40 and **nothing had ever been served under 6.41**, so the key still only
went UP. Same move as the v6.62 → v6.39 renumber and the v6.41 → v6.40 one
before it, and the third time this file records it: the rule is not "never go
back", it is "never go back past LIVE".

So the ordering to keep is: ask the person who can read `origin/main`; skip only
when nobody can say. Guessing upward is the safe default, not the right answer.

**v6.40 shipped as the number that had been minted by EDITING and never served.**
It was briefly written up to v6.41 and put back — the same move as the v6.62 →
v6.39 renumber above, and safe for the same one reason: live was v6.39 and
nothing had ever been cached under 6.40, so the key still only went UP. Bump once
per publish; the number already sitting in the files unpublished IS the one that
publish takes. v6.41 is the next batch, minted after 6.40 really went live.

**THE NUMBER WENT BACKWARDS ONCE, ON PURPOSE — v6.62 → v6.39.** Live sat at
v6.38 while the working copy had been edited up to v6.62: twenty-three numbers
minted by EDITING, none of them by publishing, which is exactly what the "bump
once per publish" rule above exists to prevent. So the whole batch shipped as
**one** version, v6.39, and that is the number live jumped to.

Renumbering was safe for one reason and one only: **no number between 6.39 and
6.62 had ever been served.** The version string is a cache key, so it must only
ever go UP against what is LIVE — 6.39 > 6.38 and nothing had bytes cached
under any of them. Had even one of those gone out, the only correct move would
have been forward.

The other half was the collision risk this section is mostly about: picking the
next number after live is what the OTHER side will also pick. Jaco confirmed
Mark was not shipping that day, which is the check that made 6.39 free.

**The note headings below still carry their edit-time labels (v6.55, v6.58,
v6.60, v6.62 …) and are deliberately NOT rewritten.** They are the order the
decisions were made in, which is what makes them readable as a history; all of
them shipped together in v6.39. Don't go looking for a live v6.55.

**AND THE SHIPPY BATCH COLLAPSED 6.86 → v6.80, WHICH IS THE NINTH TIME — AND
THE NUMBER IS JACO'S, NOT THE NEXT FREE ONE.** Live is v6.77, read off
`.ship-message.sent` (the cheap, uncacheable way this section prescribes), so
6.78 was free and is what this batch was headed for. Jaco: *"necesito que me
lo pushees en v6.80."* 6.80 > 6.77, so the key still only goes UP, which is
the one thing that makes any renumber safe.

**AND 6.79 TURNED OUT NOT TO BE A GAP — the rebase is what said so.** This
note first claimed nothing had been served under 6.78 – 6.80. `ship.sh`
conflicted on all fifteen version lines and the markers read **v6.79 on the
HEAD side**: somebody else had shipped it while this batch was being written,
which is precisely the check "`ship.sh` REBASES" prescribes and the reason it
prescribes reading the markers rather than trusting `--theirs` blind. HEAD's
number was LOWER than ours, so `--theirs` was still right and 6.80 was still
free. **6.78 is the only real gap.** Read the conflict, never assume it. The
work was MEASURED at 6.85 – 6.86 because this pane had already been served
6.74 – 6.84 in earlier sessions — a number this session has already used is
not a cache-bust — so anything further needing a measurement here starts
above 6.86.

**AND THE ADD-PLATFORM BATCH COLLAPSED 6.84 → v6.77, WHICH IS THE EIGHTH TIME.**
Jaco: *"can you push this to 6.77?"*

**Live is v6.76, read the cheap way this section now prescribes** — off
`.ship-message.sent` sitting on disk beside an unconsumed `.ship-message`,
rather than off a fetch that can be served from a cache. So 6.77 is the next
free number and the key still only goes UP, which is the one thing that makes a
renumber safe.

The work was MEASURED at 6.84 because 6.77 – 6.80 were burnt in this pane while
the previous batch was being tested (a number this session has already served is
not a cache-bust) and the add-platform work needed four more loads to see the
CSS and the JS land. **None of those eight has bytes behind it**, so shipping at
6.77 costs nothing: a cold browser has never seen any of them, and what is
poisoned is this pane only — anything further that needs measuring here has to
start above 6.84.

**The section heading was relabelled with it**, against the usual rule, for the
reason the v6.76 renumber states: 6.81 – 6.84 were not decisions taken across
sessions, they were four cache keys inside one afternoon on one surface. Keep
the labels when they are a history; collapse them when they are only a cache
key. 6.77 – 6.83 are gaps with nothing behind them, which is the cosmetic cost
this section opens with.

