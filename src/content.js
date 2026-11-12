// Karbon Triage Keys — content script on app2.karbonhq.com.
//
// Shortcuts (ignored while typing in an input, textarea or editor):
//   #        archive the email in focus
//   (TBD)    add the email in focus to My Week
//
// The archive and add-to-week calls are stubs until we capture Karbon's
// real network requests for those two actions (see README "Next steps").

const SHORTCUTS = {
  '#': 'archive',
  // 'w': 'addToWeek', // key to be confirmed
};

function isTyping(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
  );
}

function toast(text) {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    background: '#1f2937', color: '#fff', padding: '8px 14px', borderRadius: '6px',
    font: '13px system-ui, sans-serif', zIndex: 2147483647, pointerEvents: 'none',
  });
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
}

const actions = {
  async archive() {
    toast('Archive: not wired up yet');
  },
  async addToWeek() {
    toast('Add to My Week: not wired up yet');
  },
};

document.addEventListener('keydown', async (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (isTyping(event.target)) return;
  const name = SHORTCUTS[event.key];
  if (!name) return;
  event.preventDefault();
  event.stopPropagation();
  try {
    await actions[name]();
  } catch (err) {
    console.error('[Karbon Triage Keys]', err);
    toast(`Failed: ${err.message}`);
  }
}, true);
