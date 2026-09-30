# Shipmate Prototype — Claude Context

## HARD RULES — read before touching anything

1. **Claude runs NO git command in this repo. None.** Not `push`, not `commit`,
   not `pull`, not `status`, not `gc`. The Cowork sandbox cannot delete files
   inside `.git`, so every git command Claude runs leaves a stale
   `.git/index.lock` and half-written `.git/objects/tmp_obj_*` behind, which
   then breaks the human's `./ship.sh`. If a pull is needed, say so and stop —
   the contributor runs it. The long version is under Git Workflow.
2. **Never put real API keys in `index.html`.** The `__CLAUDE_API_KEY__`
   placeholders stay. Real keys live in the gitignored `config.js` only, and
   GitHub Actions injects them at deploy. See Security.
3. **Bump the version once per publish**, and read the current number off
   `index.html`'s own `?v=` params — never off the "Current version" line
   below, which goes stale. See Versioning.
4. **Finish every batch with `.ship-message` plus a copiable `./ship.sh`
   one-liner.** Both, every time. See "The commit message comes from
   `.ship-message`".
5. **Check the deployment before starting work, on every prompt.** Read the
   local version off `index.html`, then fetch
   https://mtgrimm17.github.io/shipmate-prototype/ and read its footer badge.
   Deployed **higher** than local means this contributor is behind: say so and
   stop — edit nothing until they have pulled. Equal, or deployed lower, is
   fine. This stands in for the `git fetch` rule 1 forbids. See "Checking for
   new deployments".

---

## What This Is

Shipmate is a web app that helps game developers prepare and submit their games to app stores (iOS App Store, Google Play, Steam, Epic, PlayStation, Xbox, Nintendo). It walks developers through content ratings, data collection disclosures, business categories, screenshots, and binary analysis — using AI to infer answers where possible.

This is a **static HTML/CSS/JS prototype** hosted on GitHub Pages. There is no build system, no npm, no bundler. Everything runs directly in the browser.

Current version: read it off `index.html`'s `?v=` params or the footer badge.
**This line is not the source of truth** — it went stale by 44 versions (it
said v6.82 while live was v7.26), which is exactly why rule 3 above says not to
trust it.

---

## File Architecture

| File | Purpose |
|------|---------|
| `index.html` | App shell, modals markup, script/style tags |
| `splash.html` | Splash/loading screen (loaded in an iframe) |
| `style.css` | All styles |
| `state.js` | Global `state` object — single source of truth |
| `render.js` | Pure rendering functions (`buildXxx`, `renderXxx`) — never mutate state |
| `app.js` | Event handlers, state mutations, initialization |
| `claude.js` | Claude API wrapper (streaming inference) |
| `locale.js` | i18n string lookup helper |
| `locales/` | JSON translation files per language |
| `Assets/` | Images (logos, icons) |
| `config.js` | **GITIGNORED** — real API keys live here, never committed |

---

## Key Code Patterns

### State
All app data lives in the global `state` object defined in `state.js`. Render functions read from it; app.js mutates it. Never mutate state inside render functions.

```js
// Reading state
state.platforms['ios'].screenshots

// Mutating state (in app.js)
state.platforms['ios'].screenshots.push(newShot);
renderDashboard();
```

### Render vs App split
- `render.js` — builds HTML strings, attaches inline event handlers, returns or sets innerHTML
- `app.js` — handles all user interactions, calls render functions to update DOM after mutations

### Platform IDs
`ios`, `android`, `steam`, `epic`, `psn`, `xbox`, `switch`

### CSS 3D flip animation
Platform cards flip between views using CSS 3D transforms. Classes:
- `is-flip-exit` (160ms) — current face rotates out
- `is-flip-enter` (300ms) — new face rotates in

Use `openStorePreviewSection(pid, target)` to trigger a flip. It handles the 3-phase async sequence (flip exit → inference loading with 2s minimum → flip enter).

### Screenshot crop state
Per-platform crop state is tracked in `_shotCropState[pid]`:
```js
{ shotId, src, name, aspect, panX, panY }
```
Pan position is preserved between device preset changes. Reset pan when a new screenshot is dropped.

### Store preview section tracking
`state.storePreviewSectionSeen[pid][target]` tracks whether a user has visited a section. Required for gating "done" state — a section isn't complete until both visited AND data is filled.

### Platform marks share one canvas

`SM_TILE_MARKS` in `platform-icons.js` is the set actually drawn in SELECT
PLATFORMS and in the platform-card headers. Every mark sits on the **same
39×37 viewBox**, reframed so its ink is 90.84% of the canvas height and
centred on (19.03, 18.305) — those numbers are measured, not chosen. That is
what lets identical CSS give identical results; marks on their own exported
canvases bobbed and changed size from tile to tile.

Adding art: drop it in, run `smTileMarkBBoxes()` in the console, and write the
transform from what it reports. Two traps it avoids — `getBBox()` on a
transformed `<g>` reports pre-transform units, and a non-square viewBox
letterboxes (one uniform scale, not one per axis).

Watch for an invisible `<rect style="fill:none">` in Serif exports: a bounding
box counts it, so the mark gets scaled as though its ink filled the artboard.
`_smMarkBody()` strips it.

### One definition per symbol

`smCheckSVG()` and `SM_STEP_CHEVRON` live in `state.js`, which loads before
everything that uses them. Both used to be pasted into each card builder, and
in both cases the copies drifted — six of seven ticks were still an older
glyph, and the chevron was missing from the fourth builder entirely.

Ticks are sized to **the full width of their disc**, not a fixed pixel size.
The discs differ (20px on a card and in the guide, 16px in the collapsed
rail), so a fixed size lands at a different fraction of each; at 100% the ink
is 38.3% of the disc everywhere and the stroke scales with it.

### Design-decision notes live in docs/decisions/

The long-form rationale for each surface — why the Mac preview, the privacy table, the calendar, the submitted card, the guide, etc. are built the way they are — was moved out of this file so the operational rules stay findable. **Before changing one of these surfaces, read its note** in `docs/decisions/design-notes.md` (and the numbered `docs/decisions/*.md`, which cover the pre-v6.40 surfaces). The sections there:

- Shippy is the live rig (v6.80)
- Colour has meanings
- Two card builders, one row
- The card is two columns, top to bottom
- The release block (VERSION / BUILD / TRACK)
- Improve Your Submission — three batches, one axis
- The step modal has no lines
- Violet proposes, blue confirms — now stated in tokens
- The destination rides the VERSION row
- After Submit: four phases, in each store's own words
- Add platform is a selected sub-nav pill (v6.77)
- The guide's other face is the month
- The Mac preview navigates from the top
- And the App Store preview got the same bar (v6.82)
- The Mac sidebar's glyphs are the real art now
- An editable field wears a well (v6.40)
- A listing is an ordered row of pictures (v6.41–47)
- Editing a field must not move the page
- The travel is ours, not the browser's
- AND EVERY MEASUREMENT IN THIS FILE WAS TAKEN IN ONE ENGINE
- `scrollbar-color` is not a Firefox-only hint
- A scroll restore must flush layout first
- The icon has two doors
- A hint is the app's bubble, never the browser's (v6.71–72)
- A preset that cannot answer without the network is not an answer (v6.43)
- The cell is the control (v6.46)
- The heading is a band, and the modal is sized from the table (v6.51)
- The data types table is an accordion (v6.52–70)
- The Stash badge is POWERED BY over the mark (v6.44)
- Game Details has to fit a small laptop
- The import note lives in the Description's label row
- The Content Rating bar is never silent

### Versioning — required on every change

(Before choosing a version number, confirm what's live — HARD RULE 5 and
"Checking for new deployments" below. Stamp a number strictly **above** the
deployed one.)

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

**AND THE LIVE NUMBER CAN BE READ WITHOUT GIT — FETCH THE PAGE.** Everything
above agonises over Claude not being able to see `origin/main`, and the whole
skip-if-unsure rule exists because of that blindness. It is a blindness about
the REPO, and the question was never about the repo: *what is live* is answered
by the live site, which prints its own version in the footer badge and stamps it
on fourteen `?v=` params. `https://mtgrimm17.github.io/shipmate-prototype/`
(remote read out of `.git/config`, which is a file rather than a command) says
it in one fetch.

**It is also a BETTER answer than `origin/main` would have been**, which is the
part worth keeping. `origin/main` says what has been pushed; Pages deploys ~30s
later, so between the two there is a window where the repo has a number the
world has not been served. The cache key's rule is *never go back past what
BROWSERS HAVE*, and the page is the only surface that states exactly that.

Jaco: *"primero checkeamos porque Adam ha pusheado."* Fetched: **v6.48**, so
6.49 was free and is what this batch takes. **Do this before choosing a number
from now on** — it costs one request and it retires the guess. The skip-if-unsure
rule stays for the case the fetch cannot answer (the site down, a private repo,
a deploy still in flight), where it is still the right default.

**AND A CONSUMED `.ship-message` IS THE FOURTH WAY TO READ THE LIVE NUMBER — AND
THE ONLY ONE THAT CANNOT BE CACHED.** The glimmer batch was written on the
belief that v6.75 had not shipped, because a fetch of the live page came back
**v6.48**. It was wrong: the page was served from an HTTP cache, and the second
fetch one minute later — same URL plus a throwaway query — read **v6.75**.

**The local filesystem had already said so, for free.** `ship.sh` renames the
note to `.ship-message.sent` **only on a successful push**; a failed push leaves
it in place for the retry. So the file being gone is a fact about the push that
needs no network at all, and it is available in the ~30s window before Pages has
even deployed — where the fetch, by construction, cannot answer.

So the order to use is: **`.ship-message.sent` first** (did I push?), then the
fetch (what is live?), and **bust the fetch's cache with a query** when the two
disagree. Had the wrong reading been acted on, this batch would have published
new bytes under a key browsers already held — the exact failure the Versioning
section exists to prevent, arriving through the one door it had not considered.
The full renumbering history — every batch collapsed to one published version, every number burned as a local cache-bust, and the lesson each left — is in `docs/decisions/14-versioning-full.md`.

Update the version in **three places**:
1. `index.html` — all `?v=X.XX` cache-bust params on script/style tags (**15** of them since v6.80 added `shippy-live.js`)
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
3. Publish: `./ship.sh` (commits, pulls, pushes).

GitHub Pages auto-deploys from `main` within ~30 seconds of a push.

### Checking for new deployments (v7.52)

Several people work on this repo, and the failure it keeps producing is one
contributor's work landing on top of another's. Rule 1 forbids Claude from
running `git fetch`, so Claude cannot ask the remote. It can ask the
STOREFRONT instead: Pages deploys from `main` within ~30 seconds of a push and
every publish bumps the version badge, so the deployed number *is* `main`'s
number. No git, no `.git/index.lock`, nothing that can break `./ship.sh`.

Before touching a file, on every prompt:

1. **Local** — `grep -o 'id="app-footer-version">v[0-9.]*' index.html`
2. **Deployed** — fetch https://mtgrimm17.github.io/shipmate-prototype/ and
   read the footer version.
3. **Compare:**
   - deployed **>** local → **STOP.** Print both numbers, tell the contributor
     to run `git pull` (or `./ship.sh`, which pulls), and change nothing until
     they confirm. Answering a question about the code is still fine; editing
     a file is not.
   - deployed **==** local → proceed.
   - deployed **<** local → proceed. Claude bumped the version for work that
     has not shipped yet — the normal mid-session state, and stopping on it
     would block the contributor on their own unfinished work.

WHAT THIS DOES NOT CATCH: a teammate publishing the same version number Claude
has already bumped to locally. The numbers match and the content does not.
That collision really happened, at v7.24/v7.25. Comparing file contents
instead does not help — they legitimately differ mid-session, which is the
whole point of the third case above. This check is written for the failure
that actually recurs; the same-number case is caught by `./ship.sh`'s own pull.

IF THE FETCH FAILS (offline, Pages down, a deploy mid-flight): say so and ask
the contributor whether to proceed. Do not silently skip it — a check that
fails open is worse than no check, because it gets trusted.

WHY NOT md5 THE FILES: Claude spent several versions comparing its own copies
against the working tree, which only ever detects edits made locally. It
cannot see commits nobody has pulled, and it did not: the tree sat **20
versions behind** for days while that check reported clean every time.

### The commit message comes from `.ship-message` (v6.58)

**Claude's last act on a batch of edits is to write `.ship-message`** at the
repo root, and the contributor then runs `./ship.sh` with no argument. Format:

```
v6.xx — subject line, under 72 characters
<blank line>
As long an explanation of the build as the change deserves. Paragraphs,
bullets, whatever the change needs. This is what the log will carry.
```

`ship.sh` commits it with `-F`, so the first line becomes the commit title on
GitHub and everything under it the description. The file is gitignored and is
CONSUMED on a successful push (renamed `.ship-message.sent`), so a bare run can
never re-publish the last build's description under a new one.

- **The version in the subject must match `index.html`'s footer badge.** `ship.sh`
  checks, and falls back to a file list rather than describing the wrong build.
- `./ship.sh "your own subject"` still works and still wins. Claude's note is
  set aside unused rather than left for a later bare run to pick up.
- No note at all is not an error: it publishes with `vX.YZ — update (n files)`
  and the changed-file list as the body.
- A failed push leaves the note in place for the retry.

Claude writes this file; it does not run git.

**AND CLAUDE ALSO HANDS MARK A COPIABLE ONE-LINER — BOTH, EVERY TIME.** Mark's
standing request: *"I always ask for a ship.sh copiable command that has a
description written in."* So ending a batch of edits means three things, and
none of them is optional:

1. **Bump the version** — see Versioning. Read the number off `index.html`'s
   own `?v=` params, never off this file's header prose, which goes stale.
2. **Write `.ship-message`** with the full build description.
3. **Print the command, with the version inside the description:**

```bash
./ship.sh "v6.xx — what changed"
```

**THE SUBJECT MUST BE UNDER 72 CHARACTERS, THE VERSION PREFIX INCLUDED.**
`ship.sh` warns past that and GitHub truncates the commit title there, so the
end of a longer one is simply hidden. The `.ship-message` format above already
states the limit; it applies to the pasted one-liner too, and v6.97 shipped at
74 because only the file was being counted. **Count the string you print, not
the one you wrote.** `v6.xx — ` is 8 of the 72, leaving ~64 for the sentence —
so name the surface and the change, and leave the before-and-after to the body.

An argument WINS over `.ship-message` (above), so pasting that command
publishes the one-line subject and sets the note aside unused. That is the
trade and it is Mark's to make: run the command for a quick subject, or run
`./ship.sh` bare to get the long body in the log. Claude supplies both and
does not choose.

This softens, rather than reverses, v6.58's original line — *"not handing over
a one-line subject to paste, which is what this replaced."* That was written
against handing over a subject **instead of** a note. Handing over both is
what Mark asked for.

### `ship.sh` REBASES, so `--ours` is the OTHER person's side

When two people bump the version on the same afternoon, `index.html` and
`splash.html` conflict on all fifteen version lines and nothing else. The
resolution is "keep ours" in plain English and **`--theirs` in the command**,
because a rebase replays your commit ON TOP of `origin/main`: "ours" is the
branch being rebased onto — *theirs* — and "theirs" is the commit being
replayed — *yours*. Inverted from a merge, which is where the instinct comes
from.

```bash
git checkout --theirs index.html splash.html && git add index.html splash.html
GIT_EDITOR=true git rebase --continue && git push
```

**AND THE CONFLICT IS THE THIRD WAY TO READ THE LIVE NUMBER WITHOUT GIT.** The
fetch above is the first and `.git/config` the second; this one is free,
because a conflicted file **prints both sides in the working tree** — a plain
file read, no command. `<<<<<<< HEAD` is `origin/main`'s version of those
fifteen lines and the `>>>>>>>` half is yours, so one grep answers the only
question the resolution depends on: *did the other side take my number?*

That is what `--theirs` silently assumes and cannot check. It is the right
default and it is only right while the other side's number is LOWER. v6.49 hit
this: Adam pushed `e9a92d1` after the fetch that had cleared 6.49, so the fetch
was stale by the time the rebase ran — and the markers said HEAD was still
**6.48** on all fifteen lines, i.e. his push touched `app.js`, `render.js` and
`style.css` and never bumped. 6.49 was still free, `--theirs` was still right,
and this time it was *known* rather than assumed.

**If HEAD's side is EQUAL TO OR HIGHER than yours, stop** — `--theirs` would
publish new bytes under a key browsers already hold, which is the whole failure
the Versioning section exists to prevent. Go up past both and rewrite all
fifteen lines before continuing.

```bash
grep -A1 '^<<<<<<< HEAD' index.html | grep -o 'v\?[0-9]\+\.[0-9]\+'
```

Resolving by hand is also fine and is what happened here — the hunks are only
version strings, so editing them out is as safe as `checkout --theirs` and
leaves you having read what you kept. Then `git add` both files and continue as
above; skip the `checkout` line.

Getting it backwards is silent and expensive: you would publish new bytes under
a number already live, which is precisely the diverged-cache failure the
Versioning section exists to prevent. **Verify before continuing** — the count
of `?v=` must match the new number, not the old one:

```bash
grep -o '?v=[0-9.]*' index.html | sort | uniq -c   # expect 15 of the new one
```

`GIT_EDITOR=true` is the second half. `ship.sh` opens `$EDITOR` for the commit
message, and on this machine that is `vi` — which hit a **three-day-old
`.COMMIT_EDITMSG.swp`** from a crashed session and sat at an E325 prompt no
amount of `:wq` escaped. The message is already prepared by the rebase, so
there is nothing to type: `GIT_EDITOR=true` accepts it without opening an
editor at all. Worth doing permanently:
`git config --global core.editor "nano"`.

Two states that look identical from the outside and are not: HEAD detached at
the same SHA as `.git/rebase-merge/onto`, with `msgnum/end = 1/1`, means the
commit **has not been created** and the push has nothing to send — live stays
on the old number. Check `.git/rebase-merge` exists rather than inferring from
`ls` (an `ls` of two paths where only one exists returns non-zero, which reads
as "clean" through `&&`; that misread cost a round trip here).

---

## Testing

Run a local server — opening `index.html` directly in a browser won't work properly (scripts and the splash iframe won't load):

```
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Leave the Terminal window running while testing.

AI inference features won't work locally (keys are injected at deploy time). All UI and navigation works without them.

---

## Active Tasks / Known Issues

See GitHub Issues for the current backlog. As of v6.26, the following items are in the queue:

- ~~The step modal's chrome~~ — all three landed: 1 and 2 in v6.11, and the
  scroll reflow in v6.17. `.submit-modal-scroll` and `.mac-spp-main` now carry
  `overflow-y: scroll` + `scrollbar-gutter: stable` with the thumb styled down
  (11px, no track, transparent border) the way `.main` does it — the lane is
  reserved whether or not there is a thumb, so a card growing by a line no
  longer reflows the step sideways. **And it only started actually doing that in
  v6.32**: until then a `scrollbar-color` on those same three elements had Chrome
  drawing overlay bars, so the reserved lane was 0px and every
  `::-webkit-scrollbar` rule was inert. See "`scrollbar-color` is not a
  Firefox-only hint".
- **Mac App Store preview for the demo** — adapt it to how the real Mac App
  Store looks. macOS already exists as a platform (`macos` / `macos_full`), and
  `SM_REQS.macos` in assets.js already carries Apple's numbers: icon 1024×1024
  with no alpha, screenshots 16:10 at 2880×1800 / 2560×1600 / 1440×900 /
  1280×800. The web preview (`buildWebSitePreviewSection` + web-page.js) is the
  most developed one and the best model to copy. (Its NAVIGATION was re-cut in
  v6.28 — see "The Mac preview navigates from the top" — and the sidebar was
  nailed against a screenshot of the real app in the same version. The page's own
  fidelity to Apple's layout is what is still open.)
- **Play and Arcade are the last two hand-drawn sidebar glyphs.** Six of the
  eight are Jaco's exported SVGs as of v6.28; those two are still my redraws and
  he has said he will supply them. Dropping them in is the same one-line swap the
  other six took — see "The Mac sidebar's glyphs are the real art now" for the
  16-unit-box arithmetic and the `fill-rule` trap.
- Auto-fit the hero on mobile: a logotype sized for 1440px overflows at 390px.
  Needs to happen in the measuring pass, re-anchored by the edge it aligns to.
- Press kit — Adam wants a downloadable one with asset links. Blocked on a real
  question rather than a design one: there is no publish path at all, and the
  assets are data URLs or Steam CDN links.
- **One live page** — Marketing's embed and the step modal both render
  `id="site"`, and `#wp-full` appends to `<body>`, changing document order
  mid-gesture. `getElementById` returns the first in document order, which is
  the root cause of both flip bugs fixed defensively in v5.4x
  (`_wpEditSurface`). The agreed fix is that the surface which draws keeps the
  page and the other unmounts. Not started.
- ~~The modal flip "blink"~~ — **FOUND AND FIXED IN v6.33, and it was none of
  the three suspects this entry had been carrying for weeks.** Worth keeping
  the whole story, because the old entry is a case study in how a wrong
  measurement protects a bug.

  **The modal was replaying its ENTRANCE ANIMATION on every flip.**
  `.submit-modal` carries `animation: modalIn .25s` with the default fill mode,
  and `.is-flip-exit` / `.is-flip-enter` REPLACED that shorthand. So when the
  flip class came off — 300ms after the press, exactly as the card settled —
  the cascade reverted to `modalIn`, the animation-name changed back, and the
  browser minted a brand-new `modalIn` starting at its own 0%: `opacity: 0;
  translateY(10px) scale(.98)`. Measured across the removal: opacity **0** at
  +0ms, 0.69 at +76, 0.98 at +196, 1 at +396. A quarter-second re-entrance,
  every flip.

  **The old note said "not an opacity issue (no frame at opacity 1
  unrotated)", and that sentence is what hid it for weeks.** It is true and
  irrelevant: the probe went looking for a frame at FULL BRIGHTNESS, on the
  theory that the modal flashed white. The bad frame is at opacity ZERO. A
  measurement aimed at the wrong end of the range comes back clean and reads as
  an exoneration — so the hunt moved on to `backdrop-filter`, layer promotion
  and the 90px `box-shadow`, none of which had anything to do with it.

  **What made it findable was Jaco's own detail**: *"FLASH al asentarse"* — at
  the END of the rotation, not during it. That put the suspicion on what
  happens when the class comes OFF, which is the one moment none of the three
  suspects could explain and the cascade explains completely.

  The fix is `modalIn` kept at **index 0** of the flip rules' animation list
  (style.css, beside the keyframes, where the long version of this is written).
  Animations are matched to the list by position, so `[modalIn]` →
  `[modalIn, flip]` → `[modalIn]` leaves the first one alone: the same finished
  animation continues instead of a new one being created. Verified after:
  opacity 1 at +0 / +16 / +92 / +292ms, transform straight to `none`, no
  replay.

  **It is CSS animation semantics, not compositing, so it is engine-independent**
  — which is the one reason it was safe to diagnose in Chromium against a bug
  reported in Safari. Confirm it in Safari anyway; if any flash survives there,
  THAT is when the `backdrop-filter` / layer-teardown suspects become live
  again, and they are still untested.

  `.loc-review-card` and `.iap-loc-card` run the same flip classes and are
  **not** affected — checked, their base rules carry no `animation`. Only
  `.submit-modal` has an entrance animation to clobber. Anything that gives one
  of them a base `animation` later inherits this bug.
- **TWO PRESENTATIONS BEHIND ONE FLAG, AND IT HAS TO EXPIRE.** `submission.layout`
  ('inline' | 'modal') now picks between the tab strip + inline pane (v6.29–v6.37,
  Mark's, and the default) and the platform-card grid + step modals that preceded
  it. v6.38 added two things to a flag that had neither: a way to SET it
  (`?layout=modal`, remembered in `localStorage` under `sm.layout` — the hook sits
  under the `state` literal in state.js) and the other half of what it claims to
  switch (the card grid, in `renderDashboard`; it only moved the row's click
  before).

  Nothing was reconstructed from memory. Both times the pattern was the same and
  it is worth recognising again: `dash-column` appeared **0 times in render.js and
  4 in style.css**, `dash-add-banner` **0 and 6** — markup deleted, design intact.
  The builders were never touched either, as the comment above `submissionTab()`
  says in Mark's own words: *"buildActiveCard and the four builders under it are
  still here and still correct"*. So the arm is a call site and a wrapper, not a
  fork of the rendering.

  **The default is untouched by construction.** With no `?layout=` and nothing
  stored, neither the hook nor the branch does anything, so the live site is
  exactly what it was. That is what made it safe to add without waiting.

  **AND IN v6.47 THE DEFAULT BECAME 'modal'.** Jaco: *"quiero que por defecto
  siempre tengamos ?layout=modal… no quiero que borremos nada de la
  implementación inline, pero que modal esté por defecto siempre."* It is ONE
  WORD — the literal in state.js — plus two stale statements of the default
  that had to move with it: `smSubmitLayout`'s own doc line, which still said
  "(default)" beside inline, and its `|| 'inline'` fallback, which is
  unreachable while the literal exists but was a second place naming the other
  arm. **Both arms, the `?layout=` hook and every branch that reads the flag
  are untouched**, which is the point: the decision aid stops defaulting to the
  arm nobody chose, without the loser being deleted before there is a decision.
  Verified on a cold load with nothing stored: `modal`, and `smSubmitLayout`
  still flips to `inline` and back.

  **AND IN v6.46 THE REMEMBERING WENT, WHICH IS WHAT MAKES IT A REAL DEFAULT.**
  Jaco: *"necesito que me garantices que cualquier persona que lo abra verá el
  modal flag por defecto."*

  This entry used to carry a paragraph headed *"one thing that looks like a bug
  and is not"*: a browser that ever loaded `?layout=inline` had `sm.layout`
  stored, the hook was "required to honour" it, and on that machine the new
  default did nothing until someone ran `localStorage.removeItem`. Re-read as a
  guarantee rather than as a feature, that is **a default with an invisible
  per-machine exception** — and the people who open a prototype are exactly the
  ones who cannot be told to clear a storage key.

  So `localStorage` leaves this block entirely, and **any key already written is
  REMOVED on the way past** rather than left as a dead entry: the guarantee has
  to hold on the machines that already tripped it, which is the whole point of
  being asked for one. The URL is the only door now — `?layout=inline` still
  gives the other arm, for that load — and `smSubmitLayout()` never touched
  storage, so the console switch and the reload door finally agree.

  What it costs, and it is the thing that was being bought: comparing the inline
  arm over a working day now means keeping the query string on. That was worth a
  localStorage key while the two arms were genuinely being weighed; it is not
  worth one now that the default is settled and the flag is waiting to be
  deleted.

  Verified end to end: `sm.layout` set to `inline` → cold load with no query
  comes up **modal** with the key **cleared**; `?layout=inline` → inline for
  that load and nothing stored; the next plain load → modal again.

  **AND IT IS A DECISION AID, NOT AN ARCHITECTURE.** Two presentations of the same
  surface is a real tax: every future change to the submission tab has to be
  thought about twice, and the arm nobody is looking at is the one that silently
  rots — the add banner was unreachable in the card arm for its first ten minutes
  precisely because the control that opens the picker lives in the tab strip. That
  is the failure mode, and it will recur. So this exists to let two people look at
  both and choose. **When the choice is made, the loser comes out** — the arm, the
  flag, the hook and this note, the way the dev bar was deleted rather than left
  switched off. If it is still here in a month, that is the bug.

  **AND IT RECURRED TWICE, EXACTLY AS PREDICTED.** Both of Jaco's reports from
  the card grid are one shape: a control that was re-pointed at the PANE when
  the pane arrived, leaving the card's copy aimed at a surface that is not on
  screen. Neither throws, both look like nothing happening.

  - **The gear stopped flipping the card.** `_platformHeadActions` sends the
    steps face's gear to `platformGearFromTab`, which writes
    `submission.tab` / `submission.settings` and re-renders — and in the grid
    arm nothing reads either one. `buildActiveCard` asks `showAccountFace`,
    which reads `platformFace`, which that function never writes; so the press
    changed two fields nobody was reading and `renderSubmission` rebuilt the
    identical cards. It branches on the flag now, back to
    `platformGearFromSteps`, the flip `_cacheStepsFaceHeight` and
    `buildAccountCard` are still built around. **`_flipPlatformCard`'s pane
    guard had to move with it**: `submission.settings === pid` is a fact about
    the INLINE presentation, and tested alone a value left there by a press
    under the old handler would send the next flip into
    `closePlatformSettings` — the card refusing to turn over for a reason
    belonging to another layout.
  - **`.active-cards-grid` is rendered NOWHERE**, so the height pin inside that
    flip has been a no-op for as long as `.dash-column` has been the markup.
    Found while fixing the gear, and the tell is the same one the add banner
    gave: a name with rules in style.css and zero uses in render.js.

  **AND CHOOSING A TRACK NEVER TICKED UPLOAD BUILD — that one is both arms.**
  `selectTrack` patched exactly the two boxes the pill had ever lived in, the
  submit row and the release block. Both patches were correct and both were an
  INVENTORY, and the inventory was two short: `_uploadBuildComplete` reads
  `selectedTracks`, so a destination also ticks Upload Build's disc, promotes
  its row, moves the step count and takes `.active-card` into `submit-ready`.
  So the card said the destination was chosen while the step asking for it sat
  grey. It renders now, on `_refreshBuildUI`'s own argument — "branching on
  which to do would be two code paths for one event" — and `_paintStepRow` was
  not an option, because the card builders emit `.ios-step-num` with no
  `dot-<pid>-<stepId>` and that helper returns on its first line.

  **The general form, and it is worth stating once for the rest of this flag's
  life: a surgical repaint is an inventory of consequences, and an inventory
  goes stale every time something new starts reading the value.** A render
  cannot.

  **AND THEN THE THIRD ONE, WHICH IS THE SAME SHAPE AGAIN AND ALSO A MODEL
  QUESTION.** The entry above shipped one thing DECIDED-AGAINST: uploading a
  binary did not tick Upload Build on a card, filed as the model working —
  "a build with no destination is not a finished step". Jaco: *"en el flag modal
  dudo que eso tenga que ser así? quizás debería marcarse el check sí o sí. Y
  que sólo si doy a submit y falta elegir el track, se oscurezca todo para
  elegir el track."* He is right, and the full argument is at
  `_uploadBuildComplete` (state.js) where the predicate lives. Two measurements
  settled it:

  - **The row contradicted itself.** Upload Build's row HOLDS the build pill,
    which draws a green check and the filename (`build-pill has-build`), while
    its own disc beside it stayed a bare `ios-step-num`. One row, two answers,
    six pixels apart.
  - **Gate 3 was unreachable, and gate 2 pointed at the lie.** With Upload Build
    incomplete, `submitStepClick` refused at gate 2 and spotlighted that row —
    so pressing Submit answered "finish this step" by dimming the whole card
    around the one row that looks finished.

  **A step disc answers for what the step CONTAINS**, and that is the whole
  rule: v6.29's argument is explicitly "the step now literally contains the
  question", which is true of the pane and false of the grid, where shape 4 put
  the picker in the card's own chrome two rows above the list. So the predicate
  reads the flag — not as a special case, but as how it asks where the picker
  currently lives. The destination did not stop being required; it stopped
  being a checklist item and became a property of the PRESS.

  **AND GATE 3 COULD NOT ASK FOR IT — third instance of the one shape.** Its
  branch tested `openStep[pid] !== 'uploadBuild'`, a fact about the PANE, and
  then called `toggleStepSection`, whose first line is `if (layout === 'modal')
  return openStepModal(…)`. Measured: pressing Submit with no track OPENED THE
  UPLOAD BUILD MODAL and spotlighted nothing. It asks the DOM now — the chip
  either is in the document or it is not, which is true in both arms with no
  flag at all.

  Measured end to end on a card: build in, no track → 4/4 with the disc
  `is-done` and Submit `submit-step-ready`; press Submit → no modal, card
  `is-spotlight` with the head and all five step rows at **.18**, the release
  block at **1** and the chip `is-spotlit` at 1; choose the track from there →
  spotlight cleared, gate returns `true`, Submit ready. The inline arm verified
  unchanged (false without a track, true with) and a platform with no
  `PLATFORM_TRACKS` entry still finishes on the binary alone.

- Steam's tile mark measures 98.96% of the shared canvas against 90.84% for
  every other logo — its own export, left as authored. One line to bring it
  in line if wanted.
- **Xbox and Nintendo have no measured tile mark**, so the platform picker and
  the card headers still fall back to their brand PNGs (visibly the only two
  colour icons in the list). `smMarkFor()` already prefers a measured mark, so
  dropping art on the shared 39×37 canvas into `SM_TILE_MARKS` is the whole
  job — no code change.
- The two colour duplications above (two ambers, two selection blues).
- `.ob-sec-divider` between Distribution and Localization is dead markup —
  measured `getClientRects().length === 0`, because the sub-tabs never show
  the two sections together. Those two also still share one `.ob-form`, which
  is why leftovers like this exist: structurally it is still the old long
  scrolling form with tabs revealing one slice at a time.
- The repeated section headers in Distribution / Localization / Assets are
  **deliberate** — we removed all three, looked at it and put them back. There
  is a note in render.js; please don't tidy them away.
- T4: Sync data type selections from natural language description (state.js task #4)
- **Port Google Play's Data Safety table onto `.pvt-*`, and then delete
  `.prv-*`.** v6.52 gave Apple's table its own vocabulary rather than rewriting
  the shared rules, which was the right call for one change and leaves two table
  dialects for what is visibly one kind of object. The real work is not the
  look, it is that Google Play has **eleven columns** and a **`locked`** state
  (Ephemeral and Required are dead until Collected is on) that the accordion
  markup has no concept of — a 14px square that cannot be pressed needs deciding
  before anything is ported. Steam Languages is the easy half: three cells,
  never add, never locked. **When both are across, `.prv-matrix` / `.prv-hit` /
  `.prv-box` / `.prv-check-cell` and `_prvCell` should GO**, not stay as the
  second dialect — the argument the dev bar was deleted under. Until then the
  two are deliberately independent and a change to one does not reach the other.
  Note Google Play's own copy of the privacy-preset bug is still open too (below,
  under "A preset that cannot answer without the network"), and both jobs are in
  the same builder — worth doing in one pass.
- **The screenshots editor's open questions (v6.41).** Three things it leaves
  deliberately, none of them blocking: a REMOTE screenshot (IGDB through the
  proxy) taints the canvas so no preview can be baked — the transform survives
  and only the store thumbnail shows the uncropped picture; the four
  non-App-Store platforms (Android, Steam, Epic, PSN…) all get the same editor
  through the same step, but only Mac's frame ratio has been looked at against
  a real store page; and there is no way to crop a shot differently per DEVICE
  the way the reference prototype's iPhone/iPad toggle does — `SM_REQS.ios`
  carries two `shot` rows and this reads the first.
- ~~The dev bar~~ — **deleted in v6.26**, all three pieces: the block in app.js,
  the `.sm-devbar` rules in style.css and the call at the top of
  `renderDashboard`. It was listed here precisely so it would not quietly become
  part of the app, and it was removed rather than switched off for the same
  reason — a flag left at `false` is a control waiting to be turned back on.
  Everything it did is still reachable from a real console through
  `smReviewVariant` and `smCardState`.
- **The submitted card's two shapes** — SEGMENTS won and ships (`subVariant`
  defaults to 1). The dates variant is kept alive on purpose, still reachable as
  `smReviewVariant(2)`, because the comparison is not finished. When it is, the
  loser goes along with `state.subVariant` and its branch in
  `buildSubmittedCard`.

### Queued next (Jaco, v6.26)

- **The boxes and outlines are too loud — a refinement pass.** Jaco's brief,
  given the evening v6.32 shipped and not yet scoped: *"cambios a cómo se
  stylean los recuadros y outlines que son demasiado llamativos, y afinar todo
  un poco."* No specific offender named, so the first job is an inventory
  rather than an edit — walk the step modal and the platform cards and list
  every rule that draws a ring, a border or a stroked edge, then ask of each
  whether it is carrying a STATE or merely drawing a box. This file already
  argues that case in three places and each one is a precedent, not a rule to
  reapply blind: the micro-buttons lost their strokes because a bare control
  that fills on hover is the app's pattern; the platform card's step disc
  dropped its ring because a soft disc turning green is one object changing
  colour; the Content Rating bar and the pinned nav draw their ring INSIDE the
  box because a border cannot stay concentric with the fill it clips. Start
  from the previews, since that is where the complaint was made, and measure
  the composite of each edge against what it sits ON — half the strokes in this
  app were tuned over the near-black `--panel` and are now on lighter grounds.
  **Beware the one trap:** three of those edges are load-bearing state
  (`.submit-ready`'s border, the cancel hold's red edge, the inline editor's
  blue focus outline), and softening them by sweep would quietly delete
  meaning. Anything that changes colour to say something keeps its weight.

  **And the brief got sharper the same evening, in a way that changes the
  job.** Jaco again: *"le falta claridad, y los recuadros de colores son
  extraños, no queda muy claro qué campos son editables."* That is not a
  volume complaint, it is an AFFORDANCE one — the question the page fails to
  answer is *which of these can I click?* — and the two pull in opposite
  directions, so turning every edge down would make it worse. The preview
  currently says "editable" three different ways at once: the amber glow (which
  actually means UNFINISHED, not editable), the blue focus outline (only once
  you are already in), and nothing at all on a field that is filled in — so a
  completed title looks exactly like the drawing around it. The real target is
  **one resting mark that means "this is yours to edit", present on every
  editable field whether or not it is finished**, and then the loud colours can
  come down because they stop carrying a job they were never meant to have.
  Worth deciding before touching a single value, because it settles which
  edges are allowed to go quiet. The Mac preview is the place to solve it: it
  is the one whose whole argument is that the page is a DRAWING of a store with
  editor chrome laid over it, and this is exactly the seam between the two.

  **THE AFFORDANCE HALF LANDED IN v6.40 — see "An editable field wears a well".**
  The resting mark exists now (a `--bg` well with a white-14% stroke on every
  `.ias-editable`), the amber left the Mac preview entirely, and focus went from
  three colours to one. Two things that section leaves open and this brief should
  pick up: the **four non-text click targets** (Content, Screenshots, Business,
  Data privacy) now draw nothing at rest, which is a silence rather than a
  decision; and the **volume pass itself is still unstarted** — the inventory
  found the previews were too QUIET, not too loud, so whatever is genuinely
  shouting is somewhere else and has not been listed yet. Start that inventory on
  a different surface than this one.
- **Make the Submit button celebratory.** This is the debt shape 4 took on
  deliberately: the destination moved out of the Submit row precisely so Submit
  could be "reduced to the single confident act" — and then it was left looking
  like every other row. The Release button on the other face is the reference
  now (solid `#2fdc80`, the step row's box and type, last thing in the card);
  Submit is the same moment one face earlier and should not be quieter than the
  thing that merely *finishes* what it started. Watch the one trap already
  written down: whatever it becomes must not also ask a question, or shape 4's
  whole argument comes back.
- **Animate the submit → in-review transition properly.** What exists is the
  honest minimum, not the design: the box closes from the steps height to the
  submitted one over 420ms while the new content fades up 5px (`.is-advancing`,
  and `_doFinalSubmit` / `cancelSubmission` in app.js). It reads as correct and
  not as an event. Two things it should probably gain and neither is free — a
  beat where the steps acknowledge being sent before they go, and something that
  carries the eye from the card to the guide's month, which changes face at the
  same instant with nothing connecting the two. Keep the rule the current one
  rests on: the header and the release block are identical across both faces and
  must not be animated, or one card becoming another reads as two cards swapping.
- **The calendar wants another pass.** No brief yet — the colour vocabulary and
  the wait band landed in v6.26 and the shape underneath them has not been
  revisited since. Likely starting points, none agreed: the guide's month and the
  Calendar tab still share one `monthOffset` (paging in either moves both), the
  day panel is deliberately missing note/repeat/time, and the workback items are
  still derived from the target launch date rather than from anything the
  developer has said they will do.

---

## Pending AI Model Decision

The team is evaluating which AI model to use for production inference. A benchmark spec is in `shipmate-ai-benchmark-spec.md`. Current leading candidate: **Claude Sonnet 5** for real-time inference. Open-weight fine-tuning (Qwen2.5-32B range) is a future option once sufficient labeled data is collected.
