### Colour has meanings

Three, and only three: **green done** (#31DC80), **amber attention**
(rgba(255,184,107,…)), **red wrong** (--alert-*). Anything informational wears
text colours.

The old Subwoofer orange `#fb923c` is retired from the tip vocabulary — the
three `--sw-tip-*` tokens are deleted, not repointed, because that one colour
had come to mean a tip, a warning, a clickable badge AND a hover state at once.

A round `!` or `?` is never coloured: it is a tooltip handle, not an alert. And
inside a chip the badge takes `currentColor` with no fill, because
`.tooltip-icon`'s own fill is an opaque grey that punches a hole through a
selected chip.

**A fourth meaning joined them in v5.73: violet is a change Shipmate is
PROPOSING.** It lives only in Improve Your Submission — `#5436AD` / `#7A00D2`
fills with `#FBA4FF` text on `.imp-split-fix`, and a violet hover on
`.imp-cta[data-imp-act="apply"]`. It marks the suggested half of a
current-vs-fix pair, which none of the three existing colours could say: the
suggestion is not done, not an alert and not wrong.

The distinction that keeps it honest is **violet proposes, blue confirms**. The
moment a fix is chosen the box changes to the selection blue (`--pill-on-*`,
#52BAFF), the same blue an onboarding pill wears when selected — so "this is
the one you picked" reads identically everywhere in the app. Violet must never
mark a chosen or applied state, and blue must never mark an unanswered
suggestion.

The grade tabs bring five more hues (#50F88A / #B4DE52 / #E8974E / #FF7A5C /
#FF5C5C for A–F). Those are a scale, not meanings, and they are scoped to
`.iv-grade-tab`. Don't borrow them for anything else.

Each tab's **fill is that same hue over the tab's #161616 at ~17%** (it was
~10%, which left five panels that were all the same dark grey with a coloured
character on them — the scale was only legible in the letter). Border at 30%.
If a hue changes, recompute the fill rather than eyeballing it:
`c = 22 + (hue − 22) × 0.17` per channel.

Two duplications survive and are worth resolving together some day: **two
ambers** (`#fb923c` in --orange/--orange-soft vs `#FFB86B` everywhere newer)
and **two selection blues** (`--sel-*` #60a5fa, ~14 consumers in Marketing and
content rating, vs `--pill-on-*` #52BAFF). Neither is a bug; both mean a
"selected" or an "attention" looks different depending on the tab.
