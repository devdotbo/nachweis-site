# Hosting attestat.dev on Vercel

Written 2026-09-13 (about 15:10 Vienna) after the deployment was executed. Evidence labels follow the wiki convention: FACT with source and date, unverified where not checked. This file replaces the GitHub Pages plan in docs/hosting.md, which is kept as history.

## What exists now

- Vercel project `attestat-site` in the team `7118eth-protonmes-projects` (team id `team_4tMJVcmU2CwbLxWlrMj4aMXM`, project id `prj_P2N0O7f0nhvXpvtte69BTj1Iml6n`). Created with `vercel link --yes --project attestat-site` on 2026-09-13 from this directory, CLI 50.1.3, logged in as `7118eth-3301`. FACT (CLI output).
- Framework preset "Other", no build command, output directory `.` (the repository root is served as is). FACT (`vercel project inspect attestat-site`).
- `vercel link` also connected the GitHub repository https://github.com/devdotbo/nachweis-site to the project on its own ("Connecting GitHub repository ... Connected"). A push to `main` triggers a production deployment on its own: FACT, the push of commit 0ee0e58 on 2026-09-13 produced a deployment with source `git` (Vercel API `/v6/deployments`), next to the CLI deployment of the same commit.
- Production alias: https://attestat-site.vercel.app (public, no login). FACT (curl 2026-09-13, `HTTP/2 200`).
- Per-deployment URLs look like https://attestat-site-6aksoqa3e-7118eth-protonmes-projects.vercel.app. They are behind Vercel deployment protection (curl returns a 302 to a Vercel SSO page), so do not paste those into the submission; use the alias or the custom domain. FACT (curl 2026-09-13, `HTTP/2 302`, location `https://vercel.com/sso-api?...`).
- `vercel.json` at the repository root: `cleanUrls`, `trailingSlash: false`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` on every path, `Cache-Control: public, max-age=31536000, immutable` on `/fonts/*`. No rewrites, no redirects.
- `.vercel/` (local link metadata) is gitignored; `vercel link` added the line itself.
- Domains `attestat.dev` and `www.attestat.dev` are added to the project (`vercel domains add`, both "Success! Domain ... added to project attestat-site"). The Vercel API reports both as `verified: true` (no TXT ownership challenge is required) and `misconfigured: true` (DNS still points at the Porkbun parking host). FACT (`GET /v9/projects/attestat-site/domains/<name>` and `GET /v6/domains/<name>/config`, 2026-09-13).
- `vercel domains inspect attestat.dev` and `vercel domains ls` answer with "You don't have access to the domain attestat.dev under 7118eth-protonmes-projects" (403) and "0 Domains found". That is the CLI view of team-level domains; the project-level domain assignment above is what serves traffic. Whether the CLI view changes after DNS is live: unverified.

## DNS at Porkbun: set by API on 2026-09-13

DNS for attestat.dev was changed by the Porkbun API v3 (`dns/retrieve`, `dns/delete`, `dns/create`) on 2026-09-13 at about 15:03 Vienna, with the builder's authorization. Nameservers stay at Porkbun.

Records found before the change (FACT, `dns/retrieve`): ALIAS apex to `pixie.porkbun.com`, CNAME `*.attestat.dev` to `pixie.porkbun.com` (the parking wildcard, which also covered www), and the four Porkbun NS records. No MX, no TXT.

Deleted: the ALIAS on the apex and the wildcard CNAME (both parking records). The NS records were not touched.

Created, TTL 600 (FACT, `dns/create` returned SUCCESS for each; `dns/retrieve` afterwards shows exactly these plus the NS records):

   | Type | Host | Answer |
   |---|---|---|
   | A | (blank, apex) | 216.198.79.1 |
   | A | (blank, apex) | 64.29.17.1 |
   | CNAME | www | 474811c67fd4534c.vercel-dns-017.com |

These are the values the Vercel API returned as `recommendedIPv4` rank 1 and `recommendedCNAME` rank 1 for this project (FACT, `/v6/domains/attestat.dev/config`, 2026-09-13). Vercel's rank 2 alternatives, not used: A `76.76.21.21`, CNAME `cname.vercel-dns.com`.

No TXT record was needed: the API reports `verified: true` for both names and an empty `acceptedChallenges` list, and `vercel domains inspect` never asked for one (the CLI answers 403 for team-level domain data before and after; the project-level assignment is what serves traffic).

Result (FACT, 2026-09-13 about 15:08 Vienna): the Vercel config endpoint reports `misconfigured: false`, `configuredBy: A` for the apex and `configuredBy: CNAME` for www. `dig +short attestat.dev A` returns 216.198.79.1 and 64.29.17.1. `curl -sI https://attestat.dev/` returns `HTTP/2 200`, `server: Vercel`, the nosniff and referrer-policy headers from vercel.json, and the page contains the hero line once. Certificate: Let's Encrypt, CN attestat.dev, valid 2026-09-13 to 2026-12-12, issued by Vercel without any manual step. https://www.attestat.dev also answers `HTTP/2 200` with its own Let's Encrypt certificate (CN www.attestat.dev, same validity), checked with `curl --resolve` against 216.198.79.1 because the local resolver still had the parking CNAME cached at that moment.

## What happens after (observed and remaining)

- Vercel detected the records within about four minutes and issued the Let's Encrypt certificate on its own (observed 2026-09-13). Resolvers that cached the old parking records at TTL 600 keep serving them until expiry; the local resolver here still showed the parking addresses for a few minutes after Porkbun's own nameservers had the new records.
- `.dev` is on the HSTS preload list, so browsers refuse plain `http://attestat.dev`. The site is reachable only once the certificate exists. Vercel itself also sends `strict-transport-security: max-age=63072000; includeSubDomains; preload` (FACT, curl of the alias 2026-09-13).
- `www.attestat.dev` is added as its own domain and serves the same project; Vercel does not redirect it to the apex unless a redirect is set in Project, Settings, Domains. Not set today.
- Check from a terminal once DNS is live: `dig +short attestat.dev A` lists 216.198.79.1 and 64.29.17.1; `curl -sI https://attestat.dev | head -3` returns `HTTP/2 200`; `curl -s https://attestat.dev | grep -c "How many strangers"` is 1.

## Defensive domains (attestat.app, attestat.xyz, attestat.tech)

Not added. `vercel domains add` has no redirect option in CLI 50.1.3 (only `--force`), so a redirect-to-attestat.dev domain would need the dashboard or the API, plus DNS changes at Porkbun for each name. The Porkbun URL forwarding steps in docs/hosting.md remain the simpler route and do not involve Vercel.

## Redeploying

- From this directory: `vercel deploy --prod --yes`. The CLI uploads the working tree (respecting `.gitignore` because there is no `.vercelignore`), builds nothing, and moves the `attestat-site.vercel.app` alias and the custom domains to the new deployment.
- A push to `main` on GitHub deploys on its own (FACT, see above). The CLI deploy is still fine; both routes update the same production alias and domains.
- A preview deployment (no alias move): `vercel deploy --yes`.

## Fallback URL for the submission

https://attestat.dev is live (FACT, 2026-09-13 15:08 Vienna) and is the URL for the submission. If it ever stops resolving, https://attestat-site.vercel.app serves the same content, is public, and does not depend on DNS at Porkbun.

## Not done here, on purpose

- No repository visibility change.
- No www-to-apex redirect, no defensive-domain redirects.
