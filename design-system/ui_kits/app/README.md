# UI kit — Shipmate app

A click-through recreation of the Shipmate web app, rebuilt from `index.html`,
`render.js` and `style.css` in the `shipmate-prototype` repo.

## Flow

1. **Onboarding modal** — four tabs (About / Distribution / Assets / Compliance) with a
   blue progress fill under the active tab, orange required dots, and Shipmate tips inline.
2. **Dashboard** — one `Card` per storefront in a `repeat(auto-fill, minmax(320px, 1fr))`
   grid, each with its step list, progress bar, build pill and submit row. Inactive
   storefronts sit below under "Available platforms".
3. **Step editor** — opens on any step row. Shows the inference shimmer, then a
   YES/NO questionnaire with ✦-marked inferred answers and a rejection-risk alert.
4. **Submit** — unlocks once every step is done *and* a release track is chosen. The card
   border turns brand-green.

## Files

| File | What it is |
|---|---|
| `index.html` | Shell, state machine, entry point |
| `Topbar.jsx` | Logo, language picker, profile menu |
| `ProjectBar.jsx` | Project + version selectors |
| `Dashboard.jsx` | Platform card grid and the available-platforms row |
| `Onboarding.jsx` | Four-tab onboarding modal |
| `StepModal.jsx` | Per-step questionnaire editor |
| `data.js` | Fake project, platform steps, release tracks, questions |

## Deliberately omitted

The prototype's launch timeline, screenshot cropper, privacy matrix, store-page
preview flip and Chinese locale are not recreated here — they exist in the source
repo and would need their own kits.
