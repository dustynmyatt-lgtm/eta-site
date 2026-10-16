// East Texas Adrenaline site Worker.
// Static files are still served by Cloudflare's asset server exactly as before.
// This script only runs for /api/* and /go/* (see run_worker_first in wrangler.jsonc)
// and for requests that match no file (it hands those straight back to the asset
// server, so 404s look the same as today).
//
// PRIVACY (owner rule, binding): we store aggregate counts only. Never write an IP,
// user agent, cookie, ID, screen size, or anything typed by a visitor. The only
// fields stored are listed in FIELDS below. See ANALYTICS.md.
import { CAMPAIGNS } from "./campaigns.js";

// Allowed link categories (anything else is rejected).
export const CATEGORIES = new Set([
  "spotify", "apple_music", "youtube", "bandcamp", "tiktok", "music_other",
  "facebook", "messenger", "email", "merch", "label", "venue", "press", "other", "campaign",
]);
// Event types written to Analytics Engine.
const TYPES = new Set(["click", "land"]);
// Exact order of blobs in every data point (documented in ANALYTICS.md):
export const FIELDS = ["type", "category", "dest", "page", "utm_source", "utm_campaign", "ref_host"];

const MAX_BODY = 1024; // bytes
const BAND_EMAILS = new Set(["easttexasadrenaline@yahoo.com"]);

const clean = {
  // host/path only, lowercase host, no query/hash, printable ASCII, capped.
  dest(v) {
    if (typeof v !== "string") return null;
    v = v.trim().split(/[?#]/)[0];
    if (v.startsWith("mailto:")) {
      const addr = v.slice(7).toLowerCase();
      if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,100}$/.test(addr)) return null;
      // Only the band's own published address is stored; anything else is just "mailto:other".
      return BAND_EMAILS.has(addr) ? "mailto:" + addr : "mailto:other";
    }
    v = v.replace(/^https?:\/\//i, "");
    const m = /^([a-z0-9.-]{1,100})(\/[\x21-\x7e]{0,200})?$/i.exec(v);
    if (!m || !m[1].includes(".")) return null;
    return m[1].toLowerCase() + (m[2] || "/");
  },
  page(v) {
    if (typeof v !== "string") return null;
    v = v.split(/[?#]/)[0];
    return /^\/[a-z0-9._\/-]{0,100}$/i.test(v) ? v : null;
  },
  // utm values: short slug only; empty when absent.
  utm(v) {
    if (v == null || v === "") return "";
    if (typeof v !== "string") return null;
    v = v.trim().toLowerCase();
    return /^[a-z0-9._-]{1,64}$/.test(v) ? v : null;
  },
  host(v) {
    if (v == null || v === "") return "";
    if (typeof v !== "string") return null;
    v = v.trim().toLowerCase();
    return /^[a-z0-9.-]{1,100}$/.test(v) && v.includes(".") ? v : null;
  },
};

// Validate a beacon body. Returns the blob array or null. Unknown keys are ignored.
export function parseEvent(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  const type = o.t === undefined ? "click" : o.t;
  if (!TYPES.has(type)) return null;
  if (!CATEGORIES.has(o.c)) return null;
  const dest = type === "land" ? clean.page(o.d) : clean.dest(o.d);
  const page = clean.page(o.p);
  const us = clean.utm(o.us), uc = clean.utm(o.uc), r = clean.host(o.r);
  if (dest == null || page == null || us == null || uc == null || r == null) return null;
  return [type, o.c, dest, page, us, uc, r];
}

function write(env, blobs) {
  // index = category, so sampling (if any) groups by category. doubles[0] = 1 (count).
  try { env.CLICKS?.writeDataPoint({ indexes: [blobs[1]], blobs, doubles: [1] }); } catch (e) {}
}

const noStore = { "cache-control": "no-store" };

async function handleClick(request, env) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST", ...noStore } });
  }
  // Only accept beacons sent by our own pages (browsers set Origin on POST).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403, headers: noStore });
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return new Response(null, { status: 413, headers: noStore });
  let text;
  try {
    const buf = await request.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_BODY) return new Response(null, { status: buf.byteLength ? 413 : 400, headers: noStore });
    text = new TextDecoder().decode(buf);
  } catch (e) { return new Response(null, { status: 400, headers: noStore }); }
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return new Response(null, { status: 400, headers: noStore }); }
  const blobs = parseEvent(obj);
  if (!blobs) return new Response(null, { status: 400, headers: noStore });
  write(env, blobs);
  return new Response(null, { status: 204, headers: noStore });
}

// Short campaign links: /go/<code> -> 302 to the page with UTM tags, one count logged.
function handleGo(request, env, url) {
  const code = url.pathname.slice(4).replace(/\/+$/, "").toLowerCase();
  const c = Object.prototype.hasOwnProperty.call(CAMPAIGNS, code) ? CAMPAIGNS[code] : null;
  if (!c || (request.method !== "GET" && request.method !== "HEAD")) {
    return new Response(null, { status: 302, headers: { location: "/", ...noStore } });
  }
  let ref = "";
  try { const h = new URL(request.headers.get("referer") || "").hostname.toLowerCase(); if (h !== url.hostname) ref = clean.host(h) || ""; } catch (e) {}
  if (request.method === "GET") write(env, ["go", "campaign", "go/" + code, c.to, c.source, c.campaign, ref]);
  const q = new URLSearchParams({ utm_source: c.source, utm_medium: c.medium || "press", utm_campaign: c.campaign });
  return new Response(null, { status: 302, headers: { location: c.to + "?" + q, ...noStore } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/click") return handleClick(request, env);
    if (url.pathname.startsWith("/go/")) return handleGo(request, env, url);
    if (url.pathname.startsWith("/api/")) return new Response(null, { status: 404, headers: noStore });
    // Anything else: let the asset server answer exactly as it would without this Worker.
    return env.ASSETS.fetch(request);
  },
};
