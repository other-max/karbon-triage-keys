// Navica Keys for Karbon — content script on app2.karbonhq.com.
//
// Keys, which shortcuts are on, and which show chips all come from the
// settings page (src/shared.js has the action list and defaults). Each
// shortcut presses Karbon's own button, so Karbon makes the API call and
// updates the list itself; the recorded requests are in docs/karbon-api.md.
// Key chips copy the Shortcuts row in Karbon's Help modal.

const { ACTIONS, GROUPS, KARBON_SHORTCUTS, eventToBinding, bindingKeys } = globalThis.KTK;

let settings = globalThis.KTK.mergeSettings(null);

const SELECTORS = {
  row: '[data-triage-list-item-id]',
  rowMain: '[role="button"]',
  selectedRowClass: 'khq-bg-sentiment-action-tint',
  clearButton: '[data-e2e="triage-item-clear"]',
  addToWorkButton: '[data-e2e="triage-item-add-to-work"]',
  saveToLaterButton: '[data-e2e="triage-item-save-to-later"]',
  assignButton: '[data-e2e="triage-item-assign-to-colleague"]',
  reminderButton: '[data-e2e="button__triage__reminder"]',
  replyButton: '[data-e2e="button__triageStickyMenu__replyAction"]',
  replyAllButton: '[data-e2e="button__triageStickyMenu__replyToAllAction"]',
  forwardButton: '[data-e2e="button__triageStickyMenu__forwardAction"]',
  commentButton: 'khq-button[icon="comment"]',
  addToWeekButton: '[data-e2e="button__emailSideTray__planForThisWeek"]',
  removeFromWeekButton: '[data-e2e="button__emailSideTray__removeFromMyWeek"]',
  weekOption: (n) => `[data-e2e="button__listItem__week-${n}"]`,
  dialog: '[role="dialog"]',
  workTab: '[role="dialog"] [data-e2e="tab__work"]',
  contactTab: '[role="dialog"] [data-e2e="tab__contact"]',
  tabLabel: '[class*="tab-label"]',
  dialogAdd: '[role="dialog"] [data-e2e="button__splitButtonMainAction"]',
  createButton: '[data-e2e="global-nav-bar__addButton"]',
  createMenuOpen: '[data-e2e="global-nav-bar__addButton"][aria-expanded="true"]',
  createItem: (name) => `[role="menuitem"][data-e2e="global-nav-bar__${name}"]`,
};

// ---------- finding Karbon's controls ----------

function rows() {
  return [...document.querySelectorAll(SELECTORS.row)];
}

// Shortcuts work on any list of triage items (Triage, Later, Cleared, ...).
function onTriageList() {
  return Boolean(document.querySelector(SELECTORS.row));
}

// The row Karbon highlights as open in the reading pane.
function focusedRow() {
  return rows().find((row) => row.querySelector(`.${SELECTORS.selectedRowClass}`));
}

// A control in the open email's toolbar (outside the list rows).
function toolbarButton(selector) {
  return [...document.querySelectorAll(selector)].find(
    (el) => !el.closest(SELECTORS.row) && el.getBoundingClientRect().width > 0
  ) ?? null;
}

// The toolbar button, or the open row's hover button as a fallback.
function openEmailButton(selector) {
  return toolbarButton(selector) ?? focusedRow()?.querySelector(selector) ?? null;
}

// The "View New Triage Items" pill has no stable attribute, so match its text.
function viewNewButton() {
  return [...document.querySelectorAll('[role="button"]')].find((el) =>
    /View New Triage Items/i.test(el.textContent)
  );
}

// Dialog footer buttons share a generic data-e2e, so match Cancel by text.
function dialogCancelButton() {
  return [...document.querySelectorAll(`${SELECTORS.dialog} button`)].find((el) =>
    el.textContent.trim().startsWith('Cancel')
  );
}

// The "This Week ⌄" picker shown once an email is on My Week.
function myWeekPicker() {
  let el = document.querySelector(SELECTORS.removeFromWeekButton);
  for (let i = 0; el && i < 6; i++, el = el.parentElement) {
    const picker = el.querySelector('[data-e2e="form-item"] [role="button"]');
    if (picker) return picker;
  }
  return null;
}

// Karbon's buttons are often <khq-button> web components; click the inner
// native button when there is one so Karbon sees a normal click. Reminder is
// a wrapper div around a khq-button.
function press(el) {
  const target = el.matches('khq-button') ? el : el.querySelector('khq-button') ?? el;
  const inner = target.shadowRoot?.querySelector('button');
  (inner ?? target).click();
}

// Karbon's Create new (+) menu in the top bar.
function createMenuOpen() {
  return Boolean(document.querySelector(SELECTORS.createMenuOpen));
}

function createItem(name) {
  return createMenuOpen() ? document.querySelector(SELECTORS.createItem(name)) : null;
}

// Opens the menu if needed, then picks the item, so one key does both.
async function createNew(name) {
  let item = createItem(name);
  if (!item) {
    const button = toolbarButton(SELECTORS.createButton);
    if (!button) return toast('Create new (+) button not found');
    button.click();
    item = await waitFor(() => createItem(name), 1500);
  }
  if (!item) return toast('Create new menu didn’t open');
  item.click();
}

async function waitFor(find, timeout = 2000) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const found = find();
    if (found) return found;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

function isTyping(event) {
  const target = event.composedPath()[0];
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]')
  );
}

function toast(text) {
  if (!settings.toastsEnabled) return;
  const el = document.createElement('div');
  el.className = 'ktk-toast';
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
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

// which: 0 = this week, 1 = next week.
async function planWeek(which) {
  const add = document.querySelector(SELECTORS.addToWeekButton);
  if (add) {
    press(add);
    if (which === 0) return;
  } else if (!myWeekPicker()) {
    return toast(focusedRow() ? 'This item can’t be added to My Week' : 'No email open — click one first');
  } else if (which === 0) {
    return toast('Already on My Week');
  }
  // Karbon re-renders the side tray once the add is saved, which closes a
  // picker opened too early, so let it settle and retry a few times.
  for (let attempt = 0; attempt < 4; attempt++) {
    const picker = await waitFor(myWeekPicker);
    if (!picker) break;
    await new Promise((r) => setTimeout(r, add ? 400 : 0));
    myWeekPicker()?.click();
    const option = await waitFor(() => document.querySelector(SELECTORS.weekOption(which)), 800);
    if (option) {
      option.click();
      return;
    }
  }
  toast('Couldn’t switch to next week — use the My Week picker');
}

function openAdjacentEmail(step) {
  const all = rows();
  if (!all.length) return;
  const index = all.indexOf(focusedRow());
  const next = index === -1 ? all[0] : all[index + step];
  if (!next) return toast(step > 0 ? 'Last email on this page' : 'First email on this page');
  next.querySelector(SELECTORS.rowMain)?.click();
  next.scrollIntoView({ block: 'nearest' });
}

const ACTION_HANDLERS = {
  clear: () => pressOpenEmailButton(SELECTORS.clearButton, 'Clear button not found'),
  addToWeek: () => planWeek(settings.myWeekTarget === 'next' ? 1 : 0),
  addToNextWeek: () => planWeek(1),
  addToTimeline: () => pressOpenEmailButton(SELECTORS.addToWorkButton, 'Add to Timeline button not found'),
  viewNew: () => {
    const button = viewNewButton();
    if (!button) return toast('No new triage items');
    button.click();
  },
  nextEmail: () => openAdjacentEmail(1),
  prevEmail: () => openAdjacentEmail(-1),
  saveToLater: () => pressOpenEmailButton(SELECTORS.saveToLaterButton, 'Save to Later button not found'),
  reminder: () => pressOpenEmailButton(SELECTORS.reminderButton, 'Reminder button not found'),
  assign: () => pressOpenEmailButton(SELECTORS.assignButton, 'Assign button not found'),
  reply: () => pressOpenEmailButton(SELECTORS.replyButton, 'Reply button not found'),
  replyAll: () => pressOpenEmailButton(SELECTORS.replyAllButton, 'Reply to All button not found'),
  forward: () => pressOpenEmailButton(SELECTORS.forwardButton, 'Forward button not found'),
  comment: () => pressOpenEmailButton(SELECTORS.commentButton, 'Comment button not found'),
  newEmail: () => createNew('email'),
  newNote: () => createNew('note'),
  newWork: () => createNew('work'),
  toggleHelp: () => {
    const existing = document.querySelector('.ktk-help');
    if (existing) return existing.remove();
    showHelp();
  },
  workTab: () => switchTab(SELECTORS.workTab),
  contactTab: () => switchTab(SELECTORS.contactTab),
  dialogAdd: () => document.querySelector(SELECTORS.dialogAdd)?.click(),
  dialogCancel: null, // Karbon handles Esc itself; listed for its chip only.
};

// ---------- keyboard ----------

function findAction(binding, group) {
  return ACTIONS.find((a) => {
    const s = settings.shortcuts[a.id];
    return a.group === group && s.enabled && s.binding === binding && ACTION_HANDLERS[a.id];
  });
}

function run(event, action) {
  event.preventDefault();
  event.stopPropagation();
  Promise.resolve()
    .then(() => ACTION_HANDLERS[action.id]())
    .catch((err) => {
      console.error('[Navica Keys]', err);
      toast(`Failed: ${err.message}`);
    });
}

document.addEventListener('keydown', (event) => {
  if (event.isComposing) return;
  const binding = eventToBinding(event);
  if (!binding) return;

  if (event.key === 'Escape' && document.querySelector('.ktk-help')) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelector('.ktk-help').remove();
    return;
  }

  // Add to Timeline dialog: these work even while typing in its search box.
  if (document.querySelector(SELECTORS.workTab)) {
    const action = findAction(binding, 'dialog');
    if (action) run(event, action);
    return;
  }

  if (event.repeat || isTyping(event)) return;
  if (document.querySelector(SELECTORS.dialog)) return; // another Karbon dialog is open

  // Create new keys work on any page. While Karbon's + menu is open, other
  // keys (arrows, Enter, Esc) are left to the menu.
  const create = findAction(binding, 'create');
  if (create) return run(event, create);
  if (createMenuOpen()) return;
  const action = findAction(binding, 'triage');
  if (action && onTriageList()) run(event, action);
}, true);

// ---------- on-screen hints ----------

// A chip (.ktk-key) is a row of key boxes (.ktk-cap), one per key and no
// "+", like Karbon's own tooltips. Boxes copy Karbon's Help modal chip
// (.help-modal__shortcuts__item span): #e6e6e6 / #999, 2px radius, Metric.
const STYLE = `
.ktk-key {
  display: inline-flex; align-items: center; gap: 2px; align-self: center; flex: none;
  font-family: Metric, sans-serif; font-weight: 400; font-size: 12px; line-height: 17px;
  white-space: nowrap; pointer-events: none;
}
.ktk-cap {
  display: inline-block; box-sizing: border-box; min-width: 17px; padding: 0 4px; text-align: center;
  background: #e6e6e6; color: #888; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.1);
}
.ktk-contrast .ktk-cap { background: #4b5563; color: #fff; box-shadow: none; font-weight: 600; }
/* Toolbar chips float in their own layer, centred just under each icon, so
   Karbon's toolbar layout is never touched. Below Karbon's dialogs/menus. */
.ktk-layer { position: fixed; inset: 0; pointer-events: none; z-index: 20; }
.ktk-key--under {
  position: fixed; transform: translateX(-50%);
  gap: 1px; font-size: 10px; line-height: 13px;
}
.ktk-key--under .ktk-cap { min-width: 13px; padding: 0 3px; }
.ktk-key--inline { margin: 0 0 0 6px; vertical-align: middle; }
/* Create new (+) menu: chip at the right edge, before Karbon's own Alt hint. */
.ktk-key--menu { order: 1; margin-left: auto; }
[role="menuitem"]:has(> .ktk-key--menu) > [data-slot="dropdown-menu-shortcut"] { order: 2; margin-left: 8px; }
[data-e2e="button__splitButtonMainAction"] .ktk-cap { box-shadow: none; background: rgba(255,255,255,.22); color: rgba(255,255,255,.85); }

.ktk-help-launch {
  position: fixed; right: 16px; bottom: 12px; z-index: 2147483000;
  display: flex; align-items: center; gap: 6px; padding: 0;
  border: 0; background: none; cursor: pointer;
  font-family: Metric, sans-serif; font-size: 13px; color: #999;
}
.ktk-help-launch:hover { color: #666; }

.ktk-help {
  position: fixed; inset: 0; z-index: 2147483600;
  display: grid; place-items: center; background: rgba(0,0,0,.3);
}
.ktk-help-card {
  width: min(600px, calc(100vw - 32px)); max-height: calc(100vh - 64px); overflow: auto;
  padding: 20px 24px; border-radius: 4px; background: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,.2);
  font-family: Metric, sans-serif; font-size: 16px; line-height: 22.4px; color: #999;
}
.ktk-help-card h3 { margin: 0 0 6px; font: inherit; color: #999; }
.ktk-help-section + .ktk-help-section { margin-top: 18px; }
.ktk-help-items { display: flex; flex-wrap: wrap; gap: 10px 12px; }
.ktk-help-item { display: flex; flex-direction: column; align-items: center; min-width: 72px; max-width: 120px; text-align: center; }
.ktk-help-item .ktk-key { gap: 3px; font-size: 16px; line-height: 22.4px; }
.ktk-help-item .ktk-cap { min-width: 22px; padding: 0 5px; }
.ktk-help-foot { margin-top: 18px; font-size: 13px; }
.ktk-help-foot a { color: #4a7fd6; cursor: pointer; }

.ktk-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #1f2937; color: #fff; padding: 8px 14px; border-radius: 6px;
  font: 13px system-ui, sans-serif; z-index: 2147483647; pointer-events: none;
}
`;

// Where each action's chip goes: [find target, placement, chip variant].
// 'after' puts the chip beside the control, 'inside' appends it.
const HINT_TARGETS = {
  clear: [() => toolbarButton(SELECTORS.clearButton), 'after', 'toolbar'],
  addToTimeline: [() => toolbarButton(SELECTORS.addToWorkButton), 'after', 'toolbar'],
  saveToLater: [() => toolbarButton(SELECTORS.saveToLaterButton), 'after', 'toolbar'],
  reminder: [() => toolbarButton(SELECTORS.reminderButton), 'after', 'toolbar'],
  assign: [() => toolbarButton(SELECTORS.assignButton), 'after', 'toolbar'],
  reply: [() => toolbarButton(SELECTORS.replyButton), 'after', 'toolbar'],
  replyAll: [() => toolbarButton(SELECTORS.replyAllButton), 'after', 'toolbar'],
  forward: [() => toolbarButton(SELECTORS.forwardButton), 'after', 'toolbar'],
  comment: [() => toolbarButton(SELECTORS.commentButton), 'after', 'toolbar'],
  addToWeek: [() => document.querySelector(SELECTORS.addToWeekButton), 'after', 'inline'],
  addToNextWeek: [() => document.querySelector(SELECTORS.addToWeekButton), 'after', 'inline'],
  viewNew: [viewNewButton, 'inside', 'inline'],
  // Only there while Karbon's + menu is open; createItem() is null otherwise.
  newEmail: [() => createItem('email'), 'inside', 'menu'],
  newNote: [() => createItem('note'), 'inside', 'menu'],
  newWork: [() => createItem('work'), 'inside', 'menu'],
  workTab: [() => tabLabel(SELECTORS.workTab), 'inside', 'inline'],
  contactTab: [() => tabLabel(SELECTORS.contactTab), 'inside', 'inline'],
  dialogAdd: [() => document.querySelector(SELECTORS.workTab) && document.querySelector(SELECTORS.dialogAdd), 'inside', 'inline'],
  dialogCancel: [() => document.querySelector(SELECTORS.workTab) && dialogCancelButton(), 'inside', 'inline'],
};

function tabLabel(selector) {
  const tab = document.querySelector(selector);
  return tab?.querySelector(SELECTORS.tabLabel) ?? tab;
}

function keyChip(binding, variant, owner) {
  const el = document.createElement('span');
  el.className = variant ? `ktk-key ktk-key--${variant}` : 'ktk-key';
  setKeys(el, binding);
  if (owner) el.dataset.ktkFor = owner;
  return el;
}

// Fill a chip with one box per key; skips the DOM work if nothing changed.
function setKeys(el, binding) {
  if (el.dataset.binding === binding) return;
  el.dataset.binding = binding;
  el.replaceChildren(...bindingKeys(binding).map((key) => {
    const cap = document.createElement('span');
    cap.className = 'ktk-cap';
    cap.textContent = key;
    return cap;
  }));
}

function showsHint(id) {
  const s = settings.shortcuts[id];
  return settings.hintsEnabled && s.enabled && s.hint && Boolean(s.binding);
}

// Chips placed after a control sit in a run of siblings right after it.
function chipRunAfter(target) {
  const run = [];
  for (let el = target.nextElementSibling; el?.dataset?.ktkFor; el = el.nextElementSibling) run.push(el);
  return run;
}

function chipLayer() {
  let layer = document.querySelector('.ktk-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'ktk-layer';
    document.body.append(layer);
  }
  return layer;
}

// Toolbar icons: a chip in the floating layer, centred under the button.
function placeUnderChip(id, target) {
  document.querySelectorAll(`[data-ktk-for="${id}"]:not(.ktk-key--under)`).forEach((el) => el.remove());
  const layer = chipLayer();
  let chip = layer.querySelector(`[data-ktk-for="${id}"]`);
  const rect = target?.getBoundingClientRect();
  if (!rect || !rect.width) return chip?.remove();
  if (!chip) {
    chip = keyChip('', 'under', id);
    layer.append(chip);
  }
  setKeys(chip, settings.shortcuts[id].binding);
  const left = `${Math.round(rect.left + rect.width / 2)}px`;
  const top = `${Math.round(rect.bottom - 3)}px`;
  if (chip.style.left !== left) chip.style.left = left;
  if (chip.style.top !== top) chip.style.top = top;
}

function placeChip(id) {
  const [find, placement, variant] = HINT_TARGETS[id];
  if (variant === 'toolbar') return placeUnderChip(id, find());
  const target = find();
  const existing = document.querySelectorAll(`[data-ktk-for="${id}"]`);
  if (!target) return existing.forEach((el) => el.remove());

  const binding = settings.shortcuts[id].binding;
  const siblings = placement === 'after' ? chipRunAfter(target) : [...target.children];
  const mine = siblings.find((el) => el.dataset.ktkFor === id);
  existing.forEach((el) => { if (el !== mine) el.remove(); });
  if (mine) return setKeys(mine, binding);
  const chip = keyChip(binding, variant, id);
  if (placement === 'after') (siblings.at(-1) ?? target).after(chip);
  else target.append(chip);
}

function ensureHelpLauncher() {
  let launcher = document.querySelector('.ktk-help-launch');
  if (!(settings.helpLinkEnabled && onTriageList())) return launcher?.remove();
  const help = settings.shortcuts.toggleHelp;
  const text = help.enabled && help.binding ? help.binding : '';
  if (launcher && launcher.dataset.key === text) return;
  launcher?.remove();
  launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'ktk-help-launch';
  launcher.dataset.key = text;
  if (text) launcher.append(keyChip(text));
  launcher.append('Shortcuts');
  launcher.addEventListener('click', () => ACTION_HANDLERS.toggleHelp());
  document.body.append(launcher);
}

function openSettings() {
  chrome.runtime.sendMessage({ type: 'openOptions' }).catch(() => {});
}

function showHelp() {
  const overlay = document.createElement('div');
  overlay.className = 'ktk-help';
  const card = document.createElement('div');
  card.className = 'ktk-help-card';

  const sections = Object.entries(GROUPS).map(([group, title]) => ({
    title,
    items: ACTIONS
      .filter((a) => a.group === group && settings.shortcuts[a.id].enabled && settings.shortcuts[a.id].binding)
      .map((a) => [settings.shortcuts[a.id].binding, a.short ?? a.label]),
  }));
  sections.push({ title: 'Karbon (built in)', items: KARBON_SHORTCUTS });

  for (const section of sections) {
    if (!section.items.length) continue;
    const wrap = document.createElement('div');
    wrap.className = 'ktk-help-section';
    const title = document.createElement('h3');
    title.textContent = `${section.title}:`;
    const items = document.createElement('div');
    items.className = 'ktk-help-items';
    for (const [binding, label] of section.items) {
      const item = document.createElement('div');
      item.className = 'ktk-help-item';
      item.append(keyChip(binding), label);
      items.append(item);
    }
    wrap.append(title, items);
    card.append(wrap);
  }

  const foot = document.createElement('div');
  foot.className = 'ktk-help-foot';
  const settingsLink = document.createElement('a');
  settingsLink.textContent = 'Change shortcuts';
  settingsLink.addEventListener('click', () => { overlay.remove(); openSettings(); });
  const toggle = document.createElement('a');
  toggle.textContent = settings.hintsEnabled ? 'Hide key hints' : 'Show key hints';
  toggle.addEventListener('click', async () => {
    overlay.remove();
    await globalThis.KTK.saveSettings({ ...settings, hintsEnabled: !settings.hintsEnabled });
  });
  foot.append(settingsLink, ' · ', toggle, ' · Esc to close');
  card.append(foot);

  overlay.append(card);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.append(overlay);
}

function decorate() {
  document.documentElement.classList.toggle('ktk-contrast', settings.hintStyle === 'contrast');
  ensureHelpLauncher();
  for (const id of Object.keys(HINT_TARGETS)) {
    if (showsHint(id)) placeChip(id);
    else document.querySelectorAll(`[data-ktk-for="${id}"]`).forEach((el) => el.remove());
  }
}

async function start() {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

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

  settings = await globalThis.KTK.loadSettings();
  globalThis.KTK.onSettingsChanged((next) => {
    settings = next;
    schedule();
  });

  // The layer lives in <body>; ignore its own changes so it can't loop.
  new MutationObserver((records) => {
    if (records.every((r) => r.target.closest?.('.ktk-layer'))) return;
    schedule();
  }).observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
  });
  // Floating chips follow their buttons when panes scroll or the window resizes.
  document.addEventListener('scroll', schedule, { capture: true, passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
}

start();
