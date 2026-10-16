// Short campaign links for press / promo. Each key becomes https://easttexasadrenaline.com/go/<key>
// Keys: lowercase letters, digits, dashes. "to" must be a site path. Values are slugs (a-z 0-9 . _ -).
// Example: give Outlet X the link easttexasadrenaline.com/go/b1-outletx
export const CAMPAIGNS = {
  // TEST entry so the owner can confirm logging after launch; safe to delete.
  "test": { to: "/", source: "test", campaign: "test" },
  // "b1-outletx": { to: "/", source: "outletx", campaign: "pr-batch1-2026-10" },
  // "b1-outletx-merch": { to: "/merch", source: "outletx", campaign: "pr-batch1-2026-10" },
};
