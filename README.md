# Attestat landing page

Static pitch site for Attestat, formerly Nachweis (ETHOnline 2026). The repository keeps its original name nachweis-site. Plain HTML, CSS and vanilla JS, self-hosted fonts, no build step.

Serve locally:

    python3 -m http.server 8787 --bind 127.0.0.1

The first draft is kept under v1/ for comparison. Domain: attestat.dev (hosting and redirect steps for the builder in docs/hosting.md; the CNAME file at the root is read by GitHub Pages).

The "Who sees what" section is a scripted walkthrough with sample data. The working application is in github devdotbo/nachweis-app (see its docs/demo-runbook.md).
