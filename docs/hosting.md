# Hosting attestat.dev

Written 2026-09-08 for the builder. Nothing in this file has been executed: no DNS record was changed, no hosting was enabled, nothing was bought. Every step is the builder's. Evidence labels follow the wiki convention (FACT with source and date, unverified where not checked).

## What is hosted

This repository (github devdotbo/nachweis-site, private at the time of writing, FACT via `gh repo view` 2026-09-08). A static site: index.html, style.css, app.js, fonts/ and the CNAME file at the repository root. No build step. The v1/ and _preview/ folders are not needed for hosting and can be left in place.

## Host choice: GitHub Pages, repository made public

Evaluated: GitHub Pages versus Cloudflare Pages.

- FACT (https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages, fetched 2026-09-08): "GitHub Pages is available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server." So a private repository on the Free plan cannot publish Pages; either the repository is made public or the account is on Pro or higher. The builder's plan is unverified (the API check returned nothing usable).
- FACT (https://developers.cloudflare.com/pages/configuration/custom-domains/, fetched 2026-09-08): for an apex domain such as attestat.dev, Cloudflare Pages requires the domain's nameservers to point to Cloudflare ("configure your nameservers to point to Cloudflare's nameservers"). Only subdomains can be attached by a CNAME at an external DNS provider. That means moving attestat.dev off the Porkbun nameservers, which changes where every future record is managed. Whether Cloudflare Pages builds from a private GitHub repository on the free plan: unverified.

Recommendation (OPINION): GitHub Pages, with this repository flipped to public. A landing page holds nothing secret (checked 2026-09-08: no keys, no env files; the fonts carry their OFL licences in fonts/). DNS stays at Porkbun, no nameserver move, and the repository is public anyway once the submission is public. Fallback if the repository must stay private: Cloudflare Pages with the nameserver move, or a GitHub Pro plan.

## Steps in order (builder)

1. Make the repository public: GitHub, devdotbo/nachweis-site, Settings, General, Danger Zone, "Change repository visibility", Public. Or `gh repo edit devdotbo/nachweis-site --visibility public --accept-visibility-change-consequences`.
2. Enable Pages: Settings, Pages, "Build and deployment", Source "Deploy from a branch", Branch `main`, folder `/ (root)`, Save. The first deploy takes a minute; the site appears at https://devdotbo.github.io/nachweis-site/ (absolute paths are not used in the HTML, so the subpath works).
3. Set the custom domain: on the same Pages settings page, "Custom domain" `attestat.dev`, Save. GitHub reads the CNAME file in the repository root (content `attestat.dev`, committed here); saving in the UI keeps it in sync. Do not tick "Enforce HTTPS" yet; the option becomes available after the certificate is issued in step 6.
4. DNS at Porkbun for attestat.dev (Domain Management, attestat.dev, Details, DNS Records). First delete the Porkbun default records for the apex and for www (the ALIAS or CNAME entries pointing at pixie.porkbun.com), because they conflict. Then add, all with TTL 600:

   | Type | Host | Answer |
   |---|---|---|
   | A | (blank, apex) | 185.199.108.153 |
   | A | (blank, apex) | 185.199.109.153 |
   | A | (blank, apex) | 185.199.110.153 |
   | A | (blank, apex) | 185.199.111.153 |
   | AAAA | (blank, apex) | 2606:50c0:8000::153 |
   | AAAA | (blank, apex) | 2606:50c0:8001::153 |
   | AAAA | (blank, apex) | 2606:50c0:8002::153 |
   | AAAA | (blank, apex) | 2606:50c0:8003::153 |
   | CNAME | www | devdotbo.github.io |

   Addresses are FACT (https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site, fetched 2026-09-08). If the repository moves to a GitHub organisation "attestat", the www CNAME target becomes `attestat.github.io`; the A and AAAA records stay.
5. Verify the domain against takeover (recommended): GitHub, account Settings, Pages, "Add a domain", `attestat.dev`; GitHub shows a TXT record (name of the form `_github-pages-challenge-devdotbo`, value shown in the UI) to add at Porkbun. Exact name and value: taken from the UI at the time, not written here.
6. Wait for the DNS check on the Pages settings page to turn green and for the certificate ("Certificate is being provisioned" turns into an "Enforce HTTPS" checkbox). Tick "Enforce HTTPS". This matters for .dev: the whole TLD is on the HSTS preload list, browsers refuse plain HTTP, so the site is reachable only once the certificate exists.
7. Check from a terminal: `dig +short attestat.dev A` lists the four GitHub addresses; `curl -sI https://attestat.dev | head -5` returns `HTTP/2 200`; `curl -s https://attestat.dev | grep -c Attestat` is greater than zero.

## Redirects for the defensive domains (Porkbun URL forwarding)

Do this for each of attestat.app, attestat.xyz and attestat.tech. Steps quoted from the Porkbun knowledge base (https://kb.porkbun.com/article/39-how-to-forward-a-domain, fetched 2026-09-08):

1. Porkbun, Domain Management, the domain, "Details", edit icon next to "URL Forwarding".
2. Hostname: leave blank (forwards the root domain).
3. "Forward Traffic To": `https://attestat.dev`.
4. Tick "Wildcard Forwarding" (forwards the root domain and every subdomain, so www.attestat.app also lands on attestat.dev).
5. "Toggle advanced settings": redirect type "301 Permanent Redirect" (the default is the temporary 302/307). Tick "Include the requested URI path in the redirection" so that attestat.app/x lands on attestat.dev/x.
6. Save. The knowledge base warns that the default Porkbun records (pixie.porkbun.com) and any records from earlier external hosting must be deleted first, otherwise the forwarding setup fails. The three defensive domains were never hosted, so only the Porkbun defaults are in the way if the error appears.
7. Check: `curl -sI http://attestat.xyz | head -3` shows `301` with `location: https://attestat.dev/`. For https://attestat.app (the .app TLD is HSTS preloaded like .dev) the redirect only works if Porkbun serves a certificate for the forwarded domain; whether Porkbun's forwarding does that for .app: unverified, test with `curl -sI https://attestat.app | head -3` after saving.

## Not done here, on purpose

- No DNS changes, no visibility change, no Pages enablement (builder actions, see above).
- No GitHub organisation "attestat" (builder decision, wiki/name-and-domains.md).
- attestat.eu and attestat.de are not bought (builder decision).
