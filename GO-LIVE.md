# Go-live checklist (Cloudflare Pages + Pages CMS + GitHub)

Prices checked Oct 12, 2026. Nothing here has been bought or created yet.

- [ ] **1. GitHub** (free): create an account (or a free organization, e.g. `easttexasadrenaline`) at https://github.com. Create a repository (e.g. `eta-site`) and push this folder to it:
      `git remote add origin https://github.com/<org>/eta-site.git && git push -u origin main`
- [ ] **2. Cloudflare Pages** (free): sign up at https://dash.cloudflare.com → Workers & Pages → Create → Pages → *Connect to Git* → pick the repo. Build command: *(none)*. Output directory: `/`. Deploy. You'll get a `*.pages.dev` address. Check it.
- [x] **3. Domain**: `easttexasadrenaline.com` registered via Porkbun (user confirmed Oct 13, 2026).
- [ ] **4. DNS**: in Cloudflare Pages → your project → *Custom domains* → add `easttexasadrenaline.com` (and `www`). Follow the prompt: either move the domain's nameservers from Porkbun to Cloudflare (simplest) or add the CNAME records Cloudflare shows into Porkbun's DNS. SSL is automatic.
- [ ] **5. Pages CMS**: go to https://app.pagescms.org, sign in with the GitHub account, install the Pages CMS GitHub app on the repo, and open the project (it reads `.pages.yml`).
- [ ] **6. Invite admins**: in the project's collaborator settings, invite Dustyn and Darrel by email. They don't need GitHub accounts.
- [ ] **7. Test**: have each admin add and then delete a test news post; confirm the live site updates in about 1–2 minutes.
- [x] **8. Content clean-up** (Oct 15, 2026): every visible TODO/placeholder removed from the site (EPK note, member TODO fields, merch "Note / TODO" field, "?" / "ETA" stand-in image boxes). Merch shows only items with a real vendor listing. Booking contact is set: Facebook Messenger (https://m.me/Easttexasadrenaline) or easttexasadrenaline@yahoo.com.
- [ ] **9. Live-domain URLs**: index.html already points at the live domain in `<link rel="canonical">`, `og:url`, `og:image` (https://easttexasadrenaline.com/img/og.jpg) and the JSON-LD `url`. These only work once step 4 is done. If you launch on www or a `*.pages.dev` address instead, update those four spots. After launch, test the share preview (e.g. paste the URL into a Facebook post draft).
- [ ] **10. SSL**: Cloudflare issues the certificate automatically after step 4. Confirm https://easttexasadrenaline.com and https://www.easttexasadrenaline.com both load with a padlock, and that www redirects to the bare domain (or the other way around) so there's one canonical address.
- [ ] **11. Analytics (optional, free)**: none is installed. If wanted, turn on Cloudflare Web Analytics for the Pages project (no cookie banner needed). Nothing has been signed up for.
- [ ] **12. Search engines (optional)**: no robots.txt or sitemap.xml yet. After launch, you can add the site in Google Search Console with the Google account you prefer.
