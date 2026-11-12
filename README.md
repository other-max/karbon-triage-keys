# Karbon Triage Keys

Chrome extension that adds keyboard shortcuts to Karbon's Triage inbox:

| Key | Action |
|-----|--------|
| `#` | Clear (archive) the open email |
| `w` | Add the open email to My Week |
| `t` | Open "Add to Timeline" (the briefcase) for the open email |
| `n` | View new triage items (when Karbon shows the button) |
| `?` | Show the shortcut list (also lists Karbon's built-in keys) |

In the Add to Timeline dialog:

| Key | Action |
|-----|--------|
| `Alt + W` / `Alt + C` | Switch to Work / Contact (works while typing in the search box) |
| `Ctrl + Enter` | Add |
| `Esc` | Cancel (Karbon's own behavior) |

Single-key shortcuts are ignored while you're typing or while a Karbon dialog is open. Inside the dialog, `Alt + W` / `Alt + C` take over Karbon's global "new Work" / "new Contact" keys.

**On-screen hints:** key chips styled like the Shortcuts row in Karbon's Help modal appear next to the open email's toolbar icons (briefcase `T`, Clear `#`), Add to My Week, View New Triage Items, and the dialog's tabs and buttons. A `? Shortcuts` link sits bottom-right; the shortcut list can turn the chips off and on.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Reload any open Karbon tab.

## How it works

Each shortcut presses Karbon's own button, so Karbon updates the list itself. The recorded API calls are in [docs/karbon-api.md](docs/karbon-api.md). If Karbon changes its markup, update `SELECTORS` in `src/content.js`.
