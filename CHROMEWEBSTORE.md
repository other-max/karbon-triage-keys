# Chrome Web Store Listing: Navica Keys for Karbon

> Last Updated: 2026-11-12

This file is the source for everything typed into the Chrome Developer Dashboard. Keep it in
step with `manifest.json`. Formerly "Karbon Triage Keys" (renamed in 0.7.0; the repo folder and
the internal `ktk` prefixes keep the old name, since users never see them).

## Store Listing

**Extension Name**
Navica Keys for Karbon: keyboard shortcuts for Triage (beta)

From the manifest `name` (60 of 75 characters). Drop " (beta)" from the name once the extension leaves beta. `short_name` is "Navica Keys". "Karbon" comes
after "for", never first, since it's Karbon's trademark.

**Short Description**
Keyboard shortcuts for Karbon's Triage inbox: clear, plan, file to a timeline, reply and more, with on-screen key hints.

From the manifest `description` (120 of 132 characters).

**Detailed Description**
Paste `store/description.txt` as is. It is plain text with line breaks, since the store strips
Markdown.

**Category**
Productivity (Workflow & Planning)

**Single Purpose**
Navica Keys for Karbon adds keyboard shortcuts, with on-screen key hints, to the Triage inbox in
Karbon's web app. Each shortcut presses one of Karbon's own email buttons (such as Clear, Add to
My Week, or Add to Timeline) for the open email.

**Primary Language**
English

## Graphics & Assets

Icons: `scripts/make-icons.sh` renders `store/icon.svg` (and `store/icon-small.svg` for 16px)
to `icons/`. Screenshots and tiles: `store/screenshots/render.sh` (headless Chrome; the chips,
shortcut list, and settings page are the extension's own styles, keys, and page).

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG (96px art, 16px clear space) | ✅ Ready | `icons/icon128.png` |
| Screenshot 1 | 1280×800 | ✅ Ready | `store/screenshots/out/1-triage.png` |
| Screenshot 2 | 1280×800 | ✅ Ready | `store/screenshots/out/2-help.png` |
| Screenshot 3 | 1280×800 | ✅ Ready | `store/screenshots/out/3-timeline.png` |
| Screenshot 4 | 1280×800 | ✅ Ready | `store/screenshots/out/4-more.png` |
| Screenshot 5 | 1280×800 | ✅ Ready | `store/screenshots/out/5-settings.png` |
| Small Promo Tile | 440×280 | ✅ Ready | `store/screenshots/out/small.png` |
| Marquee Promo Tile | 1400×560 | ✅ Ready | `store/screenshots/out/marquee.png` |

### Screenshot Notes

The Triage inbox in the shots is a plain mock (fictional firm and clients), not a capture of
Karbon, so no client data or Karbon branding appears.

1. Triage: the open email with key chips under Clear (#), Add to Timeline (T), and Comment (C),
   plus N on View new items and W on Add to My Week.
2. Shortcut list: the ? list over the inbox, with Karbon's built-in keys.
3. Add to Timeline: dialog with Work/Contact tab chips, Esc on Cancel, Ctrl + Enter on Add.
4. More shortcuts: the optional ones turned on, chips under every toolbar button.
5. Settings: the shortcut table with keys, on/off, and hint columns.

Re-render after changing chip styles, default keys, or the settings page.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Saves the user's shortcut settings: which key each shortcut uses, which shortcuts and key hints are on, the hint style, and whether "Add to My Week" plans for this week or next. Chrome syncs them across the user's own profiles. Nothing else is stored. |
| `https://app2.karbonhq.com/*` | host_permissions | Karbon's web app, the only site the extension works on. Its content script listens for the shortcut keys and, when one is pressed, presses Karbon's matching button for the open email (Clear, Add to My Week, Add to Timeline, Reply, the Create new menu, and so on). It also places small key hints beside those buttons. It reads no email content and makes no network requests. |

**Remote code:** No. All code ships in the package.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No.

The content script finds Karbon's buttons on the page and presses them, as a click would. It
doesn't read or keep email, client, or work content, and it makes no network requests. Karbon
performs each action through the user's own session.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | | No |
| Health info | No | No | | No |
| Financial info | No | No | | No |
| Authentication info | No | No | | No |
| Personal communications | No | No | | No |
| Location | No | No | | No |
| Web history | No | No | | No |
| User activity | No | No | | No |
| Website content | No | No | | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
https://navica.llc/tools/navica-keys/privacy/

Source: `docs/privacy-policy.md`. The live page is in the `navica-marketing` repo
(`src/pages/tools/navica-keys/privacy.astro`). Keep both in step.

## Distribution

**Visibility**: Public (or Unlisted for a soft launch)
**Regions**: All regions

## Developer Info

**Publisher Name**
Navica LLC (the same developer account as Glint Reader and Reckonry Timer for Karbon)

**Contact Email**
max@navica.llc

**Support URL**
https://navica.llc/tools/navica-keys/#support

**Homepage URL**
https://navica.llc/tools/navica-keys/ (also the manifest `homepage_url`)

## Before submitting

- [x] Name chosen and applied (manifest, settings page, docs)
- [x] Icons at 16, 32, 48, 128
- [x] Store copy, screenshots, promo tiles
- [x] Privacy policy written (`docs/privacy-policy.md`)
- [ ] Tools page and privacy page live on navica.llc (`navica-marketing`)
- [ ] Test 0.7.0 by hand from this folder, unpacked: icon shows in the toolbar, settings page
      title, shortcuts and chips in Karbon
- [ ] `scripts/package.sh`, upload `dist/navica-keys-0.7.0.zip`, fill the listing and Privacy
      tab from this file, submit for review
- [ ] After approval: add the store URL to the tools page (`navica-marketing`) so the button
      replaces "Coming soon"

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.8.0 | 2026-11-12 | Create new shortcuts: `+` opens Karbon's Create new menu from any Karbon page, then E/N/W/C/T picks Email, Note, Work, Contact or Time Entry, with key chips in the menu. Settings now warn when a key is a common Chrome shortcut. Clear (archive) is now E, the archive key in Gmail and Outlook, instead of # (which deletes in Gmail); if you never changed the Clear key, it moves to E automatically. | Draft |
| 0.7.1 | 2026-11-12 | Key chips show each key in its own box (Alt and W side by side, no "+"), like Karbon's own tooltips, with a clearer outline. | Draft |
| 0.7.0 | 2026-11-12 | Renamed to Navica Keys for Karbon, listed as beta. New icon. Store listing, screenshots, privacy policy, and homepage link. | Draft |
| 0.6.0 | 2026-11-12 | Toolbar key chips now sit centred under each icon without changing Karbon's layout. New Comment shortcut (c). Fixed the My Week chip landing at the bottom of the sidebar. | Unpublished |
| 0.5.1 | 2026-11-12 | Fixed toolbar key chips wrapping onto a second line. R is now Reply to All and Shift+R Reply. Dialog tab keys moved to Alt+Shift+W/C so no default clashes with Karbon's own keys. Reset-to-default is now an icon. | Unpublished |
| 0.5.0 | 2026-11-12 | Settings page: change keys, turn shortcuts and their hints on or off, hint style, Shortcuts link, messages, My Week target, clash warnings, reset. New optional actions: next week, next/previous email, Save to Later, Reminder, Assign, Reply, Reply All, Forward. Works in Later/Cleared lists too. | Unpublished |
| 0.4.0 | 2026-11-12 | Key chips moved to the open email's toolbar and restyled to match Karbon's Help modal; dialog hints for Work/Contact, Add (Ctrl+Enter) and Cancel (Esc); shortcut list includes Karbon's built-in keys. | Unpublished |
| 0.3.0 | 2026-11-12 | View new items (n), Work/Contact tab switch, on-screen key hints and ? cheat sheet; dropped the unused API host permission. | Unpublished |
| 0.2.0 | 2026-11-12 | Working shortcuts: # Clear, w Add to My Week, t Add to Timeline. | Unpublished |
| 0.1.0 | 2026-11-12 | Skeleton: `#` key handler with stubbed actions. | Unpublished |

## Review Notes

### Known Issues / Limitations
- Works only on Karbon's web app at app2.karbonhq.com. If Karbon changes its page markup, a
  shortcut can stop finding its button until the extension is updated.
- Shortcuts act on the email open in the reading pane; with no email open, they show "No email
  open".

### Rejection History
None yet.
