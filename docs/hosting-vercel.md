# Hosting attestat.dev on Vercel

Written 2026-09-13 (about 15:10 Vienna) after the deployment was executed. Evidence labels follow the wiki convention: FACT with source and date, unverified where not checked. This file replaces the GitHub Pages plan in docs/hosting.md, which is kept as history.

## What exists now

- Vercel project `attestat-site` in the team `7118eth-protonmes-projects` (team id `team_4tMJVcmU2CwbLxWlrMj4aMXM`, project id `prj_P2N0O7f0nhvXpvtte69BTj1Iml6n`). Created with `vercel link --yes --project attestat-site` on 2026-09-13 from this directory, CLI 50.1.3, logged in as `7118eth-3301`. FACT (CLI output).
- Framework preset "Other", no build command, output directory `.` (the repository root is served as is). FACT (`vercel project inspect attestat-site`).
- `vercel link` also connected the GitHub repository https://github.com/devdotbo/nachweis-site to the project on its own ("Connecting GitHub repository ... Connected"). Whether a push to `main` now triggers a production deployment on its own: unverified (the connection was reported by the CLI, no push-triggered build was observed yet; the deployments in this file were made with the CLI).
- Production alias: https://attestat-site.vercel.app (public, no login). FACT (curl 2026-09-13, `HTTP/2 200`).
- Per-deployment URLs look like https://attestat-site-6aksoqa3e-7118eth-protonmes-projects.vercel.app. They are behind Vercel deployment protection (curl returns a 302 to a Vercel SSO page), so do not paste those into the submission; use the alias or the custom domain. FACT (curl 2026-09-13, `HTTP/2 302`, location `https://vercel.com/sso-api?...`).
- `vercel.json` at the repository root: `cleanUrls`, `trailingSlash: false`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` on every path, `Cache-Control: public, max-age=31536000, immutable` on `/fonts/*`. No rewrites, no redirects.
- `.vercel/` (local link metadata) is gitignored; `vercel link` added the line itself.
- Domains `attestat.dev` and `www.attestat.dev` are added to the project (`vercel domains add`, both "Success! Domain ... added to project attestat-site"). The Vercel API reports both as `verified: true` (no TXT ownership challenge is required) and `misconfigured: true` (DNS still points at the Porkbun parking host). FACT (`GET /v9/projects/attestat-site/domains/<name>` and `GET /v6/domains/<name>/config`, 2026-09-13).
- `vercel domains inspect attestat.dev` and `vercel domains ls` answer with "You don't have access to the domain attestat.dev under 7118eth-protonmes-projects" (403) and "0 Domains found". That is the CLI view of team-level domains; the project-level domain assignment above is what serves traffic. Whether the CLI view changes after DNS is live: unverified.

## Porkbun records to set for attestat.dev (builder)

Porkbun, Domain Management, attestat.dev, Details, DNS Records. Current state (dig 2026-09-13): apex resolves to 207.207.210.107 and 207.207.210.229 (Porkbun parking), `www` is a CNAME to `pixie.porkbun.com`, nameservers are the four `*.ns.porkbun.com` hosts.

1. Delete the Porkbun defaults for the apex (the ALIAS or A records pointing at the parking host) and the `www` CNAME to `pixie.porkbun.com`. They conflict with the records below.
2. Add, TTL 600:

   | Type | Host | Answer |
   |---|---|---|
   | A | (blank, apex) | 216.198.79.1 |
   | A | (blank, apex) | 64.29.17.1 |
   | CNAME | www | 474811c67fd4534c.vercel-dns-017.com |

   These are the values the Vercel API returned as `recommendedIPv4` rank 1 and `recommendedCNAME` rank 1 for this project on 2026-09-13 (FACT, verbatim from `/v6/domains/attestat.dev/config`). Vercel's rank 2 alternatives, also valid: A `76.76.21.21` for the apex and CNAME `cname.vercel-dns.com` for `www`. Use one set, not both.
3. No TXT record is needed: the API shows `verified: true` for both names and an empty `acceptedChallenges` list. If the Vercel dashboard (Project, Settings, Domains) nevertheless shows a `_vercel` TXT record, add exactly what the dashboard shows.
4. No nameserver change. DNS stays at Porkbun.

## What happens after the records are saved

- Vercel detects the records on its next check (the dashboard shows the domain as "Valid Configuration") and issues a Let's Encrypt certificate on its own, no click needed. Time to propagate: depends on Porkbun and the resolver, typically minutes at TTL 600; the old parking records may be cached longer where they were already looked up.
- `.dev` is on the HSTS preload list, so browsers refuse plain `http://attestat.dev`. The site is reachable only once the certificate exists. Vercel itself also sends `strict-transport-security: max-age=63072000; includeSubDomains; preload` (FACT, curl of the alias 2026-09-13).
- `www.attestat.dev` is added as its own domain and serves the same project; Vercel does not redirect it to the apex unless a redirect is set in Project, Settings, Domains. Not set today.
- Check from a terminal once DNS is live: `dig +short attestat.dev A` lists 216.198.79.1 and 64.29.17.1; `curl -sI https://attestat.dev | head -3` returns `HTTP/2 200`; `curl -s https://attestat.dev | grep -c "How many strangers"` is 1.

## Defensive domains (attestat.app, attestat.xyz, attestat.tech)

Not added. `vercel domains add` has no redirect option in CLI 50.1.3 (only `--force`), so a redirect-to-attestat.dev domain would need the dashboard or the API, plus DNS changes at Porkbun for each name. The Porkbun URL forwarding steps in docs/hosting.md remain the simpler route and do not involve Vercel.

## Redeploying

- From this directory: `vercel deploy --prod --yes`. The CLI uploads the working tree (respecting `.gitignore` because there is no `.vercelignore`), builds nothing, and moves the `attestat-site.vercel.app` alias and the custom domains to the new deployment.
- The GitHub connection made by `vercel link` should make a push to `main` deploy on its own; unverified today. If it does, the CLI deploy is still fine, both routes update the same production alias.
- A preview deployment (no alias move): `vercel deploy --yes`.

## Fallback URL for the submission

If attestat.dev does not resolve to Vercel by 17:30 Vienna on 2026-09-13, paste https://attestat-site.vercel.app into the submission. It serves the same content, is public, and does not depend on DNS at Porkbun.

## Not done here, on purpose

- No DNS change at Porkbun (builder action).
- No repository visibility change.
- No www-to-apex redirect, no defensive-domain redirects.
