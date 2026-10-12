# Go-live checklist (Cloudflare Pages + Pages CMS + GitHub)

Prices checked Oct 12, 2026. Nothing here has been bought or created yet.

- [ ] **1. GitHub** (free): create an account (or a free organization, e.g. `easttexasadrenaline`) at https://github.com. Create a repository (e.g. `eta-site`) and push this folder to it:
      `git remote add origin https://github.com/<org>/eta-site.git && git push -u origin main`
- [ ] **2. Cloudflare Pages** (free): sign up at https://dash.cloudflare.com → Workers & Pages → Create → Pages → *Connect to Git* → pick the repo. Build command: *(none)*. Output directory: `/`. Deploy. You'll get a `*.pages.dev` address. Check it.
- [ ] **3. Domain**: buy `easttexasadrenaline.com` at https://porkbun.com ($11.08/yr for .com when checked; registry showed it unregistered on Oct 12, 2026, so confirm at checkout).
- [ ] **4. DNS**: in Cloudflare Pages → your project → *Custom domains* → add `easttexasadrenaline.com` (and `www`). Follow the prompt: either move the domain's nameservers from Porkbun to Cloudflare (simplest) or add the CNAME records Cloudflare shows into Porkbun's DNS. SSL is automatic.
- [ ] **5. Pages CMS**: go to https://app.pagescms.org, sign in with the GitHub account, install the Pages CMS GitHub app on the repo, and open the project (it reads `.pages.yml`).
- [ ] **6. Invite admins**: in the project's collaborator settings, invite Dustyn and Darrell by email. They don't need GitHub accounts.
- [ ] **7. Test**: have each admin add and then delete a test news post; confirm the live site updates in about 1–2 minutes.
- [ ] **8. Before launch**: fill the remaining TODOs (booking email, Spotify/YouTube links, merch prices/vendors, Darrell's bio details).
