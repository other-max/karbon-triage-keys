# Chrome Web Store Listing — Karbon Triage Keys

> Last Updated: 2026-11-12

Status: personal tool, loaded unpacked. Not yet planned for publishing; this file tracks what the dashboard would need if that changes.

## Store Listing

**Extension Name**
Karbon Triage Keys

**Short Description**
Keyboard shortcuts for Karbon's Triage inbox: clear, add to My Week, add to a timeline and view new items, with on-screen key hints.

**Detailed Description**
TBD once both shortcuts work.

**Category**
Productivity

**Single Purpose**
Adds keyboard shortcuts for clearing, planning (My Week) and filing (Add to Timeline) emails in Karbon's Triage inbox.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ⬜ Not created | |
| Screenshot 1 | 1280×800 or 640×400 | ⬜ Not created | |

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `https://app2.karbonhq.com/*` | host_permissions | Listens for the shortcut keys while you use Karbon and presses Karbon's own Clear, Add to My Week, Add to Timeline or View New Triage Items button, and labels those buttons with their shortcut keys. |

## Privacy & Data Use

**Does the extension collect user data?** No. It only presses Karbon's own buttons when you press a shortcut. The only thing it stores is whether you've hidden the key hints, in your browser.

## Privacy Policy

**Privacy Policy URL**
TBD (only needed if published).

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.3.0 | 2026-11-12 | View new items (n), Work/Contact tab switch (Alt+W/Alt+C), on-screen key hints and ? cheat sheet; dropped the unused API host permission. |
| 0.2.0 | 2026-11-12 | Working shortcuts: # Clear, w Add to My Week, t Add to Timeline. |
| 0.1.0 | 2026-11-12 | Skeleton: `#` key handler with stubbed actions. |
