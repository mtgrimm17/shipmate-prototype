# Shipmate — App Store Connect helper (Chrome, scaffold)

Automates the two App Store Connect steps Apple gives **no API** for — creating
the app record and the App Privacy questionnaire — using what you entered in
Shipmate. It reads Shipmate's page directly (no agent needed) and fills the ASC
pages in your already-logged-in session (no credentials, no 2FA handling).

## Load it (unpacked)

1. Chrome → `chrome://extensions` → turn on **Developer mode**.
2. **Load unpacked** → pick this `chrome-extension/` folder.
3. Pin the extension.

## Use it

1. Open **Shipmate**, fill in your data (incl. App Privacy). Click the extension
   → **Refresh from Shipmate**. The status line should show your app name and
   privacy answer. (This proves the data bridge works.)
2. Open **App Store Connect**:
   - On the **App Privacy** page, click **Fill App Privacy**.
   - In the **New App** dialog, click **Create app record**.

## Current state

Working now: the Shipmate → extension **data bridge** and an **Inspect** button.
The two fillers are **stubs** — they need the real ASC page structure, which is
behind your login and can't be known in advance.

## How we finish the fillers

On each target ASC page (App Privacy, and the New App dialog), click **Inspect
this App Store Connect page** and share the JSON it prints. That lists every
field/button with its label and id, which is exactly what's needed to write the
selectors. Then `fillPrivacy` / `createApp` in `content-asc.js` get implemented
against those.

Note on fragility: this drives Apple's web UI, so an ASC redesign can break the
selectors — expected for anything automating a web form Apple has no API for.
Re-run Inspect and adjust when that happens.

## Files

- `manifest.json` — MV3; content scripts on Shipmate + ASC, popup, worker.
- `inject-read-state.js` — page-context reader of Shipmate's `state` (app name, bundle id, App Privacy matrix).
- `content-shipmate.js` — injects the reader, stores the capture.
- `content-asc.js` — `introspect()` + `fillPrivacy`/`createApp` (stubs).
- `popup.html` / `popup.js` — status + buttons.
- `background.js` — minimal worker.
