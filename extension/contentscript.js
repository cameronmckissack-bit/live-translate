/* contentScript.js
   - Detects caption nodes (YouTube '.ytp-caption-segment' etc)
   - Sends their text to backend to translate and replaces the text
*/

(async () => {
  // Default backend URL placeholder (will be updated after you deploy to Vercel)
  let BACKEND_URL = "https://YOUR_VERCEL_APP.vercel.app/api/translate";

  // Load user preferences from chrome.storage (from popup)
  function loadSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get({ fromLang: "en", toLang: "es", backendUrl: BACKEND_URL }, (items) => {
        BACKEND_URL = items.backendUrl || BACKEND_URL;
        resolve({ from: items.fromLang || "en", to: items.toLang || "es", backendUrl: BACKEND_URL });
      });
    });
  }

  // Simple debounce
  function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  async function translateText(text, from, to, backendUrl) {
    try {
      const resp = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from, to })
      });
      if (!resp.ok) return text;
      const data = await resp.json();
      return data.translated || text;
    } catch (e) {
      console.warn("Translate error", e);
      return text;
    }
  }

  function findCaptionContainers() {
    // selectors for common caption containers on video sites. We will watch the whole page as well.
    return [
      '.ytp-caption-segment',        // YouTube caption segments
      '.vjs-text-track-display',     // Video.js players
      '.captions-text',              // fallback
      '[role="presentation"] .caption' // generic
    ];
  }

  async function processNode(node, settings) {
    if (!node || !node.innerText) return;
    const raw = node.innerText.trim();
    if (!raw) return;

    // Avoid reprocessing same text
    if (node.dataset.ltOrig === raw && node.dataset.ltTrans) {
      node.innerText = node.dataset.ltTrans;
      return;
    }
    node.dataset.ltOrig = raw;
    // send to backend
    const translated = await translateText(raw, settings.from, settings.to, settings.backendUrl);
    node.dataset.ltTrans = translated;
    node.innerText = translated;
  }

  function observeCaptions(settings) {
    // Observe entire document for caption nodes (safe approach)
    const observer = new MutationObserver(debounce(async (mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            // If node itself has text
            if (n.innerText && n.innerText.trim().length > 0) processNode(n, settings);
            // Or search its subtree for likely caption segments
            const selectors = findCaptionContainers();
            selectors.forEach(sel => {
              n.querySelectorAll && n.querySelectorAll(sel).forEach(el => processNode(el, settings));
            });
          });
        } else if (m.type === "characterData") {
          const parent = m.target.parentElement;
          if (parent) processNode(parent, settings);
        }
      }
    }, 120), { childList: true, subtree: true, characterData: true });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    // Initial pass: find existing caption nodes
    const selectors = findCaptionContainers();
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(node => processNode(node, settings));
    });
  }

  // run
  const settings = await loadSettings();
  observeCaptions(settings);

  // If user updates settings via popup, listen and reload settings
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === "sync" && (changes.fromLang || changes.toLang || changes.backendUrl)) {
      const newSettings = await loadSettings();
      // best effort: re-translate visible caption nodes immediately
      document.querySelectorAll('[data-lt-orig]').forEach(n => {
        processNode(n, newSettings);
      });
    }
  });
})();
