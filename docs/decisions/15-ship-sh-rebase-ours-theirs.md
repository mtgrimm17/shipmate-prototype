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

Getting it backwards is silent and expensive: you would publish new bytes under
a number already live, which is precisely the diverged-cache failure the
Versioning section exists to prevent. **Verify before continuing** — the count
of `?v=` must match the new number, not the old one:

```bash
grep -o '?v=[0-9.]*' index.html | sort | uniq -c   # expect 14 of the new one
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
