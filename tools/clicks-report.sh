#!/usr/bin/env bash
# Weekly click / campaign report from Workers Analytics Engine (dataset eta_clicks).
# Needs (created by the Cloudflare account owner, see ANALYTICS.md):
#   CLOUDFLARE_ACCOUNT_ID  - 32-char account id (dashboard > Account home > Account ID)
#   CF_ANALYTICS_TOKEN     - API token with ONLY "Account | Account Analytics | Read"
# Usage: tools/clicks-report.sh [days]      (default 7)
# Each run = a few read queries (free plan: 10,000 read queries/day).
set -euo pipefail
DAYS="${1:-7}"
[[ "$DAYS" =~ ^[0-9]{1,3}$ ]] || { echo "days must be a number" >&2; exit 2; }
: "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"
: "${CF_ANALYTICS_TOKEN:?set CF_ANALYTICS_TOKEN (Account Analytics Read)}"
API="${CF_API_BASE:-https://api.cloudflare.com/client/v4}/accounts/${CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql"
fmt() { if command -v column >/dev/null; then column -t -s $'\t'; else cat; fi; }
# The Analytics Engine SQL API rejects TabSeparatedWithNames, so we query TabSeparated
# and print our own header row, taken from the "AS name" aliases in the SELECT list.
hdr() { sed -E 's/^SELECT (.*) FROM .*/\1/' <<<"$1" | grep -oE 'AS [a-z_]+' | awk '{print $2}' | paste -sd $'\t'; }
q() { local out; echo; echo "== $1"; out=$(curl -fsS "$API" -H "Authorization: Bearer ${CF_ANALYTICS_TOKEN}" --data-binary "$2") || return 1; { hdr "$2"; if [ -n "$out" ]; then printf '%s\n' "$out"; fi; } | fmt; }
W="timestamp > NOW() - INTERVAL '${DAYS}' DAY"
echo "East Texas Adrenaline site: last ${DAYS} days (blob1=type blob2=category blob3=destination blob4=page blob5=utm_source blob6=utm_campaign blob7=referrer host)"
q "Outbound clicks by category" "SELECT blob2 AS category, SUM(_sample_interval) AS clicks FROM eta_clicks WHERE blob1 = 'click' AND $W GROUP BY category ORDER BY clicks DESC FORMAT TabSeparated"
q "Outbound clicks by category and destination" "SELECT blob2 AS category, blob3 AS destination, SUM(_sample_interval) AS clicks FROM eta_clicks WHERE blob1 = 'click' AND $W GROUP BY category, destination ORDER BY clicks DESC LIMIT 100 FORMAT TabSeparated"
q "Clicks by page" "SELECT blob4 AS page, blob2 AS category, SUM(_sample_interval) AS clicks FROM eta_clicks WHERE blob1 = 'click' AND $W GROUP BY page, category ORDER BY clicks DESC FORMAT TabSeparated"
q "Campaign arrivals (/go/ links and UTM landings)" "SELECT blob1 AS how, blob6 AS campaign, blob5 AS source, blob7 AS referrer_host, SUM(_sample_interval) AS arrivals FROM eta_clicks WHERE blob1 IN ('go','land') AND $W GROUP BY how, campaign, source, referrer_host ORDER BY arrivals DESC FORMAT TabSeparated"
q "Clicks from campaign visitors (on the landing page)" "SELECT blob6 AS campaign, blob5 AS source, blob2 AS category, SUM(_sample_interval) AS clicks FROM eta_clicks WHERE blob1 = 'click' AND blob6 != '' AND $W GROUP BY campaign, source, category ORDER BY clicks DESC FORMAT TabSeparated"
q "Clicks by referring site" "SELECT blob7 AS referrer_host, SUM(_sample_interval) AS clicks FROM eta_clicks WHERE blob1 = 'click' AND blob7 != '' AND $W GROUP BY referrer_host ORDER BY clicks DESC LIMIT 50 FORMAT TabSeparated"
