// Opens the settings page from the toolbar icon or from the in-page
// shortcut list (content scripts can't open it themselves).

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'openOptions') chrome.runtime.openOptionsPage();
});
