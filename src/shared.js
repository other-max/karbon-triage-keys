// Shared by the content script and the settings page: the list of actions,
// default settings, key-binding helpers, and settings storage.
//
// A binding is a string like "#", "w", "W" (Shift+W), "Alt+w", "Ctrl+Enter".
// Without Ctrl/Alt/Meta the key is the character typed (so "#" works on any
// layout and "w"/"W" differ by Shift). With a modifier, the key comes from the
// physical key (event.code), so Alt+W works even where Alt changes the character.

(() => {
  const ACTIONS = [
    // group: 'triage' fires when not typing and no Karbon dialog is open.
    //        'dialog' fires inside the Add to Timeline dialog, even while typing.
    // hint:  whether the action has an on-screen chip.
    // fixed: Karbon's own key; can't be rebound or turned off, only its chip.
    { id: 'clear', short: 'Clear', group: 'triage', label: 'Clear (archive) the open email', binding: '#', enabled: true, hint: true },
    { id: 'addToWeek', short: 'My Week', group: 'triage', label: 'Add the open email to My Week', note: 'Uses the "My Week target" setting.', binding: 'w', enabled: true, hint: true },
    { id: 'addToNextWeek', short: 'My Week: next', group: 'triage', label: 'Add the open email to My Week: next week', binding: 'W', enabled: false, hint: true },
    { id: 'addToTimeline', short: 'Add to Timeline', group: 'triage', label: 'Add the open email to a timeline (briefcase)', binding: 't', enabled: true, hint: true },
    { id: 'viewNew', short: 'View new items', group: 'triage', label: 'View new triage items', binding: 'n', enabled: true, hint: true },
    { id: 'nextEmail', short: 'Next email', group: 'triage', label: 'Open the next email', binding: 'j', enabled: false, hint: false },
    { id: 'prevEmail', short: 'Previous email', group: 'triage', label: 'Open the previous email', binding: 'k', enabled: false, hint: false },
    { id: 'comment', short: 'Comment', group: 'triage', label: 'Add a comment', binding: 'c', enabled: true, hint: true },
    { id: 'saveToLater', short: 'Later', group: 'triage', label: 'Save to Later', binding: 'l', enabled: false, hint: true },
    { id: 'reminder', short: 'Reminder', group: 'triage', label: 'Add Reminder', binding: 'b', enabled: false, hint: true },
    { id: 'assign', short: 'Assign', group: 'triage', label: 'Assign to Colleague', binding: 'a', enabled: false, hint: true },
    { id: 'reply', short: 'Reply', group: 'triage', label: 'Reply', binding: 'R', enabled: false, hint: true },
    { id: 'replyAll', short: 'Reply All', group: 'triage', label: 'Reply to All', binding: 'r', enabled: false, hint: true },
    { id: 'forward', short: 'Forward', group: 'triage', label: 'Forward', binding: 'f', enabled: false, hint: true },
    { id: 'toggleHelp', short: 'This list', group: 'triage', label: 'Show the shortcut list', binding: '?', enabled: true, hint: false },
    { id: 'workTab', short: 'Work tab', group: 'dialog', label: 'Switch to the Work tab', binding: 'Alt+Shift+w', enabled: true, hint: true },
    { id: 'contactTab', short: 'Contact tab', group: 'dialog', label: 'Switch to the Contact tab', binding: 'Alt+Shift+c', enabled: true, hint: true },
    { id: 'dialogAdd', short: 'Add', group: 'dialog', label: 'Add', binding: 'Ctrl+Enter', enabled: true, hint: true },
    { id: 'dialogCancel', short: 'Cancel', group: 'dialog', label: 'Cancel', binding: 'Escape', enabled: true, hint: true, fixed: true },
  ];

  const GROUPS = {
    triage: 'Triage',
    dialog: 'Add to Timeline dialog',
  };

  // Karbon's own global shortcuts (from its Help modal and search box).
  const KARBON_SHORTCUTS = [
    ['Ctrl+k', 'Search'],
    ['Alt+s', 'Search'],
    ['Alt+e', 'New email'],
    ['Alt+n', 'New note'],
    ['Alt+w', 'New work'],
    ['Alt+c', 'New contact'],
    ['Alt+t', 'Timer'],
    ['Ctrl+Alt+t', 'New time entry'],
  ];

  const DEFAULTS = {
    version: 2,
    shortcuts: Object.fromEntries(
      ACTIONS.map((a) => [a.id, { enabled: a.enabled, binding: a.binding, hint: a.hint }])
    ),
    hintsEnabled: true,
    helpLinkEnabled: true,
    toastsEnabled: true,
    hintStyle: 'karbon', // 'karbon' | 'contrast'
    myWeekTarget: 'this', // 'this' | 'next'
  };

  const STORAGE_KEY = 'settings';
  const MODIFIERS = ['Ctrl', 'Alt', 'Meta', 'Shift'];

  function codeToKey(event) {
    const { code, key } = event;
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (code === 'Space') return 'Space';
    return key.length === 1 ? key.toLowerCase() : key;
  }

  // Returns the binding string for a keydown, or null for a bare modifier.
  function eventToBinding(event) {
    if (['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock'].includes(event.key)) return null;
    const mods = [];
    if (event.ctrlKey) mods.push('Ctrl');
    if (event.altKey) mods.push('Alt');
    if (event.metaKey) mods.push('Meta');
    let key;
    if (mods.length) {
      key = codeToKey(event);
      if (event.shiftKey) mods.push('Shift');
    } else {
      key = event.key === ' ' ? 'Space' : event.key;
      // Letters follow Shift, not Caps Lock or how the key event was produced.
      if (/^[a-z]$/i.test(key)) key = event.shiftKey ? key.toUpperCase() : key.toLowerCase();
      // Shift is already part of a typed character ("#", "W"); only record it
      // for named keys like Enter or ArrowDown.
      if (key.length > 1 && event.shiftKey) mods.push('Shift');
    }
    return [...mods, key].join('+');
  }

  const KEY_NAMES = {
    Escape: 'Esc',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Meta: navigator.platform.startsWith('Mac') ? '⌘' : 'Meta',
  };

  // "Alt+w" -> "Alt + W", "W" -> "Shift + W", "#" -> "#".
  function formatBinding(binding) {
    if (!binding) return '';
    // Split on "+" but keep a literal "+" key ("Ctrl++" -> ["Ctrl", "+"]).
    const parts = binding.endsWith('++')
      ? [...binding.slice(0, -2).split('+'), '+']
      : binding.split('+');
    const key = parts.pop();
    const mods = parts.map((m) => KEY_NAMES[m] ?? m);
    let shown = KEY_NAMES[key] ?? key;
    if (key.length === 1 && /[a-z]/i.test(key)) {
      if (!mods.length && key === key.toUpperCase()) mods.push('Shift');
      shown = key.toUpperCase();
    }
    return [...mods, shown].join(' + ');
  }

  function isModified(binding) {
    return MODIFIERS.slice(0, 3).some((m) => binding.startsWith(`${m}+`));
  }

  // Defaults that changed: a saved binding still equal to the old default
  // moves to the new one (so people who never changed it get the fix).
  const SETTINGS_VERSION = 2;
  const MIGRATIONS = {
    2: { reply: ['r', 'R'], replyAll: ['R', 'r'], workTab: ['Alt+w', 'Alt+Shift+w'], contactTab: ['Alt+c', 'Alt+Shift+c'] },
  };

  function migrate(stored) {
    const s = structuredClone(stored);
    for (let v = (s.version ?? 1) + 1; v <= SETTINGS_VERSION; v++) {
      for (const [id, [from, to]] of Object.entries(MIGRATIONS[v] ?? {})) {
        if (s.shortcuts?.[id]?.binding === from) s.shortcuts[id].binding = to;
      }
    }
    s.version = SETTINGS_VERSION;
    return s;
  }

  function mergeSettings(stored) {
    const s = stored ? migrate(stored) : { version: SETTINGS_VERSION };
    const shortcuts = {};
    for (const action of ACTIONS) {
      const saved = s.shortcuts?.[action.id] ?? {};
      shortcuts[action.id] = {
        ...DEFAULTS.shortcuts[action.id],
        ...saved,
        // Karbon's own keys can't be rebound or turned off.
        ...(action.fixed ? { binding: action.binding, enabled: true } : {}),
      };
    }
    return { ...DEFAULTS, ...s, shortcuts };
  }

  async function loadSettings() {
    try {
      const { [STORAGE_KEY]: stored } = await chrome.storage.sync.get(STORAGE_KEY);
      return mergeSettings(stored);
    } catch (err) {
      console.error('[Karbon Triage Keys] Could not load settings', err);
      return mergeSettings(null);
    }
  }

  async function saveSettings(settings) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
  }

  function onSettingsChanged(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes[STORAGE_KEY]) callback(mergeSettings(changes[STORAGE_KEY].newValue));
    });
  }

  // Problems with the current bindings, keyed by action id:
  // { level: 'error' | 'warning' | 'info', message }
  function findConflicts(settings) {
    const issues = {};
    const add = (id, level, message) => (issues[id] ??= []).push({ level, message });
    const enabled = ACTIONS.filter((a) => settings.shortcuts[a.id].enabled && settings.shortcuts[a.id].binding);

    for (const a of enabled) {
      const binding = settings.shortcuts[a.id].binding;
      for (const b of enabled) {
        if (a === b || a.group !== b.group || settings.shortcuts[b.id].binding !== binding) continue;
        add(a.id, 'error', `Same key as “${b.label}”. Only one of them will work.`);
      }
      const karbon = KARBON_SHORTCUTS.find(([k]) => k === binding);
      if (karbon) {
        add(
          a.id,
          a.group === 'dialog' ? 'info' : 'warning',
          a.group === 'dialog'
            ? `Takes over Karbon’s ${formatBinding(binding)} (${karbon[1]}) while the dialog is open.`
            : `Takes over Karbon’s ${formatBinding(binding)} (${karbon[1]}).`
        );
      }
      if (a.group === 'triage' && ['Enter', 'Space', 'Tab', 'Escape'].includes(binding)) {
        add(a.id, 'warning', `${formatBinding(binding)} is used for normal navigation; this will take it over in the list.`);
      }
    }
    return issues;
  }

  globalThis.KTK = {
    ACTIONS,
    GROUPS,
    KARBON_SHORTCUTS,
    DEFAULTS,
    eventToBinding,
    formatBinding,
    isModified,
    mergeSettings,
    loadSettings,
    saveSettings,
    onSettingsChanged,
    findConflicts,
  };
})();
