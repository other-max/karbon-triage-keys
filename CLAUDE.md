# Navica Keys

**MOTHBALLED 2026-11-19. Do no new work here.** Karbon said in writing that it considers the extension a violation of its Terms of Use. The Chrome Web Store listing is unpublished, and the GitHub repo is public under MIT and archived (read-only), with a do-not-use warning at the top of `README.md`. To change anything, first unarchive it with `gh repo unarchive other-max/karbon-triage-keys`, and keep the warning.

Chrome extension (Manifest V3, no build step) that adds keyboard shortcuts and on-screen key hints to Karbon's Triage inbox at `app2.karbonhq.com` (and Karbon's staging app, `webapp-stage.karbonhq.com`). Formerly Karbon Triage Keys; the folder name and internal `ktk`/`KTK` prefixes keep the old name on purpose. Being prepared for the Chrome Web Store under Navica LLC (homepage and privacy page at navica.llc/tools/navica-keys/, in the `navica-marketing` repo). Keep `CHROMEWEBSTORE.md` updated with every user-facing or permission change (version history, permission justifications).

## Layout

- `src/shared.js` — the action list (`ACTIONS`: id, group, label, default key, on/off, hint), Karbon's built-in shortcuts, default settings, key-binding helpers, settings storage, settings migrations (`MIGRATIONS`, bump `SETTINGS_VERSION` when a default key changes), and clash detection. Loaded by both the content script and the settings page via `globalThis.KTK`.
- `src/content.js` — runs in Karbon. `SELECTORS` (Karbon's DOM hooks), `ACTION_HANDLERS`, keyboard handling, and hint chips (`HINT_TARGETS`).
- `src/background.js` — opens the settings page from the toolbar icon or the in-page `?` list.
- `options/` — the settings page.
- `docs/karbon-api.md` — Karbon's recorded requests and the UI hooks behind each action.
- `tools/` — local test servers (see below).
- `icons/`, `store/`, `scripts/` — store assets: icon sources (`store/icon*.svg`, rendered by `scripts/make-icons.sh`), `store/description.txt`, screenshot scenes (`store/screenshots/render.sh`), and `scripts/package.sh` for the upload zip. Re-render screenshots when chip styles, default keys, or the settings page change.

## How it works

- Every shortcut presses Karbon's own button rather than calling its API, so Karbon updates the list itself (it auto-advances after Clear).
- The open email is the row whose inner `[role=button]` has `khq-bg-sentiment-action-tint`. Toolbar buttons share `data-e2e` values with the row hover icons, so look for the ones outside `[data-triage-list-item-id]`.
- Many Karbon buttons are `<khq-button>` web components: click the `button` in their `shadowRoot`, and don't put children inside them (there's no slot, so they won't render).
- Toolbar icon chips float in a fixed `.ktk-layer` centred under each icon so Karbon's toolbar layout is never changed. Karbon's dialogs live inside a stacking context below that layer, so `shadeLikeTarget` checks what covers each button and dims the chip by a see-through backdrop (or hides it under something solid). Reply, Reply to All and Forward are plain `<button>`s, so their chips go inside, at the end. Chips on links and text buttons sit inline beside them. Each chip is a row of key boxes (`.ktk-cap`), one per key with no `+`, like Karbon's own tooltips; the boxes use Karbon's Help modal colours (`#e6e6e6`, Metric font) with a faint outline. `formatBinding` (`Alt + W`) is only for plain-text messages.
- "Add to My Week: next week" adds the email, then picks `button__listItem__week-1` from the This Week picker. Karbon re-renders the side tray after the save, so it waits and retries.
- Default keys must not clash with Karbon's built-ins (`Ctrl+K`, `Alt+S/E/N/W/C/T`, `Ctrl+Alt+T`), except the Add to Timeline dialog's Alt+W/Alt+C tab keys, which only apply while that dialog is open, or common Chrome keys (`BROWSER_SHORTCUTS`). Prefer single keys, then Alt. R is Reply to All and Shift+R is Reply.
- The `create` group (Shift+E/N/K: new email, note, work) works on any Karbon page: each opens Karbon's Create new (+) menu and clicks the item. It shares the page with the triage group, so `findConflicts` checks the two together. Work is K because Shift+W is My Week: next week.

## Testing

There are no automated tests. Check changes in the browser:

- Both test servers take a port argument (`serve-src.py 8767`, `preview-options.py . 8769`) when 8765/8766 are taken by something else.
- **Settings page:** run `tools/preview-options.py` (the `options-preview` entry in `.claude/launch.json`) and open `http://127.0.0.1:8766/options/options.html`. It fakes `chrome.storage` in memory (`window.__stubData`).
- **In Karbon, without reloading the extension:** run `tools/serve-src.py` (port 8765), then in a Karbon tab use the page's JavaScript to fake `chrome.storage`/`chrome.runtime`, fetch `shared.js` and `content.js`, and `eval` each wrapped in `(() => { … })()`. If the installed extension is also running in that tab, rename `data-ktk-for`/`dataset.ktkFor`/`ktk-layer` in the injected source first. Otherwise the two copies fight over the same chips, and keys like `e` fire twice.
- Browser automation's `shift+w` sends `key: "w"` with Shift held. To test Shift keys, dispatch a `KeyboardEvent` with the real `key` (`"W"`).
- Use throwaway emails (marketing or notifications) for anything that changes Karbon data, and undo it afterwards (Remove from My Week, move out of Cleared).
- After a change, Max reloads the extension on `chrome://extensions` and refreshes Karbon.
