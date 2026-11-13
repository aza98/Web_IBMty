# IBMty — agent instructions

Canonical rules for every coding agent (Claude Code, Codex/GPT, Gemini). The user's request
defines the scope; skills and pending items never authorize extra work. Read only needed docs.

## Stack

- Website and installable PWA of Iglesia Bautista de Monterrey. Multipage HTML, CSS and
  classic scripts: no build, no npm, no ES modules, no backend of its own.
- Third-party code only in `vendor/<name>/<version>/`. Never add CDN scripts or inline scripts.
- Sibling project RIBBI shares the layout, the `core/` module design and `tools/verify.mjs`
  (byte-identical; never edit it here alone). Never copy RIBBI configuration, content,
  identifiers or provider values.

## Where truth lives

- Public configuration (flags, services, contact): `assets/js/core/config.js`. It is served
  to browsers: never put secrets there; never copy its keys, emails or phones into docs or
  examples; cite the path.
- Release: `assets/js/core/version.js` (`IBMTY_RELEASE`); history in `CHANGELOG.md`.
- Persisted keys: `assets/js/core/storage.js` (`boot/theme.js` reads the theme first).
- Repeated records: `assets/data/{events,ministries,missionaries}.json`; prose stays in HTML.
- Tokens: `assets/css/core/tokens.css`. Contracts: `DESIGN.md`. Audience: `PRODUCT.md`.
  Screen briefs: `.impeccable/surfaces/`. Translation: `assets/js/core/i18n.js`, `assets/js/i18n/en/`.
- Vendor inventory and hashes: `vendor/vendor.json`; notices: `THIRD_PARTY_NOTICES.md`.
- PWA: `sw.js`, `service-worker/`, `manifest.webmanifest`.
- Docs (Spanish): `docs/architecture.md`, `docs/development.md`, `docs/offline-pwa.md`,
  `docs/design-review.md`, `docs/status.md` (the only place for pending work and evidence).

## Hard contracts

- Spanish is the source of every UI text; English is an overlay. Every new or changed Spanish
  text needs its English entry, or a `keep` entry for proper names.
- Keep HTML navigation, no-JS fallbacks, keyboard access, visible focus, both themes
  (`html[data-bs-theme]`), installed mode (`html[data-display]`), reduced motion and safe areas.
- Module pattern: IIFE, `'use strict'`, `IBMty.register('page:<data-page>' | 'component:…',
  { prepare, init })`. Keep each file's existing indentation.
- Relative paths only (the site may live under a sub-path); resolve with `IBMty.url()`.
- Header, footer and tab bar repeat in every HTML: change every copy. So do the stylesheet
  links: every page links each `assets/css/core/` and `assets/css/components/` sheet itself, in
  the same order (no `@import`, no entry sheet); a new shared sheet goes in all seven pages.
- Check producers and consumers before changing selectors, events, routes or storage keys.
- Manifest identity stays: `id: "./"`, `scope: "./"`, `display: "standalone"`,
  `start_url: "./app/splash.html?source=pwa"`.
- Template data goes through `IBMty.escapeHtml`; dynamic text through `textContent`; links
  from data files accept only `https:`.
- Names in English, lowercase, hyphens; files named after a person, place or ministry keep it.
- Never edit `vendor/` files by hand: replace the version (`docs/development.md`).

## Verify

```sh
node tools/verify.mjs                   # must exit 0 before finishing
node tools/verify.mjs --write-precache  # after changing any site file, then verify again
node tools/verify.mjs --write-hashes    # deliberate vendor updates only
```

- The verifier scans the whole tree: remove any extracted package (e.g. `build/`) first.
- Exercise affected pages in a browser (both themes, both languages, browser and installed
  mode) and report what was not tested. Never send real forms or change real subscriptions.
- A passing static check proves neither rendering, form delivery nor deployment.

## Package and deploy

- `sh tools/package.sh /absolute/path/ibmty.tar.gz` defines the shipped set; write it outside
  the repo. Only license notices may ship as Markdown; `.htaccess` must ship.
- Every push to `main` publishes through `.github/workflows/deploy.yml` (verify → package →
  content check → FTP). Treat a merge to `main` as a release.
- Credentials live only in GitHub secrets/variables. Keep actions pinned by commit SHA, never
  set `dangerous-clean-slate`, never weaken the content check.
- For a release, bump `version.js` and add a `CHANGELOG.md` entry.

## Docs and skills

- English: agent files, `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/`, skills. Spanish:
  `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `THIRD_PARTY_NOTICES.md`, `docs/`.
- One source of truth per topic: link instead of copying values or history. When a component
  contract changes, update `DESIGN.md` and the screen's brief.
- Skills: copies in `.agents/skills/`, Claude links in `.claude/skills/`, hashes in
  `skills-lock.json`. Use the smallest set: Ponytail, Impeccable, Laws of UX, GSAP, Web
  Quality, OneSignal, security-audit. New skills come from VoltAgent/awesome-agent-skills
  (reference only) and are installed in IBMty and RIBBI.
