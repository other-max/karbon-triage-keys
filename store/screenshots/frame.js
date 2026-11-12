// Builds each shot's browser window and Triage scene from data attributes, so the shot pages
// hold only their copy. Key chips, the shortcut list, and the dialog chips use the extension's
// own styles (read from content.js) and keys (from shared.js), so they stay in step with the code.
const { ACTIONS, GROUPS, KARBON_SHORTCUTS, DEFAULTS, formatBinding } = globalThis.KTK;
const ICON = '../icons/icon32.png';
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const I = {
  assign: 'M15 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 8v6M16 11h6',
  reminder: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0',
  later: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  work: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  clear: 'M20 6L9 17l-5-5',
  reply: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 6 6v4',
  replyAll: 'M12 14L7 9l5-5M7 9h7a6 6 0 0 1 6 6v4M7 14L2 9l5-5',
  forward: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0-6 6v4',
  comment: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
};

// Settings for a shot: the defaults, with extra shortcuts turned on (data-on) or hints hidden (data-off) by id.
function shotSettings(on = [], off = []) {
  const s = structuredClone(DEFAULTS);
  for (const id of on) s.shortcuts[id].enabled = true;
  for (const id of off) s.shortcuts[id].hint = false;
  return s;
}
const chipText = (s, id) => formatBinding(s.shortcuts[id].binding);
const shows = (s, id) => s.hintsEnabled && s.shortcuts[id].enabled && s.shortcuts[id].hint && s.shortcuts[id].binding;
const chip = (text, variant) => `<span class="ktk-key${variant ? ` ktk-key--${variant}` : ''}">${text}</span>`;

const EMAILS = [
  ['Dana Whitfield', '9:41 AM', 'Q3 payroll documents for review', 'Hi team, attached are the payroll registers and…'],
  ['Harbor & Pine Dental', '9:12 AM', 'Re: Bank statement for September', 'Thanks! Here is the missing statement for the…'],
  ['Marcus Lee', '8:55 AM', 'Sales tax notice from the state', 'We got this letter yesterday. Do we need to…'],
  ['Northwind Bakery', '8:30 AM', 'New hire paperwork', 'Our new baker starts Monday. What do you need…'],
  ['Priya Raman', 'Yesterday', 'Receipts for October', 'Uploading the October receipts now. Let me…'],
  ['Cedar Street Vet', 'Yesterday', '1099s for contractors', 'Can you confirm which contractors need a…'],
  ['Alvarez Landscaping', 'Mon', 'Loan application financials', 'The bank asked for a profit and loss and…'],
  ['Tom Becker', 'Mon', 'Quick question on mileage', 'Is the standard mileage rate changing for…'],
];

function triage(s) {
  const btn = (id, icon) => `<span class="btn">${svg(I[icon])}${id && shows(s, id) ? chip(chipText(s, id), 'under') : ''}</span>`;
  const rows = EMAILS.map(([who, when, sub, snip], i) =>
    `<div class="row${i === 0 ? ' on' : ''}"><div class="who"><b>${who}</b><span>${when}</span></div><div class="sub">${sub}</div><div class="snip">${snip}</div></div>`).join('');
  const week = shows(s, 'addToWeek') ? chip(chipText(s, 'addToWeek'), 'inline') : '';
  const help = s.shortcuts.toggleHelp;
  return `<div class="app">
    <div class="rail"><b></b><b class="on"></b><b></b><b></b><b></b><b></b></div>
    <div class="list"><div class="list-head"><h2>Triage</h2><span>24</span></div>
      <div class="new">View 3 new items${shows(s, 'viewNew') ? chip(chipText(s, 'viewNew'), 'inline') : ''}</div>${rows}</div>
    <div class="read">
      <div class="etools">${btn('assign', 'assign')}${btn('reminder', 'reminder')}${btn('saveToLater', 'later')}${btn('addToTimeline', 'work')}${btn('clear', 'clear')}
        <span class="gap"></span>${btn('reply', 'reply')}${btn('replyAll', 'replyAll')}${btn('forward', 'forward')}${btn('comment', 'comment')}</div>
      <div class="mail"><h1>Q3 payroll documents for review</h1>
        <div class="from"><span class="av">DW</span><div><b>Dana Whitfield</b><small>to Bookkeeping · 9:41 AM</small></div></div>
        <div class="tray"><span>Northwind Bakery</span><span>·</span><a>Add to My Week${week}</a></div>
        <p>Hi team,</p>
        <p>Attached are the payroll registers and the tax deposit confirmations for July through September. Two employees changed their withholding in August, so those forms are in there too.</p>
        <p>Could you look these over before the quarterly filing? Happy to jump on a call if anything looks off.</p>
        <p>Thanks,<br>Dana</p></div>
      ${s.helpLinkEnabled ? `<div class="launch-host"><button type="button" class="ktk-help-launch">${help.enabled ? chip(formatBinding(help.binding)) : ''}Shortcuts</button></div>` : ''}
    </div></div>`;
}

// The ? list, built the way content.js's showHelp() builds it.
function helpOverlay(s) {
  const sections = Object.entries(GROUPS).map(([group, title]) => ({
    title, items: ACTIONS.filter((a) => a.group === group && s.shortcuts[a.id].enabled && s.shortcuts[a.id].binding)
      .map((a) => [s.shortcuts[a.id].binding, a.short ?? a.label]) }));
  sections.push({ title: 'Karbon (built in)', items: KARBON_SHORTCUTS });
  const body = sections.filter((x) => x.items.length).map((x) => `<div class="ktk-help-section"><h3>${x.title}:</h3><div class="ktk-help-items">${
    x.items.map(([b, label]) => `<div class="ktk-help-item">${chip(formatBinding(b))}${label}</div>`).join('')}</div></div>`).join('');
  return `<div class="ktk-help"><div class="ktk-help-card">${body}<div class="ktk-help-foot"><a>Change shortcuts</a> · <a>Hide key hints</a> · Esc to close</div></div></div>`;
}

function timelineDialog(s) {
  const c = (id) => (shows(s, id) ? chip(chipText(s, id), 'inline') : '');
  return `<div class="scrim"><div class="dialog" role="dialog"><h3>Add to Timeline</h3>
    <div class="dtabs"><span class="on">Work${c('workTab')}</span><span>Contact${c('contactTab')}</span></div>
    <div class="dbody"><div class="search">Northwind</div>
      <div class="opt on"><b>Q3 2026 payroll</b><small>Northwind Bakery · Due Oct 31</small></div>
      <div class="opt"><b>Monthly bookkeeping: September</b><small>Northwind Bakery · Due Oct 15</small></div>
      <div class="opt"><b>2026 tax planning</b><small>Northwind Bakery · Due Dec 1</small></div></div>
    <div class="dfoot"><button type="button">Cancel${c('dialogCancel')}</button><button type="button" class="primary" data-e2e="button__splitButtonMainAction">Add${c('dialogAdd')}</button></div>
  </div></div>`;
}

async function build() {
  const src = await (await fetch('../src/content.js')).text();
  const style = document.createElement('style');
  style.textContent = src.match(/const STYLE = `([\s\S]*?)`;/)[1];
  document.head.prepend(style);
  for (const b of document.querySelectorAll('.browser')) {
    const d = b.dataset;
    const ids = (v) => (v || '').split(' ').filter(Boolean);
    const s = shotSettings(ids(d.on), ids(d.off));
    // Keys shown for a shot only: data-keys="workTab:w contactTab:c".
    for (const [id, key] of ids(d.keys).map((x) => x.split(':'))) s.shortcuts[id].binding = key;
    const scene = d.scene === 'triage' ? triage(s) + (d.overlay === 'help' ? helpOverlay(s) : d.overlay === 'dialog' ? timelineDialog(s) : '') : '';
    const extra = b.innerHTML;
    b.innerHTML = `
      <div class="tabs"><div class="dots"><i></i><i></i><i></i></div><div class="tab">${d.tab || ''}</div></div>
      <div class="toolbar">${svg('M15 6l-6 6 6 6')}${svg('M9 6l6 6-6 6')}${svg('M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4')}
        <div class="addr">${svg('M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z')}${d.url || ''}</div>
        ${svg('M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.4 9.3l6-.7z')}
        <div class="ext"><img src="${ICON}" alt=""></div>${svg('M12 5h.01M12 12h.01M12 19h.01')}</div>
      <div class="viewport">${scene}${extra}</div>`;
  }
  // The settings shot can start at a section: <iframe data-scroll-to="#groups">. It shifts the page
  // up rather than scrolling, since headless Chrome leaves part of a scrolled iframe unpainted.
  for (const f of document.querySelectorAll('iframe[data-scroll-to]')) {
    f.addEventListener('load', () => setTimeout(() => {
      const el = f.contentDocument.querySelector(f.dataset.scrollTo);
      if (el) f.contentDocument.body.style.marginTop = `${-(el.getBoundingClientRect().top - 24)}px`;
    }, 400));
  }
}
build();

