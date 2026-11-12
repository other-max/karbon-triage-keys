// Karbon Triage Keys — content script on app2.karbonhq.com.
//
// Shortcuts (single keys are ignored while typing or while a Karbon dialog is open):
//   #       Clear (archive) the open email
//   w       Add the open email to My Week (This Week)
//   t       Open "Add to Timeline" (the briefcase / Add to Work) for the open email
//   n       View new triage items (when Karbon shows the "View New Triage Items" button)
//   ?       Show or hide the shortcut list
// In the Add to Timeline dialog (work even while typing in its search box;
// they take over Karbon's global Alt+W / Alt+C only while that dialog is open):
//   Alt+W   Switch to the Work tab
//   Alt+C   Switch to the Contact tab
//   Ctrl+Enter  Add (Esc already cancels, natively)
//
// Each shortcut presses Karbon's own button, so Karbon makes the API call and
// updates the list itself. The underlying requests are in docs/karbon-api.md.
// Key chips are styled to match the Shortcuts row in Karbon's Help modal.

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
  {
    title: 'Triage',
    items: [
      ['#', 'Clear'],
      ['W', 'Add to My Week'],
      ['T', 'Add to Timeline'],
      ['N', 'View new items'],
      ['?', 'This list'],
    ],
  },
  {
    title: 'Add to Timeline dialog',
    items: [
      ['Alt + W', 'Work tab'],
      ['Alt + C', 'Contact tab'],
      ['Ctrl + Enter', 'Add'],
      ['Esc', 'Cancel'],
    ],
  },
  {
    title: 'Karbon (built in)',
    items: [
      ['Ctrl + K', 'Search'],
      ['Alt + S', 'Search'],
      ['Alt + E', 'Email'],
      ['Alt + N', 'Note'],
      ['Alt + W', 'Work'],
      ['Alt + C', 'Contact'],
      ['Alt + T', 'Timer'],
      ['Ctrl + Alt + T', 'Time Entry'],
    ],
  },
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
  tabLabel: '[class*="tab-label"]',
  dialogAdd: '[role="dialog"] [data-e2e="button__splitButtonMainAction"]',
};

// Dialog footer buttons share a generic data-e2e, so match Cancel by text.
function dialogCancelButton() {
  return [...document.querySelectorAll(`${SELECTORS.dialog} button`)].find(
    (el) => el.textContent.trim().startsWith('Cancel')
  );
}

// v2 key: the 0.3.0 bar's × made it too easy to hide hints by accident.
const HINTS_HIDDEN_KEY = 'karbonTriageKeys.hideHints.v2';

// ---------- finding Karbon's controls ----------

function onTriage() {
  return /\/triage(\/|$)/.test(location.pathname);
}

// The row Karbon highlights as open in the reading pane.
function focusedRow() {
  return [...document.querySelectorAll(SELECTORS.row)].find((row) =>
    row.querySelector(`.${SELECTORS.selectedRowClass}`)
  );
}

// The open email's toolbar button (same buttons as the row hover icons, but
// outside the list). Falls back to the open row's hover button.
function openEmailButton(selector) {
  const toolbar = [...document.querySelectorAll(selector)].find(
    (el) => !el.closest(SELECTORS.row) && el.getBoundingClientRect().width > 0
  );
  return toolbar ?? focusedRow()?.querySelector(selector) ?? null;
}

// The "View New Triage Items" pill has no stable attribute, so match its text.
function viewNewButton() {
  return [...document.querySelectorAll('[role="button"]')].find((el) =>
    /View New Triage Items/i.test(el.textContent)
  );
}

// Karbon's buttons are <khq-button> web components; click the inner native
// button when there is one so Karbon sees a normal click.
function press(el) {
  const inner = el.shadowRoot?.querySelector('button');
  (inner ?? el).click();
}

function isTyping(event) {
  const target = event.composedPath()[0];
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]')
  );
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'ktk-toast';
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
}

function hintsHidden() {
  try { return localStorage.getItem(HINTS_HIDDEN_KEY) === '1'; } catch { return false; }
}

function setHintsHidden(hidden) {
  try { localStorage.setItem(HINTS_HIDDEN_KEY, hidden ? '1' : '0'); } catch { /* storage blocked */ }
  document.documentElement.classList.toggle('ktk-hints-hidden', hidden);
}

// ---------- actions ----------

function pressOpenEmailButton(selector, missing) {
  const button = openEmailButton(selector);
  if (!button) return toast(focusedRow() ? missing : 'No email open — click one first');
  press(button);
}

function switchTab(selector) {
  const tab = document.querySelector(selector);
  if (!tab) return;
  tab.click();
  // Keep typing in the search box after switching.
  requestAnimationFrame(() => {
    document.querySelector(`${SELECTORS.dialog} input`)?.focus();
  });
}

const actions = {
  archive() {
    pressOpenEmailButton(SELECTORS.clearButton, 'Clear button not found');
  },
  addToTimeline() {
    pressOpenEmailButton(SELECTORS.addToWorkButton, 'Add to Timeline button not found');
  },
  addToWeek() {
    const button = document.querySelector(SELECTORS.addToWeekButton);
    if (button) return press(button);
    toast(focusedRow() ? 'Already on My Week (or not an email)' : 'No email open — click one first');
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

  // Ctrl+Enter presses Add in the Add to Timeline dialog.
  if (event.key === 'Enter' && event.ctrlKey && !event.altKey && !event.metaKey) {
    const add = document.querySelector(SELECTORS.workTab) && document.querySelector(SELECTORS.dialogAdd);
    if (add) {
      event.preventDefault();
      event.stopPropagation();
      add.click();
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

// .ktk-key copies Karbon's Help modal chip (.help-modal__shortcuts__item span):
// #e6e6e6 background, #999 text, 2px radius, 0 5px padding, Metric font.
const STYLE = `
.ktk-key {
  display: inline-block; align-self: center; flex: none;
  background: #e6e6e6; color: #999; border-radius: 2px; padding: 0 5px;
  font-family: Metric, sans-serif; font-weight: 400; font-size: 12px; line-height: 17px;
  white-space: nowrap; pointer-events: none;
}
.ktk-key--toolbar { margin: 0 6px 0 -2px; }
.ktk-key--inline { margin: 0 0 0 6px; vertical-align: middle; }
[data-e2e="button__splitButtonMainAction"] .ktk-key { background: rgba(255,255,255,.22); color: rgba(255,255,255,.85); }
.ktk-hints-hidden [data-ktk-for] { display: none !important; }

.ktk-help-launch {
  position: fixed; right: 16px; bottom: 12px; z-index: 2147483000;
  display: flex; align-items: center; gap: 6px; padding: 0;
  border: 0; background: none; cursor: pointer;
  font-family: Metric, sans-serif; font-size: 13px; color: #999;
}
.ktk-help-launch:hover { color: #666; }
.ktk-help-launch .ktk-key { font-size: 12px; }

.ktk-help {
  position: fixed; inset: 0; z-index: 2147483600;
  display: grid; place-items: center; background: rgba(0,0,0,.3);
}
.ktk-help-card {
  width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 64px); overflow: auto;
  padding: 20px 24px; border-radius: 4px; background: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,.2);
  font-family: Metric, sans-serif; font-size: 16px; line-height: 22.4px; color: #999;
}
.ktk-help-card h3 { margin: 0 0 6px; font: inherit; color: #999; }
.ktk-help-section + .ktk-help-section { margin-top: 18px; }
.ktk-help-items { display: flex; flex-wrap: wrap; gap: 10px 12px; }
.ktk-help-item { display: flex; flex-direction: column; align-items: center; min-width: 72px; }
.ktk-help-item .ktk-key { font-size: 16px; line-height: 22.4px; min-width: 55px; text-align: center; }
.ktk-help-foot { margin-top: 18px; font-size: 13px; }
.ktk-help-foot a { color: #4a7fd6; }

.ktk-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #1f2937; color: #fff; padding: 8px 14px; border-radius: 6px;
  font: 13px system-ui, sans-serif; z-index: 2147483647; pointer-events: none;
}
`;

function keyChip(key, variant, owner) {
  const el = document.createElement('span');
  el.className = variant ? `ktk-key ktk-key--${variant}` : 'ktk-key';
  el.textContent = key;
  if (owner) el.dataset.ktkFor = owner;
  return el;
}

// Put a chip right after `target`, once.
function ensureChipAfter(target, key, variant, owner) {
  if (!target) return;
  if (target.nextElementSibling?.dataset?.ktkFor === owner) return;
  document.querySelectorAll(`[data-ktk-for="${owner}"]`).forEach((old) => old.remove());
  target.after(keyChip(key, variant, owner));
}

function ensureChipInside(target, key, owner) {
  if (!target || target.querySelector(`[data-ktk-for="${owner}"]`)) return;
  target.append(keyChip(key, 'inline', owner));
}

function toolbarButton(selector) {
  return [...document.querySelectorAll(selector)].find((el) => !el.closest(SELECTORS.row)) ?? null;
}

function ensureHelpLauncher() {
  let launcher = document.querySelector('.ktk-help-launch');
  if (!onTriage()) return launcher?.remove();
  if (launcher) return;
  launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'ktk-help-launch';
  launcher.dataset.ktkFor = 'launcher';
  launcher.append(keyChip('?'), 'Shortcuts');
  launcher.addEventListener('click', () => actions.toggleHelp());
  document.body.append(launcher);
}

function showHelp() {
  const overlay = document.createElement('div');
  overlay.className = 'ktk-help';
  const card = document.createElement('div');
  card.className = 'ktk-help-card';

  for (const section of HELP) {
    const wrap = document.createElement('div');
    wrap.className = 'ktk-help-section';
    const title = document.createElement('h3');
    title.textContent = `${section.title}:`;
    const items = document.createElement('div');
    items.className = 'ktk-help-items';
    for (const [key, label] of section.items) {
      const item = document.createElement('div');
      item.className = 'ktk-help-item';
      item.append(keyChip(key), label);
      items.append(item);
    }
    wrap.append(title, items);
    card.append(wrap);
  }

  const foot = document.createElement('div');
  foot.className = 'ktk-help-foot';
  const toggle = document.createElement('a');
  toggle.href = '#';
  toggle.textContent = hintsHidden() ? 'Show key hints on buttons' : 'Hide key hints on buttons';
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    setHintsHidden(!hintsHidden());
    overlay.remove();
  });
  foot.append(toggle, ' · Esc to close');
  card.append(foot);

  overlay.append(card);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.append(overlay);
}

function decorate() {
  ensureHelpLauncher();
  if (!onTriage()) return;

  // Open email's toolbar (not the row hover icons).
  ensureChipAfter(toolbarButton(SELECTORS.addToWorkButton), 'T', 'toolbar', 'toolbar-work');
  ensureChipAfter(toolbarButton(SELECTORS.clearButton), '#', 'toolbar', 'toolbar-clear');

  ensureChipAfter(document.querySelector(SELECTORS.addToWeekButton), 'W', 'inline', 'week');
  ensureChipInside(viewNewButton(), 'N', 'view-new');
  // Add to Timeline dialog: chips beside the tab labels and footer buttons.
  const workTab = document.querySelector(SELECTORS.workTab);
  const contactTab = document.querySelector(SELECTORS.contactTab);
  ensureChipInside(workTab?.querySelector(SELECTORS.tabLabel) ?? workTab, 'Alt + W', 'tab-work');
  ensureChipInside(contactTab?.querySelector(SELECTORS.tabLabel) ?? contactTab, 'Alt + C', 'tab-contact');
  if (workTab) {
    ensureChipInside(document.querySelector(SELECTORS.dialogAdd), 'Ctrl + Enter', 'dialog-add');
    ensureChipInside(dialogCancelButton(), 'Esc', 'dialog-cancel');
  }
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
