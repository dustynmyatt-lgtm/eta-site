# East Texas Adrenaline website
Static site (HTML/CSS/JS). Content lives in `data/*.json` and is edited with Pages CMS (`.pages.yml`). Uploaded images go to `img/uploads/`.

## Offline / file:// and hosted
`data/bundle.js` embeds every `data/*.json` as `window.ETA_DATA` so the site works when opened via `file://` (double-click `index.html`). After editing any JSON, regenerate the bundle:

```bash
python3 build-bundle.py
```

The hosted version still uses `fetch('data/*.json')` when `window.ETA_DATA` is missing; with the bundle present, both file:// and http:// use the inlined data.

## Local server
Run locally: `python3 -m http.server 8080` then open http://localhost:8080.

See ADMIN-GUIDE.md and GO-LIVE.md.
