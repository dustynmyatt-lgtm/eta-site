// Unit tests for worker/index.js with a fake Analytics Engine binding that records every data point.
// Run: node tools/test-worker.mjs   (Node 18+; no network, no Cloudflare login)
import worker, { FIELDS } from "../worker/index.js";

let points = [], assetCalls = 0, failed = 0;
const env = {
  CLICKS: { writeDataPoint: (p) => points.push(JSON.parse(JSON.stringify(p))) },
  ASSETS: { fetch: async (req) => { assetCalls++; return new Response("asset:" + new URL(req.url).pathname); } },
};
const ORIGIN = "https://easttexasadrenaline.com";
// Values that must NEVER appear in a stored data point.
const SECRET_IP = "203.0.113.77", SECRET_UA = "Mozilla/5.0 (SecretUA-ZZ9)", SECRET_COOKIE = "sid=COOKIE-ZZ9";
const FORBIDDEN = [SECRET_IP, "198.51.100.9", SECRET_UA, "SecretUA", SECRET_COOKIE, "COOKIE-ZZ9", "USERID-ZZ9", "1920x1080", "fan@example.com", "secret-q", "TX", "Beaumont"];
const hdrs = (extra = {}) => ({
  "content-type": "text/plain;charset=UTF-8", origin: ORIGIN,
  "cf-connecting-ip": SECRET_IP, "x-forwarded-for": "198.51.100.9", "x-real-ip": SECRET_IP,
  "user-agent": SECRET_UA, cookie: SECRET_COOKIE, ...extra,
});
const post = (body, extra) => worker.fetch(new Request(ORIGIN + "/api/click", { method: "POST", headers: hdrs(extra), body }), env);
const check = (name, ok, info = "") => { console.log((ok ? "PASS " : "FAIL ") + name + (info ? "  " + info : "")); if (!ok) failed++; };

function assertClean(p, label) {
  const s = JSON.stringify(p);
  const hit = FORBIDDEN.filter((f) => s.includes(f));
  check(label + ": no forbidden values (IP/UA/cookie/IDs/screen/email typed/geo)", hit.length === 0, hit.join(","));
  check(label + ": exactly " + FIELDS.length + " blobs, 1 double, 1 index; no extra keys",
    p.blobs.length === FIELDS.length && p.doubles.length === 1 && p.doubles[0] === 1 && p.indexes.length === 1 &&
    Object.keys(p).sort().join() === "blobs,doubles,indexes");
}

// 1. valid click, with extra junk keys a hostile client might send
points = [];
let r = await post(JSON.stringify({ c: "spotify", d: "open.spotify.com/artist/6lh7sgML4LVndUgMk42t6P?si=secret-q", p: "/", us: "outletx", uc: "pr-batch1-2026-10", r: "www.google.com",
  ip: "198.51.100.9", ua: SECRET_UA, uid: "USERID-ZZ9", screen: "1920x1080", email: "fan@example.com", country: "TX", city: "Beaumont" }));
check("valid click -> 204", r.status === 204, String(r.status));
check("valid click -> 1 data point", points.length === 1);
console.log("   stored:", JSON.stringify(points[0]));
check("blobs = [type,category,dest,page,utm_source,utm_campaign,ref_host] with query stripped",
  JSON.stringify(points[0].blobs) === JSON.stringify(["click", "spotify", "open.spotify.com/artist/6lh7sgML4LVndUgMk42t6P", "/", "outletx", "pr-batch1-2026-10", "www.google.com"]));
assertClean(points[0], "valid click");

// 2. every category the page script can send
for (const [c, d] of [["apple_music","music.apple.com/us/artist/x"],["youtube","www.youtube.com/watch/z1zENUoYN9I"],["bandcamp","easttexasadrenaline.bandcamp.com/"],["tiktok","www.tiktok.com/@ohdeer49"],["facebook","www.facebook.com/Easttexasadrenaline"],["messenger","m.me/Easttexasadrenaline"],["email","mailto:easttexasadrenaline@yahoo.com"],["merch","etamerch.printful.me/product/5-button-set"],["label","www.facebook.com/wrongtrackrecords"],["venue","fortherecordtx.com/"],["press","ramzine.co.uk/reviews/x/"],["other","example.org/"],["music_other","soundcloud.com/x"]]) {
  points = []; r = await post(JSON.stringify({ c, d, p: "/merch" }));
  check("category " + c + " -> 204 + written", r.status === 204 && points.length === 1, String(r.status));
}
// email: subject stripped
points = []; await post(JSON.stringify({ c: "email", d: "mailto:EastTexasAdrenaline@yahoo.com?subject=Booking%20request", p: "/" }));
check("mailto stored without ?subject", points[0]?.blobs[2] === "mailto:easttexasadrenaline@yahoo.com", points[0]?.blobs[2]);
points = []; await post(JSON.stringify({ c: "email", d: "mailto:fan@example.com", p: "/" }));
check("mailto to a non-band address stored only as mailto:other", points[0]?.blobs[2] === "mailto:other", points[0]?.blobs[2]);
assertClean(points[0], "non-band mailto");
// landing event
points = []; r = await post(JSON.stringify({ t: "land", c: "campaign", d: "/", p: "/", us: "outletx", uc: "pr-batch1-2026-10", r: "outletx.com" }));
check("landing (UTM) event -> 204", r.status === 204 && points[0]?.blobs.join("|") === "land|campaign|/|/|outletx|pr-batch1-2026-10|outletx.com");
assertClean(points[0], "landing event");

// 3. rejections: nothing written
const bad = [
  ["GET", () => worker.fetch(new Request(ORIGIN + "/api/click"), env), 405],
  ["PUT", () => worker.fetch(new Request(ORIGIN + "/api/click", { method: "PUT", body: "{}" }), env), 405],
  ["cross-site Origin", () => post(JSON.stringify({ c: "spotify", d: "open.spotify.com/", p: "/" }), { origin: "https://evil.example" }), 403],
  ["empty body", () => post(""), 400],
  ["not JSON", () => post("c=spotify"), 400],
  ["JSON array", () => post("[1,2]"), 400],
  ["body > 1 KB", () => post(JSON.stringify({ c: "spotify", d: "open.spotify.com/" + "a".repeat(1100), p: "/" })), 413],
  ["unknown category", () => post(JSON.stringify({ c: "hacker", d: "open.spotify.com/", p: "/" })), 400],
  ["category not a string", () => post(JSON.stringify({ c: ["spotify"], d: "open.spotify.com/", p: "/" })), 400],
  ["bad destination", () => post(JSON.stringify({ c: "other", d: "javascript:alert(1)", p: "/" })), 400],
  ["destination with spaces/HTML", () => post(JSON.stringify({ c: "other", d: "a.com/<script> x", p: "/" })), 400],
  ["page not a path", () => post(JSON.stringify({ c: "spotify", d: "open.spotify.com/", p: "https://x.com/" })), 400],
  ["bad utm", () => post(JSON.stringify({ c: "spotify", d: "open.spotify.com/", p: "/", uc: "drop table;--" })), 400],
  ["referrer with path (host only allowed)", () => post(JSON.stringify({ c: "spotify", d: "open.spotify.com/", p: "/", r: "google.com/search?q=secret-q" })), 400],
  ["unknown event type", () => post(JSON.stringify({ t: "pageview", c: "spotify", d: "open.spotify.com/", p: "/" })), 400],
];
for (const [name, fn, want] of bad) { points = []; const res = await fn(); check("reject " + name + " -> " + want + ", nothing written", res.status === want && points.length === 0, String(res.status)); }

// 4. /go/ short links
points = [];
r = await worker.fetch(new Request(ORIGIN + "/go/test", { headers: { referer: "https://outletx.com/story/123?secret-q=1", "cf-connecting-ip": SECRET_IP, "user-agent": SECRET_UA, cookie: SECRET_COOKIE } }), env);
check("/go/test -> 302 with UTM tags", r.status === 302 && r.headers.get("location") === "/?utm_source=test&utm_medium=press&utm_campaign=test", r.headers.get("location"));
check("/go/test -> 1 point, referrer HOST only", points.length === 1 && points[0].blobs.join("|") === "go|campaign|go/test|/|test|test|outletx.com", JSON.stringify(points[0]?.blobs));
assertClean(points[0], "/go/ event");
check("/go/test sets no cookie", r.headers.get("set-cookie") === null);
points = []; r = await worker.fetch(new Request(ORIGIN + "/go/nope"), env);
check("/go/unknown -> 302 to / and nothing written", r.status === 302 && r.headers.get("location") === "/" && points.length === 0);
points = []; r = await worker.fetch(new Request(ORIGIN + "/go/__proto__"), env);
check("/go/__proto__ -> 302 to / and nothing written", r.status === 302 && r.headers.get("location") === "/" && points.length === 0);

// 5. everything else goes to the asset server untouched
assetCalls = 0; r = await worker.fetch(new Request(ORIGIN + "/merch"), env);
check("other paths -> ASSETS.fetch", assetCalls === 1 && (await r.text()) === "asset:/merch");
r = await worker.fetch(new Request(ORIGIN + "/api/other"), env);
check("/api/other -> 404", r.status === 404);
// 6. binding missing (e.g. misconfigured) must not break anything
r = await worker.fetch(new Request(ORIGIN + "/api/click", { method: "POST", headers: hdrs(), body: JSON.stringify({ c: "spotify", d: "open.spotify.com/", p: "/" }) }), { ASSETS: env.ASSETS });
check("missing CLICKS binding -> still 204, no crash", r.status === 204);

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
