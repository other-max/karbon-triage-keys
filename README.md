# Karbon Triage Keys

Chrome extension that adds keyboard shortcuts to Karbon's Triage inbox:

| Key | Action |
|-----|--------|
| `#` | Archive the email in focus |
| TBD | Add the email in focus to My Week |

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Reload any open Karbon tab.

## Next steps

1. Capture the network requests Karbon makes when you archive an email and when you add one to My Week (in a signed-in Karbon tab).
2. Work out how to identify the "email in focus" (URL, selected row, or an ID in the page).
3. Replace the stubs in `src/content.js` with the real calls.

Notes from the sibling `reckonry-timer-for-karbon` project: the app runs on `app2.karbonhq.com`, its API lives on a regional host such as `us3.karbonhq.com`, and calls authenticate with the signed-in session cookies (no CSRF token needed).
