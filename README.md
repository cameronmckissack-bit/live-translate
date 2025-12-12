# LiveTranslate

Chrome extension + Vercel backend that translates on-screen captions (YouTube, Vimeo, etc.) in real time.

## Quick start
1. Deploy the `api/translate.js` serverless function on Vercel.
2. Update the extension popup's Backend URL to the deployed `https://<app>.vercel.app/api/translate`.
3. Load the extension in Chrome (unpacked) for testing.

## Files
- /extension : Chrome extension source
- /api : Vercel serverless functions
