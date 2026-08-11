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
