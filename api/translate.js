// api/translate.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { text, from = "en", to = "es" } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    // Use MyMemory free translation as starter
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

    const r = await fetch(url);
    const data = await r.json();

    const translated = data?.responseData?.translatedText || text;
    res.status(200).json({ translated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
