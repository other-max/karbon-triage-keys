// Settings page: edits the settings in chrome.storage.sync that the content
// script reads. Every change saves immediately.

const { ACTIONS, GROUPS, KARBON_SHORTCUTS, DEFAULTS, formatBinding, eventToBinding, findConflicts } = globalThis.KTK;

let settings;
let capturingId = null;

const $ = (sel) => document.querySelector(sel);

function chip(text) {
  const el = document.createElement('span');
  el.className = 'chip';
  el.textContent = text;
  return el;
}

// ---------- saving ----------

let statusTimer;
async function save() {
  try {
    await globalThis.KTK.saveSettings(settings);
    setStatus('Saved');
  } catch (err) {
    console.error(err);
    setStatus(`Couldn’t save: ${err.message}`);
  }
}

function setStatus(text) {
  $('#status').textContent = text;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { $('#status').textContent = ''; }, 2000);
}

function update(mutator) {
  mutator(settings);
  render();
  save();
}

// ---------- general settings ----------

function bindGeneral() {
  for (const id of ['hintsEnabled', 'helpLinkEnabled', 'toastsEnabled']) {
    $(`#${id}`).addEventListener('change', (e) => update((s) => { s[id] = e.target.checked; }));
  }
  $('#myWeekTarget').addEventListener('change', (e) => update((s) => { s.myWeekTarget = e.target.value; }));
  for (const radio of document.querySelectorAll('input[name="hintStyle"]')) {
    radio.addEventListener('change', (e) => update((s) => { s.hintStyle = e.target.value; }));
  }

  const reset = $('#reset');
  reset.addEventListener('click', () => {
    if (!reset.classList.contains('is-confirming')) {
      reset.classList.add('is-confirming');
      reset.textContent = 'Click again to reset all shortcuts and settings';
      setTimeout(() => {
        reset.classList.remove('is-confirming');
        reset.textContent = 'Reset everything to defaults';
      }, 4000);
      return;
    }
    reset.classList.remove('is-confirming');
    reset.textContent = 'Reset everything to defaults';
    settings = structuredClone(DEFAULTS);
    render();
    save();
  });
}

function renderGeneral() {
  $('#hintsEnabled').checked = settings.hintsEnabled;
  $('#helpLinkEnabled').checked = settings.helpLinkEnabled;
  $('#toastsEnabled').checked = settings.toastsEnabled;
  $('#myWeekTarget').value = settings.myWeekTarget;
  for (const radio of document.querySelectorAll('input[name="hintStyle"]')) {
    radio.checked = radio.value === settings.hintStyle;
  }
  document.body.classList.toggle('contrast', settings.hintStyle === 'contrast');
}

// ---------- shortcut tables ----------

function buildGroups() {
  const container = $('#groups');
  const template = $('#shortcut-row');

  for (const [group, title] of Object.entries(GROUPS)) {
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = `${title} shortcuts`;
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = group === 'triage'
      ? 'Work in Triage, Later, Cleared and other email lists, when you’re not typing.'
      : 'Work while the Add to Timeline dialog is open, even while typing in its search box.';

    const table = document.createElement('div');
    table.className = 'card table';
    table.setAttribute('role', 'table');
    table.setAttribute('aria-label', `${title} shortcuts`);
    const head = document.createElement('div');
    head.className = 'table-head';
    head.setAttribute('role', 'row');
    for (const [text, cls] of [['Action', ''], ['Key', ''], ['On', 'center'], ['Hint', 'center'], ['', '']]) {
      const cell = document.createElement('span');
      cell.setAttribute('role', 'columnheader');
      cell.className = cls;
      cell.textContent = text;
      head.append(cell);
    }
    table.append(head);

    for (const action of ACTIONS.filter((a) => a.group === group)) {
      const row = template.content.firstElementChild.cloneNode(true);
      row.dataset.id = action.id;

      const label = row.querySelector('.shortcut-label');
      label.textContent = action.label;
      if (action.note || action.fixed) {
        const small = document.createElement('small');
        small.textContent = action.fixed ? 'Karbon’s own key. Only the hint can be turned off.' : action.note;
        label.append(small);
      }

      const keyButton = row.querySelector('.key-button');
      keyButton.setAttribute('aria-pressed', 'false');
      keyButton.disabled = Boolean(action.fixed);
      keyButton.addEventListener('click', () => startCapture(action.id));

      const enabled = row.querySelector('.enabled');
      enabled.setAttribute('aria-label', `${action.label}: on`);
      enabled.disabled = Boolean(action.fixed);
      enabled.addEventListener('change', (e) => update((s) => { s.shortcuts[action.id].enabled = e.target.checked; }));

      const hint = row.querySelector('.hint');
      hint.setAttribute('aria-label', `${action.label}: show hint`);
      if (!action.hint) {
        hint.disabled = true;
        hint.title = 'No on-screen button to label';
      }
      hint.addEventListener('change', (e) => update((s) => { s.shortcuts[action.id].hint = e.target.checked; }));

      row.querySelector('.default').addEventListener('click', () => update((s) => {
        s.shortcuts[action.id] = { ...DEFAULTS.shortcuts[action.id] };
      }));

      table.append(row);
    }

    section.append(h2, note, table);
    container.append(section);
  }
}

function renderShortcuts() {
  const issues = findConflicts(settings);
  for (const action of ACTIONS) {
    const row = document.querySelector(`.shortcut[data-id="${action.id}"]`);
    const s = settings.shortcuts[action.id];
    const capturing = capturingId === action.id;

    row.classList.toggle('is-off', !s.enabled);
    row.querySelector('.enabled').checked = s.enabled;
    row.querySelector('.hint').checked = action.hint && s.hint;

    const keyButton = row.querySelector('.key-button');
    keyButton.setAttribute('aria-pressed', String(capturing));
    keyButton.replaceChildren();
    if (capturing) {
      const p = document.createElement('span');
      p.className = 'placeholder';
      p.textContent = 'Press a key… (Esc to cancel)';
      keyButton.append(p);
    } else if (s.binding) {
      keyButton.append(chip(formatBinding(s.binding)));
      keyButton.setAttribute('aria-label', `${action.label}: ${formatBinding(s.binding)}. Click to change.`);
    } else {
      const p = document.createElement('span');
      p.className = 'placeholder';
      p.textContent = 'No key — click to set';
      keyButton.append(p);
      keyButton.setAttribute('aria-label', `${action.label}: no key. Click to set.`);
    }

    const def = DEFAULTS.shortcuts[action.id];
    const reset = row.querySelector('.default');
    reset.hidden = action.fixed || (s.binding === def.binding && s.enabled === def.enabled && s.hint === def.hint);
    const defText = `${def.binding ? formatBinding(def.binding) : 'no key'}, ${def.enabled ? 'on' : 'off'}`;
    reset.title = `Reset to default (${defText})`;
    reset.setAttribute('aria-label', `Reset “${action.label}” to default (${defText})`);

    const list = row.querySelector('.issues');
    list.replaceChildren(...(issues[action.id] ?? []).map(({ level, message }) => {
      const li = document.createElement('li');
      li.className = level;
      li.textContent = message;
      return li;
    }));
  }
}

// ---------- key capture ----------

function startCapture(id) {
  capturingId = id;
  render();
  document.querySelector(`.shortcut[data-id="${id}"] .key-button`).focus();
}

function stopCapture() {
  const id = capturingId;
  capturingId = null;
  render();
  if (id) document.querySelector(`.shortcut[data-id="${id}"] .key-button`)?.focus();
}

document.addEventListener('keydown', (event) => {
  if (!capturingId) return;
  event.preventDefault();
  event.stopPropagation();
  const binding = eventToBinding(event);
  if (!binding) return; // bare modifier; wait for the real key
  if (binding === 'Escape') return stopCapture();
  if (binding === 'Tab' || binding === 'Shift+Tab') return stopCapture();
  const id = capturingId;
  capturingId = null;
  update((s) => {
    s.shortcuts[id].binding = binding === 'Backspace' || binding === 'Delete' ? '' : binding;
    if (s.shortcuts[id].binding) s.shortcuts[id].enabled = true;
  });
  document.querySelector(`.shortcut[data-id="${id}"] .key-button`)?.focus();
}, true);

document.addEventListener('focusout', (event) => {
  if (capturingId && event.target.closest?.('.key-button')) {
    // Leaving the button cancels capture (unless focus is moving back to it).
    requestAnimationFrame(() => {
      if (capturingId && !document.activeElement?.closest?.('.key-button[aria-pressed="true"]')) {
        capturingId = null;
        render();
      }
    });
  }
});

// ---------- Karbon reference ----------

function renderBuiltins() {
  $('#builtins').replaceChildren(...KARBON_SHORTCUTS.map(([binding, label]) => {
    const item = document.createElement('span');
    item.className = 'builtin';
    const c = chip(formatBinding(binding));
    c.classList.add('chip--karbon');
    item.append(c, label);
    return item;
  }));
}

// ---------- start ----------

function render() {
  renderGeneral();
  renderShortcuts();
}

async function start() {
  settings = await globalThis.KTK.loadSettings();
  buildGroups();
  bindGeneral();
  renderBuiltins();
  render();

  // Reflect changes made elsewhere (for example "Hide key hints" in Karbon).
  globalThis.KTK.onSettingsChanged((next) => {
    if (JSON.stringify(next) === JSON.stringify(settings)) return;
    settings = next;
    render();
  });
}

start();
