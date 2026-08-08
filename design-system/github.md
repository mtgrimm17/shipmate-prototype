repo: mtgrimm17/shipmate-prototype
branch: main

## Last sync

date: 2026-08-07T20:29:35Z

### Updated in this project

- Built the token set from the prototype's `style.css` (colours, type, spacing, elevation, motion).
- Extracted Shippy's five layers and the marketing SVG icons out of `splash.html`.
- Authored 26 components against the `CANONICAL UI COMPONENTS` block in `style.css`.
- Recreated the app dashboard and the marketing splash as UI kits.

## Screen map

| Screen | Built from |
|---|---|
| `ui_kits/app/index.html` | `index.html`, `app.js` |
| `ui_kits/app/Topbar.jsx` | `index.html` (`.topbar`), `style.css` 1676–1860 |
| `ui_kits/app/ProjectBar.jsx` | `index.html` (`.project-bar`), `style.css` 1861–2000 |
| `ui_kits/app/Dashboard.jsx` | `render.js` `buildActiveCard`/`buildSubmitStepCard`, `style.css` 2093–2800 |
| `ui_kits/app/Onboarding.jsx` | `index.html` (`#onboarding-overlay`), `style.css` 84–560, `locales/en.json` |
| `ui_kits/app/StepModal.jsx` | `style.css` 3417–3560, 4451–4550 |
| `ui_kits/marketing/index.html` | `splash.html` |
| `ui_kits/marketing/Splash.jsx` | `splash.html` |
| `tokens/*.css` | `style.css` 1–62, `splash.html` `:root` |
| `assets/brand/*`, `assets/icons/mk-*` | `splash.html` (inline base64 + inline SVG) |
| `assets/platforms/*`, `assets/logos/*`, `assets/icons/icon-*` | `Assets/` |
