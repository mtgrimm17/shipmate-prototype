#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  ./ship.sh   — save your changes and publish them live.
#
#  Just run:   ./ship.sh
#  Or with a note:   ./ship.sh "added the sign-in screen"
#
#  Run bare, it uses the note Claude left in `.ship-message`:
#  a subject line carrying the version number, then the long
#  explanation of the build underneath it. Nothing there? It
#  still publishes, with a message worked out from the files
#  you changed.
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

# ── THE MESSAGE ─────────────────────────────────────────────────────────────
# Bare `./ship.sh` used to stamp the commit "Update — Sep 16, 2025 at 4:12 PM",
# which says when something shipped and nothing about what. The log is the only
# record of these builds that outlives the conversation they were described in,
# so that was the one place the explanation belonged and the one place it wasn't.
#
# `.ship-message` is where it goes now. Claude writes it at the end of a batch
# of edits — first line the subject, with the version number in it, then a
# blank line, then as long an explanation as the change deserves — and this
# picks it up whole. Committed with `-F`, not `-m`, so the body survives: on
# GitHub the subject becomes the commit title and everything under it the
# description.
#
# It is gitignored, and it is CONSUMED (renamed `.ship-message.sent`) once the
# push lands, so the next bare run can never re-publish the last build's
# description under a new one.
#
# Three things could go wrong, so three guards:
#   • You passed your own note   → yours wins, exactly as it always has.
#   • The note is for another version → say so and fall back, rather than
#     describing the wrong build. The version is read out of index.html's own
#     footer badge, which is the file that carries it.
#   • There is no note at all    → still publish. A list of changed files is a
#     poor description but an honest one, and refusing to ship over a missing
#     note would be the worse failure.
NOTE=".ship-message"
MSG="$(mktemp "${TMPDIR:-/tmp}/shipmsg.XXXXXX")" || exit 1
trap 'rm -f "$MSG"' EXIT

VERSION="$(sed -n 's/.*id="app-footer-version">v\([0-9.][0-9.]*\)<.*/\1/p' index.html 2>/dev/null | head -1)"

# Captured BEFORE `git add -A`, so the fallback message can still name them.
CHANGED="$(git status --porcelain 2>/dev/null | sed 's/^/  /')"
COUNT="$(printf '%s\n' "$CHANGED" | grep -c '[^[:space:]]')"

# One of: note (used it), arg (yours won), stale (wrong version), none.
NOTE_USE="none"
if [ -n "$1" ]; then
  printf '%s\n' "$1" > "$MSG"
  [ -s "$NOTE" ] && NOTE_USE="arg"
elif [ -s "$NOTE" ] && { [ -z "$VERSION" ] || head -1 "$NOTE" | grep -qE "^v${VERSION//./\\.}([^0-9.]|$)"; }; then
  cat "$NOTE" > "$MSG"
  NOTE_USE="note"
else
  if [ -s "$NOTE" ]; then
    NOTE_USE="stale"
    echo ""
    echo "⚠️  .ship-message describes a different version than this build"
    echo "    (it says \"$(head -1 "$NOTE")\", this build is v${VERSION:-?})."
    echo "    Ignoring it — publishing with a file list instead."
  fi
  PLURAL=""; [ "$COUNT" = "1" ] || PLURAL="s"
  {
    printf 'v%s — update (%s file%s)\n\n' "${VERSION:-?}" "$COUNT" "$PLURAL"
    printf 'No .ship-message note was found, so this describes the change by\n'
    printf 'file rather than in words.\n\n'
    printf 'Changed:\n%s\n' "$CHANGED"
  } > "$MSG"
fi

SUBJECT="$(head -1 "$MSG")"
if [ "${#SUBJECT}" -gt 72 ]; then
  echo ""
  echo "⚠️  The subject line is ${#SUBJECT} characters. GitHub truncates the"
  echo "    commit title around 72, so the end of it will be hidden."
fi

# 1. Save everything you've changed (does nothing if there's nothing new).
git add -A
COMMITTED=0
git commit -F "$MSG" >/dev/null 2>&1 && COMMITTED=1

# 2. Pull in teammates' changes, then publish yours.
if git pull --rebase --no-edit && git push origin main; then
  # Spent. The note describes the work that was sitting uncommitted, so once
  # ANY commit has gone out it no longer describes anything — including when
  # you passed your own subject and the note's body went unused. Renamed
  # rather than deleted, so the last one is still readable.
  if [ "$COMMITTED" = "1" ] && [ -e "$NOTE" ]; then
    mv -f "$NOTE" "$NOTE.sent" 2>/dev/null
    if [ "$NOTE_USE" = "arg" ]; then
      echo ""
      echo "ℹ️  Your own note was used. Claude's .ship-message went unused and"
      echo "    is now .ship-message.sent."
    elif [ "$NOTE_USE" = "stale" ]; then
      echo ""
      echo "ℹ️  The out-of-date .ship-message is now .ship-message.sent."
    fi
  fi
  echo ""
  echo "✅  Done — your changes are live."
  echo "    $SUBJECT"
  if [ "$COMMITTED" = "0" ]; then
    echo "    (nothing new to save — pushed what was already committed)"
  fi
else
  echo ""
  echo "⚠️  I couldn't finish this automatically."
  echo "    Most likely you and a teammate edited the same file."
  echo ""
  echo "    👉  Copy everything above and paste it to Claude."
  echo "        Claude will sort it out, then just run ./ship.sh again."
  exit 1
fi
