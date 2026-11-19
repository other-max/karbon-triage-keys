# Navica Keys (archived)

> [!CAUTION]
> **Do not install or use this extension.** Karbon has told us in writing that it considers browser extensions that interact with, change, or automate its web app a violation of its [Terms of Use](https://karbonhq.com/terms/) and [Acceptable Use Policy](https://karbonhq.com/acceptable-use-policy/) (which limits access to "Karbon publicly supported interfaces"). Using it could get your firm's Karbon account suspended or terminated.
>
> The project is **discontinued and archived**. It has been removed from the Chrome Web Store, gets no updates, and accepts no issues or pull requests. The source is published only so people can read it and learn from it (Manifest V3 content scripts, shadow-DOM buttons, floating key hints, a settings page with clash detection). Navica LLC is not affiliated with or endorsed by Karbon. "Karbon" is Karbon's trademark.

Chrome extension (formerly Karbon Triage Keys) that added keyboard shortcuts to Karbon's Triage inbox. Built by Navica LLC in November 2026 and mothballed on 2026-11-19. The rest of this README describes how it worked.

Default shortcuts (all changeable in Settings):

| Key | Action |
|-----|--------|
| `e` | Clear (archive) the open email, as in Gmail and Outlook |
| `w` | Add the open email to My Week (this or next week, per Settings) |
| `t` | Open "Add to Timeline" (the briefcase) for the open email |
| `n` | View new triage items (when Karbon shows the button) |
| `c` | Add a comment to the open email |
| `Shift + E` / `Shift + N` / `Shift + K` | New email / New note / New work, on any Karbon page (opens Karbon's Create new menu and picks the item in one step) |
| `?` | Show the shortcut list (also lists Karbon's built-in keys) |
| `Alt + W` / `Alt + C` | In the Add to Timeline dialog: Work / Contact tab (works while typing) |
| `Ctrl + Enter` | In the Add to Timeline dialog: Add (`Esc` cancels, natively) |

Off by default, ready to turn on: next week (`Shift + W`), next/previous email (`j`/`k`), Save to Later (`l`), Add Reminder (`b`), Assign (`a`), Reply to All (`r`), Reply (`Shift + R`), Forward (`f`).

None of the defaults use Karbon's own keys (`Ctrl + K`, `Alt + S/E/N/W/C/T`, `Ctrl + Alt + T`) or common Chrome keys; the settings page warns if you pick one. Shortcuts work in any email list (Triage, Later, Cleared, ...), are ignored while you're typing, and pause while a Karbon dialog is open (except the dialog's own keys).

## Settings

Click the extension's toolbar icon, or "Change shortcuts" at the bottom of the `?` list. You can:

- change any key (click it, press the new key; Backspace clears it), turn each shortcut on or off, and turn its hint chip on or off
- turn all hints off, switch hint style (Karbon gray or high contrast), hide the "Shortcuts" link, turn off messages
- choose whether `w` plans for this week or next week
- see warnings when a key clashes with another shortcut or with Karbon's own keys, and reset to defaults

Settings sync across your Chrome profiles.

**On-screen hints:** key chips styled like the Shortcuts row in Karbon's Help modal sit centred under the open email's toolbar icons (in a floating layer, so Karbon's toolbar layout is untouched), and beside Add to My Week, View New Triage Items, and the Add to Timeline dialog's tabs and buttons.

## Install (unpacked)

Don't (see the warning above). For reference only:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Reload any open Karbon tab.

## Store listing

Everything for the Chrome Web Store is in [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md): listing text, permission justifications, privacy answers, and the pre-submit checklist.

- `store/description.txt`: the detailed description, pasted as is.
- `scripts/make-icons.sh`: renders `store/icon.svg` and `store/icon-small.svg` to `icons/`.
- `store/screenshots/render.sh`: renders the five 1280×800 screenshots and two promo tiles to `store/screenshots/out/`.
- `scripts/package.sh`: zips the extension to `dist/navica-keys-<version>.zip` for upload.
- `docs/privacy-policy.md`: the privacy policy (live copy on navica.llc).

## How it works

Each shortcut presses Karbon's own button, so Karbon updates the list itself. The recorded API calls are in [docs/karbon-api.md](docs/karbon-api.md). If Karbon changes its markup, update `SELECTORS` in `src/content.js`. The list of actions and their defaults is in `src/shared.js`; the settings page is in `options/`.

## License

[MIT](LICENSE). The license covers this code only. It gives you no rights under Karbon's terms, and it doesn't make using the extension with Karbon allowed.
