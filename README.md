# Karbon Triage Keys

Chrome extension that adds keyboard shortcuts to Karbon's Triage inbox:

Default shortcuts (all changeable in Settings):

| Key | Action |
|-----|--------|
| `#` | Clear (archive) the open email |
| `w` | Add the open email to My Week (this or next week, per Settings) |
| `t` | Open "Add to Timeline" (the briefcase) for the open email |
| `n` | View new triage items (when Karbon shows the button) |
| `?` | Show the shortcut list (also lists Karbon's built-in keys) |
| `Alt + Shift + W` / `Alt + Shift + C` | In the Add to Timeline dialog: Work / Contact tab (works while typing) |
| `Ctrl + Enter` | In the Add to Timeline dialog: Add (`Esc` cancels, natively) |

Off by default, ready to turn on: next week (`Shift + W`), next/previous email (`j`/`k`), Save to Later (`l`), Add Reminder (`b`), Assign (`a`), Reply to All (`r`), Reply (`Shift + R`), Forward (`f`).

None of the defaults use Karbon's own keys (`Ctrl + K`, `Alt + S/E/N/W/C/T`, `Ctrl + Alt + T`). Shortcuts work in any email list (Triage, Later, Cleared, ...), are ignored while you're typing, and pause while a Karbon dialog is open (except the dialog's own keys).

## Settings

Click the extension's toolbar icon, or "Change shortcuts" at the bottom of the `?` list. You can:

- change any key (click it, press the new key; Backspace clears it), turn each shortcut on or off, and turn its hint chip on or off
- turn all hints off, switch hint style (Karbon gray or high contrast), hide the "Shortcuts" link, turn off messages
- choose whether `w` plans for this week or next week
- see warnings when a key clashes with another shortcut or with Karbon's own keys, and reset to defaults

Settings sync across your Chrome profiles.

**On-screen hints:** key chips styled like the Shortcuts row in Karbon's Help modal sit next to the open email's toolbar icons, Add to My Week, View New Triage Items, and the Add to Timeline dialog's tabs and buttons.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Reload any open Karbon tab.

## How it works

Each shortcut presses Karbon's own button, so Karbon updates the list itself. The recorded API calls are in [docs/karbon-api.md](docs/karbon-api.md). If Karbon changes its markup, update `SELECTORS` in `src/content.js`. The list of actions and their defaults is in `src/shared.js`; the settings page is in `options/`.
