# Website analytics (East Texas Adrenaline)

Two free Cloudflare features, both cookie-free. No ad trackers and nothing outside Cloudflare.

| What | Tool | Where it lives |
| --- | --- | --- |
| Page views, visits, top pages, referrers, countries, devices | **Cloudflare Web Analytics** (automatic setup) | Cloudflare dashboard only. No code in this repo. |
| Outbound link clicks (Spotify, Apple Music, YouTube, Bandcamp, TikTok, Facebook, Messenger, email, merch store, ...) and press campaign arrivals | **`track.js` + Worker `/api/click` + Workers Analytics Engine** | `track.js`, `worker/`, `wrangler.jsonc` |
| Short campaign links for press: `easttexasadrenaline.com/go/<code>` | Worker `/go/*` (302 redirect + one count) | `worker/campaigns.js` |

Privacy rules (binding, set by the owner): aggregate counts only. We never store an IP address, user agent, screen size, cookie, user/session ID or anything typed into a form, and nothing is kept in cookies or localStorage. Full details are in `analytics_privacy.md`, which is kept outside the repo in the press folder.

## How it works

* `track.js` is loaded with `defer` on `index.html` and `merch.html`. It adds no visible content. It listens for clicks and middle-clicks on links. When a link goes off-site, or is a `mailto:` link, it calls `navigator.sendBeacon('/api/click', ...)` with this body:
  `{c: category, d: "host/path" (query string removed; a YouTube video id is kept as /watch/<id>), p: page path, us: utm_source, uc: utm_campaign, r: referrer host}`.
  If the page URL has `utm_source` or `utm_campaign`, it also sends one `land` event. Clicks on internal links send nothing. When the page is opened from `file://` the script does nothing.
* Link categories: `spotify`, `apple_music`, `youtube`, `bandcamp`, `tiktok`, `music_other` (Deezer, Tidal, SoundCloud, Amazon, etc.), `facebook`, `label` (Wrong Track Records), `messenger` (m.me), `email`, `merch` (etamerch.printful.me and its product pages), `venue` (For the Record), `press` (links in the Press section), `other`.
* The Worker (`worker/index.js`) runs **only** for `/api/*` and `/go/*` (`run_worker_first`). It also runs for URLs that match no file, and for those it hands the request straight back to the asset server, so the 404 is unchanged. Every other URL is served by the static asset server exactly as before. This was tested: same status, headers and body for every page and file, and `/merch.html` still redirects with a 307 to `/merch`.
* `/api/click` takes `POST` only, which means `GET`, `HEAD` and `PUT` get a 405. It refuses a cross-site `Origin` with a 403 and a body over 1 KB with a 413. It rejects non-JSON bodies, unknown categories, malformed destinations, paths, UTM values and referrer hosts with a 400 and writes nothing. If a `mailto:` link points anywhere other than the band's own address, it is stored only as `mailto:other`.
* Each accepted event is one Analytics Engine data point in dataset `eta_clicks`:
  `blob1` = type (`click` / `land` / `go`), `blob2` = category, `blob3` = destination, `blob4` = page path, `blob5` = utm_source, `blob6` = utm_campaign, `blob7` = referrer host, `double1` = 1, `index1` = category.
* `observability` (Workers Logs) is set to **off** in `wrangler.jsonc` so request metadata is not logged.

## Owner steps in the Cloudflare dashboard (Dustyn; nobody else can do these)

Do these after this branch is approved and merged. Steps 1 and 2 can also be done before that.

1. **Turn on Web Analytics (page views, visitors).** Log in at dash.cloudflare.com. Go to **Analytics & Logs → Web Analytics** (in the account menu; search "Web Analytics" if you don't see it) and choose **Add a site**. Pick **easttexasadrenaline.com** from the hostname drop-down and press **Done**. The domain is proxied by Cloudflare (nameservers burt/carol.ns.cloudflare.com), so this is the **automatic setup**: Cloudflare injects the beacon itself and no code change is needed. Leave it on "Enable". Optional: "Enable, excluding visitor data in the EU".
   * Check it a few minutes after visiting the site. View the page source, or run `curl -s https://easttexasadrenaline.com/ | grep cloudflareinsights`. You should see `static.cloudflareinsights.com/beacon.min.js`. If nothing is injected, use step 1b.
   * **1b (only if auto-injection doesn't appear):** under Web Analytics → **Manage site**, change the setup to "Enable with JS Snippet installation", copy the token, and add this line just before `</body>` in `index.html` and `merch.html`. That is a small extra commit:
     `<script defer type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "REPLACE_WITH_SITE_TOKEN"}'></script>`
2. **Create a read-only API token for the weekly click report.** Go to **My Profile → API Tokens → Create Token → Create Custom Token**. Name it `eta-analytics-read`. Under Permissions choose **Account → Account Analytics → Read** and nothing else. Optionally set a TTL. Create it, copy the token once, and keep it in a password manager. You also need the **Account ID**: Workers & Pages → right sidebar, or Account Home → ⋯ → Copy account ID. It appears to be `21d00f8a43c6ce260e4ff5b0ab67fdd6`, taken from the Workers Builds link on GitHub; confirm it in the dashboard.
3. **Merge and deploy** (after approval): merge `analytics` into `main`. Workers Builds deploys automatically. There is no Analytics Engine step, because the `eta_clicks` dataset is created on the first write.
4. **Smoke test after deploy:** open `https://easttexasadrenaline.com/go/test` once. It should land on `/?utm_source=test&...`. Then click the Spotify button. A few minutes later, `tools/clicks-report.sh 1` should show `campaign test` and `spotify`.
5. **Check after deploy (dashboard):** Workers & Pages → eta-site → Settings → Observability shows Logs **off**. If it was on before, this branch turns it off on purpose.

## Reading the numbers every week

* **Visits and page views:** dash.cloudflare.com → **Analytics & Logs → Web Analytics** → easttexasadrenaline.com → set the range to **Last 7 days**. Visits, page views, top **Paths**, **Referer** hosts, countries and devices are all there. Web Analytics does **not** record query strings, so UTM tags are not shown there (Cloudflare FAQ). Campaigns are read from the click report below.
* **Clicks and campaigns:**
  ```bash
  export CLOUDFLARE_ACCOUNT_ID=<account id>
  export CF_ANALYTICS_TOKEN=<the Account Analytics Read token>
  tools/clicks-report.sh        # last 7 days; tools/clicks-report.sh 30 for 30 days
  ```
  It prints clicks by category, by category + destination, by page, campaign arrivals (`/go/` + UTM landings), clicks from campaign visitors, and clicks by referring site.
* Single query by hand (clicks by category and destination, last 7 days):
  ```bash
  curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
    -H "Authorization: Bearer $CF_ANALYTICS_TOKEN" \
    --data "SELECT blob2 AS category, blob3 AS destination, SUM(_sample_interval) AS clicks FROM eta_clicks WHERE blob1 = 'click' AND timestamp > NOW() - INTERVAL '7' DAY GROUP BY category, destination ORDER BY clicks DESC FORMAT TabSeparatedWithNames"
  ```
  (Use `SUM(_sample_interval)`, not `COUNT()`. Analytics Engine may sample at high volume.)

## Press campaigns

Recommended: give every outlet its own **short link**, `easttexasadrenaline.com/go/<code>`. This counts arrivals on the server, so it works even when ad-blockers stop scripts. It also keeps press links short and clean, and it records the outlet's site (referrer host) when the browser sends one. Add a line to `worker/campaigns.js` for each outlet and batch before sending the press release:
```js
"b1-outletx": { to: "/", source: "outletx", campaign: "pr-batch1-2026-10" },
```
The link redirects (302) to `/?utm_source=outletx&utm_medium=press&utm_campaign=pr-batch1-2026-10`, so clicks made on that landing page are tagged with the campaign. Unknown codes go to `/` and are not counted.
If an outlet prefers a full URL, a plain UTM link also works: `https://easttexasadrenaline.com/?utm_source=<outlet>&utm_medium=press&utm_campaign=pr-batch1-2026-10`. It is counted as a `land` event, but only when JavaScript runs.
In **Web Analytics** a campaign visit shows as a visit to `/` (or `/merch`), with the outlet's site under **Referer** when the browser sends it. The UTM tags themselves are not visible there.

## Local testing (no Cloudflare login)

```bash
npx wrangler dev --local          # serves the site + Worker at http://localhost:8787 (Node 22+)
node tools/test-worker.mjs        # unit tests incl. "stored data point contains no IP / UA / cookie / IDs"
```
