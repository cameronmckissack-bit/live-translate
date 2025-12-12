document.addEventListener('DOMContentLoaded', () => {
  const fromEl = document.getElementById('from');
  const toEl = document.getElementById('to');
  const backendEl = document.getElementById('backend');
  const saveBtn = document.getElementById('save');

  // load saved settings
  chrome.storage.sync.get({ fromLang: 'en', toLang: 'es', backendUrl: '' }, (items) => {
    fromEl.value = items.fromLang || 'en';
    toEl.value = items.toLang || 'es';
    backendEl.value = items.backendUrl || '';
  });

  saveBtn.addEventListener('click', () => {
    const from = fromEl.value.trim() || 'en';
    const to = toEl.value.trim() || 'es';
    const backend = backendEl.value.trim();
    chrome.storage.sync.set({ fromLang: from, toLang: to, backendUrl: backend }, () => {
      saveBtn.innerText = 'Saved ✔';
      setTimeout(() => saveBtn.innerText = 'Save', 900);
    });
  });
});
