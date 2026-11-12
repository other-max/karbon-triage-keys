# Karbon requests behind the shortcuts

Recorded 2026-11-12 in the Triage split view. The extension doesn't call these itself; it presses Karbon's own buttons, and Karbon sends these requests. They're kept here in case we ever need to call them directly (for example, bulk actions).

All requests go to the regional API host (`https://us3.karbonhq.com`), are authenticated by the signed-in session cookie, and carry `X-Karbon-Connection-Id`, `X-Karbon-Local-Time` and `X-PracticeIQ-Current-Route` headers. `{tenant}` is the tenant perma key from the app URL (`app2.karbonhq.com/{tenant}/triage`). `{id}` is the row's `data-triage-list-item-id`, which is the same as the email conversation perma key.

## Clear (`#`)

`PUT /triage/api/{tenant}/triageItems/{id}`

Body: `{ "triageItem": { ...the full triage item as listed..., "action": "ClearTriageItem" } }`. The item includes `entityPermaKey`, `entityType: "EmailConversation"`, `versionId`, `title`, and so on.

UI: row button `khq-button[data-e2e="triage-item-clear"]` (title "Clear").

## Add to My Week (`w`)

`PUT /contentitems/api/{tenant}/emailConversationV2s/{id}`

Body: `{ "emailConversationV2": { ...current conversation state..., "action": "AddToMyWeek" } }`. Removing from My Week sends the same shape with `"action": "RemoveFromMyWeek"`, after which the item has `userHasAddedToMyWeek: true`, `myWeekIdentifier: "ThisWeek"` and `myWeekLaterDate` (the Monday of the week).

UI: email side tray button `[data-e2e="button__emailSideTray__planForThisWeek"]` ("Add to My Week").

## Add to Timeline (`t`)

UI only: row button `khq-button[data-e2e="triage-item-add-to-work"]` (briefcase, title "Add to Work") opens the "Add to Timeline" dialog with the work search focused. You pick the work item and press Add. The request it sends wasn't recorded.

## Which row is in focus

The row open in the reading pane has an inner `[role=button]` with class `khq-bg-sentiment-action-tint`.
