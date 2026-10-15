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
- [ ] **8. Before launch**: fill the remaining TODOs (add merch items to data/merch.json only once they have a real vendor listing). Spotify + YouTube links were added Oct 12 evening. Booking contact is set (Oct 15, 2026): Facebook Messenger (https://m.me/Easttexasadrenaline) or easttexasadrenaline@yahoo.com.
