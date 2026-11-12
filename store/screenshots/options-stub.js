// Stands in for chrome.storage on the settings page, so it renders with the defaults.
(() => {
  const data = {};
  globalThis.chrome = {
    storage: {
      sync: { async get(k) { return { [k]: data[k] }; }, async set(o) { Object.assign(data, o); } },
      onChanged: { addListener() {} },
    },
    runtime: { sendMessage: async () => {} },
  };
})();
