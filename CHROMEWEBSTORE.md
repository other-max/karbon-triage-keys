# Chrome Web Store Listing — Karbon Triage Keys

> Last Updated: 2026-11-12

Status: personal tool, loaded unpacked. Not yet planned for publishing; this file tracks what the dashboard would need if that changes.

## Store Listing

**Extension Name**
Karbon Triage Keys

**Short Description**
Keyboard shortcuts for Karbon's Triage inbox: press # to archive the open email, or a second key to add it to My Week.

**Detailed Description**
TBD once both shortcuts work.

**Category**
Productivity

**Single Purpose**
Adds keyboard shortcuts for archiving emails and adding them to My Week in Karbon's Triage inbox.

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
| `https://app2.karbonhq.com/*` | host_permissions | Listens for the shortcut keys while you use Karbon and reads which email is open, so the shortcut acts on that email. |
| `https://*.karbonhq.com/*` | host_permissions | Sends the archive and add-to-My-Week requests to Karbon's regional servers (for example us3.karbonhq.com) using your existing Karbon sign-in. |

## Privacy & Data Use

**Does the extension collect user data?** No. It sends requests only to Karbon, on your behalf, when you press a shortcut. Nothing is stored or sent anywhere else.

## Privacy Policy

**Privacy Policy URL**
TBD (only needed if published).

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-11-12 | Skeleton: `#` key handler with stubbed actions. |
