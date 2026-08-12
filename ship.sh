#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  ./ship.sh   — save your changes and publish them live.
#
#  Just run:   ./ship.sh
#  Or with a note:   ./ship.sh "added the sign-in screen"
#
#  It never opens a text editor. If it can't finish on its own
#  (usually because you and a teammate edited the same thing),
#  it stops and tells you in plain English what to do next.
# ─────────────────────────────────────────────────────────────

# Never let git open Vim or any editor — auto-accept default messages.
export GIT_EDITOR=true

# Always run from the repo root, no matter where you invoke this from.
cd "$(dirname "$0")" || exit 1

# ── Self-heal: clear stale locks & leftovers before touching git ─────────────
# Interrupted git — or tools that touch .git behind git's back (iCloud/Dropbox
# sync, editors, or an agent whose sandbox can't clean up after itself) — leave
# *.lock files and half-written tmp_obj_* objects that block every future
# command. These are safe to delete ONLY when no git process is actually
# running, so we guard on that first.
if ! pgrep -x git >/dev/null 2>&1; then
  find .git -name '*.lock' -type f -delete 2>/dev/null
  find .git/objects -name 'tmp_obj_*' -type f -delete 2>/dev/null
fi

# Git's background maintenance/auto-gc runs on its own schedule and collides with
# ordinary commits, leaving maintenance.lock behind. Turn it off for this repo.
git config maintenance.auto false >/dev/null 2>&1
git config gc.auto            0   >/dev/null 2>&1
git maintenance unregister        >/dev/null 2>&1

# Use your note if you gave one, otherwise stamp it with the date/time.
MESSAGE="${1:-Update — $(date '+%b %-d, %Y at %-I:%M %p')}"

# 1. Save everything you've changed (does nothing if there's nothing new).
git add -A
git commit -m "$MESSAGE" >/dev/null 2>&1

# 2. Pull in teammates' changes, then publish yours.
if git pull --rebase --no-edit && git push origin main; then
  echo ""
  echo "✅  Done — your changes are live."
else
  echo ""
  echo "⚠️  I couldn't finish this automatically."
  echo "    Most likely you and a teammate edited the same file."
  echo ""
  echo "    👉  Copy everything above and paste it to Claude."
  echo "        Claude will sort it out, then just run ./ship.sh again."
  exit 1
fi
