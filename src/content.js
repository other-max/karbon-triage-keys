// Karbon Triage Keys — content script on app2.karbonhq.com.
//
// Shortcuts (single keys are ignored while typing or while a Karbon dialog is open):
//   #       Clear (archive) the email in focus
//   w       Add the email in focus to My Week (This Week)
//   t       Open "Add to Timeline" (the briefcase / Add to Work) for the email in focus
//   n       View new triage items (when Karbon shows the "View New Triage Items" button)
//   ?       Show or hide the shortcut cheat sheet
// In the Add to Timeline dialog (work even while typing in its search box):
//   Alt+W   Switch to the Work tab
//   Alt+C   Switch to the Contact tab
//
// Each shortcut presses Karbon's own button, so Karbon makes the API call
// and updates the list itself. The underlying requests are documented in
// docs/karbon-api.md. On-screen hints label Karbon's buttons with their keys.

const SHORTCUTS = {
  '#': 'archive',
  w: 'addToWeek',
  t: 'addToTimeline',
  n: 'viewNew',
  '?': 'toggleHelp',
};

// Alt+<key> shortcuts, matched on event.code so they work on any layout.
const DIALOG_SHORTCUTS = {
  KeyW: 'workTab',
  KeyC: 'contactTab',
};

const HELP = [
  ['#', 'Clear the open email'],
  ['W', 'Add the open email to My Week'],
  ['T', 'Add the open email to a timeline'],
  ['N', 'View new triage items'],
  ['Alt+W', 'Add to Timeline: Work tab'],
  ['Alt+C', 'Add to Timeline: Contact tab'],
  ['?', 'Show or hide this list'],
];

const SELECTORS = {
  row: '[data-triage-list-item-id]',
  selectedRowClass: 'khq-bg-sentiment-action-tint',
  clearButton: '[data-e2e="triage-item-clear"]',
  addToWorkButton: '[data-e2e="triage-item-add-to-work"]',
  addToWeekButton: '[data-e2e="button__emailSideTray__planForThisWeek"]',
  dialog: '[role="dialog"]',
  workTab: '[role="dialog"] [data-e2e="tab__work"]',
  contactTab: '[role="dialog"] [data-e2e="tab__contact"]',
};

// The "View New Triage Items" pill has no stable attribute, so match its text.
function viewNewButton() {
  return [...document.querySelectorAll('[role="button"]')].find((el) =>
    /View New Triage Items/i.test(el.textContent)
  );
}

const HINTS_HIDDEN_KEY = 'karbonTriageKeys.hintsHidden';

// ---------- helpers ----------

function isTyping(event) {
  const target = event.composedPath()[0];
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]')
  );
}

function onTriage() {
  return /\/triage(\/|$)/.test(location.pathname);
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'ktk-toast';
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
}

// Karbon's buttons are <khq-button> web components; click the inner native
// button when there is one so Karbon sees a normal click.
function press(el) {
  const inner = el.shadowRoot?.querySelector('button');
  (inner ?? el).click();
}

// The row Karbon highlights as open in the reading pane.
function focusedRow() {
  return [...document.querySelectorAll(SELECTORS.row)].find((row) =>
    row.querySelector(`.${SELECTORS.selectedRowClass}`)
  );
}

function rowAction(selector, missing) {
  const row = focusedRow();
  if (!row) return toast('No email open — click one first');
  const button = row.querySelector(selector);
  if (!button) return toast(missing);
  press(button);
}

function hintsHidden() {
  try { return localStorage.getItem(HINTS_HIDDEN_KEY) === '1'; } catch { return false; }
}

function setHintsHidden(hidden) {
  try { localStorage.setItem(HINTS_HIDDEN_KEY, hidden ? '1' : '0'); } catch { /* storage blocked */ }
  document.documentElement.classList.toggle('ktk-hints-hidden', hidden);
}

// ---------- actions ----------

const actions = {
  archive() {
    rowAction(SELECTORS.clearButton, 'Clear button not found');
  },
  addToTimeline() {
    rowAction(SELECTORS.addToWorkButton, 'Add to Timeline button not found');
  },
  addToWeek() {
    if (!focusedRow()) return toast('No email open — click one first');
    const button = document.querySelector(SELECTORS.addToWeekButton);
    if (!button) return toast('Already on My Week (or not an email)');
    press(button);
  },
  viewNew() {
    const button = viewNewButton();
    if (!button) return toast('No new triage items');
    button.click();
  },
  workTab() {
    switchTab(SELECTORS.workTab);
  },
  contactTab() {
    switchTab(SELECTORS.contactTab);
  },
  toggleHelp() {
    const existing = document.querySelector('.ktk-help');
    if (existing) return existing.remove();
    showHelp();
  },
};

function switchTab(selector) {
  const tab = document.querySelector(selector);
  if (!tab) return;
  tab.click();
  // Keep typing in the search box after switching.
  requestAnimationFrame(() => {
    document.querySelector(`${SELECTORS.dialog} input`)?.focus();
  });
}

// ---------- keyboard ----------

document.addEventListener('keydown', (event) => {
  // Alt+W / Alt+C inside the Add to Timeline dialog.
  if (event.altKey && !event.ctrlKey && !event.metaKey) {
    const name = DIALOG_SHORTCUTS[event.code];
    if (name && document.querySelector(SELECTORS.workTab)) {
      event.preventDefault();
      event.stopPropagation();
      actions[name]();
    }
    return;
  }

  if (event.key === 'Escape' && document.querySelector('.ktk-help')) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelector('.ktk-help').remove();
    return;
  }

  if (event.ctrlKey || event.metaKey || event.repeat) return;
  if (!onTriage() || isTyping(event)) return;
  if (document.querySelector(SELECTORS.dialog)) return; // a Karbon dialog is open
  const name = SHORTCUTS[event.key];
  if (!name) return;
  event.preventDefault();
  event.stopPropagation();
  try {
    actions[name]();
  } catch (err) {
    console.error('[Karbon Triage Keys]', err);
    toast(`Failed: ${err.message}`);
  }
}, true);

// ---------- on-screen hints ----------

const STYLE = `
.ktk-hint {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 14px; height: 14px; padding: 0 3px; box-sizing: border-box;
  border: 1px solid #c7ccd4; border-bottom-width: 2px; border-radius: 3px;
  background: #fff; color: #4b5563;
  font: 600 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase; pointer-events: none; white-space: nowrap;
}
.ktk-hint--inline { margin-left: 6px; vertical-align: middle; }
/* Overlaid on the corner of an icon button without taking layout space. */
.ktk-hint--corner { position: absolute; margin: -6px 0 0 -10px; z-index: 1; }
.ktk-hints-hidden .ktk-hint, .ktk-hints-hidden .ktk-bar { display: none !important; }

.ktk-bar {
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483000;
  display: flex; align-items: center; gap: 10px;
  padding: 6px 8px 6px 10px; border-radius: 8px;
  background: rgba(255,255,255,.96); border: 1px solid #e5e7eb;
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  font: 12px system-ui, sans-serif; color: #374151;
}
.ktk-bar span { display: inline-flex; align-items: center; gap: 4px; }
.ktk-bar .ktk-hint { position: static; margin: 0; }
.ktk-bar button {
  border: 0; background: none; color: #9ca3af; cursor: pointer;
  font: 14px/1 system-ui, sans-serif; padding: 0 2px;
}
.ktk-bar button:hover { color: #374151; }

.ktk-help {
  position: fixed; inset: 0; z-index: 2147483600;
  display: grid; place-items: center; background: rgba(17,24,39,.35);
}
.ktk-help-card {
  min-width: 300px; padding: 16px 18px; border-radius: 10px; background: #fff;
  box-shadow: 0 12px 40px rgba(0,0,0,.2); font: 13px system-ui, sans-serif; color: #111827;
}
.ktk-help-card h2 { margin: 0 0 10px; font-size: 14px; }
.ktk-help-card table { border-collapse: collapse; width: 100%; }
.ktk-help-card td { padding: 5px 0; }
.ktk-help-card td:first-child { width: 70px; }
.ktk-help-card .ktk-hint { height: 18px; min-width: 18px; font-size: 11px; }
.ktk-help-card p { margin: 12px 0 0; color: #6b7280; font-size: 12px; }

.ktk-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #1f2937; color: #fff; padding: 8px 14px; border-radius: 6px;
  font: 13px system-ui, sans-serif; z-index: 2147483647; pointer-events: none;
}
`;

function badge(key, variant, owner) {
  const el = document.createElement('kbd');
  el.className = `ktk-hint ktk-hint--${variant}`;
  el.textContent = key;
  el.dataset.ktkFor = owner;
  return el;
}

// Put a badge right after `target`, once.
function ensureBadgeAfter(target, key, variant, owner) {
  if (!target) return;
  const next = target.nextElementSibling;
  if (next?.dataset?.ktkFor === owner) return;
  target.after(badge(key, variant, owner));
}

function ensureBadgeInside(target, key, owner) {
  if (!target || target.querySelector(`[data-ktk-for="${owner}"]`)) return;
  target.append(badge(key, 'inline', owner));
}

function ensureBar() {
  let bar = document.querySelector('.ktk-bar');
  if (!onTriage()) return bar?.remove();
  if (bar) return;
  bar = document.createElement('div');
  bar.className = 'ktk-bar';
  for (const [key, label] of [['#', 'Clear'], ['W', 'My Week'], ['T', 'Timeline'], ['?', 'All keys']]) {
    const item = document.createElement('span');
    const k = document.createElement('kbd');
    k.className = 'ktk-hint';
    k.textContent = key;
    item.append(k, label);
    bar.append(item);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.title = 'Hide key hints (press ? to see the list anytime)';
  close.textContent = '×';
  close.addEventListener('click', () => setHintsHidden(true));
  bar.append(close);
  document.body.append(bar);
}

function showHelp() {
  const overlay = document.createElement('div');
  overlay.className = 'ktk-help';
  const card = document.createElement('div');
  card.className = 'ktk-help-card';
  const title = document.createElement('h2');
  title.textContent = 'Triage shortcuts';
  const table = document.createElement('table');
  for (const [key, label] of HELP) {
    const tr = table.insertRow();
    const k = document.createElement('kbd');
    k.className = 'ktk-hint';
    k.textContent = key;
    tr.insertCell().append(k);
    tr.insertCell().textContent = label;
  }
  const note = document.createElement('p');
  const toggle = document.createElement('a');
  toggle.href = '#';
  toggle.textContent = hintsHidden() ? 'Show on-screen key hints' : 'Hide on-screen key hints';
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    setHintsHidden(!hintsHidden());
    overlay.remove();
  });
  note.append(toggle, ' · Esc to close');
  card.append(title, table, note);
  overlay.append(card);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.append(overlay);
}

function decorate() {
  ensureBar();
  if (!onTriage()) return;

  // Row buttons: badge only the open email's row; drop badges left on other rows.
  const row = focusedRow();
  for (const old of document.querySelectorAll('[data-ktk-for="row-clear"], [data-ktk-for="row-work"]')) {
    if (!row || !row.contains(old)) old.remove();
  }
  if (row) {
    ensureBadgeAfter(row.querySelector(SELECTORS.clearButton), '#', 'corner', 'row-clear');
    ensureBadgeAfter(row.querySelector(SELECTORS.addToWorkButton), 'T', 'corner', 'row-work');
  }

  ensureBadgeAfter(document.querySelector(SELECTORS.addToWeekButton), 'W', 'inline', 'week');
  ensureBadgeInside(viewNewButton(), 'N', 'view-new');
  ensureBadgeInside(document.querySelector(SELECTORS.workTab), 'Alt+W', 'tab-work');
  ensureBadgeInside(document.querySelector(SELECTORS.contactTab), 'Alt+C', 'tab-contact');
}

function start() {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);
  document.documentElement.classList.toggle('ktk-hints-hidden', hintsHidden());

  // Karbon re-renders constantly; re-apply hints at most once per frame.
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      decorate();
    });
  };
  new MutationObserver(schedule).observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
  });
  schedule();
}

start();
