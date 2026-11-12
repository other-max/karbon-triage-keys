# Karbon Triage Keys

Chrome extension that adds keyboard shortcuts to Karbon's Triage inbox:

| Key | Action |
|-----|--------|
| `#` | Clear (archive) the email in focus |
| `w` | Add the email in focus to My Week |
| `t` | Open "Add to Timeline" (the briefcase) for the email in focus |
| `n` | View new triage items (when Karbon shows the button) |
| `Alt+W` / `Alt+C` | In the Add to Timeline dialog: switch to Work / Contact |
| `?` | Show the cheat sheet |

"In focus" means the email open in the reading pane. Single-key shortcuts are ignored while you're typing or while a Karbon dialog is open; the Alt shortcuts work while typing in the dialog's search box.

**On-screen hints:** key badges appear on Karbon's own buttons (the row's Clear and briefcase icons, Add to My Week, View New Triage Items, the dialog's Work/Contact tabs), and a key bar sits in the bottom-right corner. Hide them with the × on the bar, or bring them back from the `?` cheat sheet.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Reload any open Karbon tab.

## How it works

Each shortcut presses Karbon's own button, so Karbon updates the list itself. The recorded API calls are in [docs/karbon-api.md](docs/karbon-api.md). If Karbon changes its markup, update `SELECTORS` in `src/content.js`.
