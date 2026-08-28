# CONTEXT.md

Internal state, architecture, and decision record for AI assistants and human maintainers working on this repository. The application version is defined only by `APP_CONFIG.appVersion` in `config/config.js`. If this document ever disagrees with the implementation, use the source-of-truth order in §12.

---

## 1. Product identity and scope

**IBMty** is the Spanish-language (`lang="es"`) public website and installable PWA for **Iglesia Bautista de Monterrey**, a church in Monterrey, Nuevo León, Mexico. It serves visitors and the congregation with institutional information, schedules, events, livestreams, ministries, missions, salvation content, donations, privacy information, contact forms, and installed-app features.

The current application version is `APP_CONFIG.appVersion` in `config/config.js`.
Do not infer it from a Git tag, branch, commit, or the web manifest, and do not
copy its value into another source file. `sw.js` imports that configuration before
deriving `APP_SW_VERSION`; Settings renders it through `data-config-text`.

`manifest.json` intentionally has no version field.

## 2. Hard architecture constraint: static site and direct deployment

There is no first-party backend, ES-module graph, package manager, bundler, transpilation, or build step. A push to `main` triggers `.github/workflows/main.yml`; GitHub Actions synchronizes the allowed repository tree directly to `/ibmty/` over FTP. The files in the repository are the production artifacts.

Consequences:

- Application paths are relative and must resolve the same way locally and in production.
- `config/config.js` declares the global lexical binding `const APP_CONFIG`; later classic scripts access it by identifier. It is not guaranteed to exist as `window.APP_CONFIG`.
- The order of `<script defer>` tags in each HTML file is the dependency graph. `js/pwa-launch.js` is the synchronous exception and runs before paint to route installed-app sessions.
- Local development means serving the repository over HTTP. `file://` cannot exercise Service Workers correctly.
- Development tools and AI skills must never become runtime dependencies.

Tooling isolation policy: `.impeccable/`, `.claude/`, `.agents/`, `.codex/`, and `skills-lock.json` are covered by both `.gitignore` and the FTP denylist. Any new tooling path must be added to both mechanisms. The installed-skill inventory in §11 is maintenance context only; none of it is required by the deployed site.

## 3. Repository structure and file ownership

```text
index.html, nosotros.html, salvacion.html,
donativo.html, privacidad.html             five public pages
settings.html, splash.html, offline.html   three PWA/noindex surfaces
manifest.json, sw.js                       manifest and Service Worker
robots.txt, sitemap.xml                    technical SEO
config/config.js                           global configuration
css/main.css                               tokens and shared components
css/components/carousel.css                shared carousel presentation
css/pages/*.css                            seven page-specific stylesheets
js/main.js                                 global initialization and behavior
js/pwa-launch.js                           synchronous PWA launch guard
js/components/*.js                         animation, carousel, map, push, YouTube
js/pages/*.js, js/utils/*.js               page behavior and analytics
assets/icons/icons.svg                     local SVG sprite
assets/calendar/CIMA_2026.ics              downloadable event
gsap-public/, leaflet/, workbox/            locally hosted dependencies
THIRD_PARTY_NOTICES.md                     licenses and attribution
```

There are exactly **nine CSS files**: `css/main.css`, `css/components/carousel.css`, and seven files under `css/pages/` (`donativo.css`, `index.css`, `nosotros.css`, `privacidad.css`, `salvacion.css`, `settings.css`, and `splash.css`).

Six pages (`index.html`, `nosotros.html`, `salvacion.html`, `donativo.html`, `privacidad.html`, and `settings.html`) contain the navbar and PWA tabbar. The five public pages also contain the footer. `splash.html` and `offline.html` intentionally omit the fixed shell.

There is no include or template mechanism; shared chrome is physically duplicated. **`nosotros.html` is the canonical shared-chrome reference.** When changing the shell, propagate the same structure to the other five copies and preserve only the current-page differences.

Ownership rules:

- Put shared visual tokens and components in `css/main.css`.
- Put carousel-only shared styles in `css/components/carousel.css`.
- Keep page-only selectors in the matching `css/pages/*.css` file.
- Put behavior used on multiple pages in `js/main.js` or `js/components/`.
- Keep truly page-specific behavior in `js/pages/`.
- Do not move code merely to make the taxonomy look cleaner; script order, HTML references, and precache entries are coupled.

## 4. Pages and current capabilities

| File | Responsibility |
|---|---|
| `index.html` | Hero, schedules, YouTube live/latest-video widget, and events. Includes the **CIMA 2026** card and a control for `assets/calendar/CIMA_2026.ics`. |
| `nosotros.html` | Philosophy, history, leadership, ministries, missionary map, location, and contact form. |
| `salvacion.html` | Salvation journey, ScrollTrigger card stack, and prayer modal with confetti. |
| `donativo.html` | Local Fund and Missions account details with clipboard support. |
| `privacidad.html` | Privacy notice, cookies, and ARCO rights. |
| `settings.html` | Theme, push, installation, and WhatsApp preferences; installed-app-only and `noindex`. |
| `splash.html` | Entry surface defined by `manifest.json`; `noindex`. |
| `offline.html` | Self-contained navigation fallback; `noindex`. |

Verified cross-cutting capabilities:

- Light, dark, and system theme modes, with a persisted manual preference.
- Responsive web navbar and five-item PWA tabbar; `body.is-pwa` switches the shells and preserves safe-area spacing.
- PWA installation, a manual iOS guide, persistent storage, OneSignal notifications, and version-aware updates.
- Web Share with fallbacks, WhatsApp, clipboard actions, forms, and status messaging.
- GA4 loaded dynamically only after consent.
- YouTube Data API integration with session caching, quota-aware polling, visibility gates, and Monterrey service times.
- Leaflet missionary map with pins, proximity grouping, filters, and theme-reactive tiles.
- GSAP/ScrollTrigger motion with distributed `prefers-reduced-motion` coverage.

## 5. Runtime dependencies and licenses

| Resource | Current version | Delivery |
|---|---:|---|
| Bootstrap | 5.3.8 | jsDelivr CDN with SRI |
| Swiper | 14.0.6 | jsDelivr CDN with SRI; Home and About |
| canvas-confetti | 1.9.4 | jsDelivr CDN; Salvation only |
| OneSignal Web SDK | v16 | Page SDK from CDN and local worker |
| GSAP core and plugins | 3.15.0 | Local under `gsap-public/minified/` |
| Leaflet | 1.9.4 | Local under `leaflet/dist/` |
| Workbox | 7.4.1 | Local loader and six local modules |
| Poppins and League Spartan | — | Local font files |

`THIRD_PARTY_NOTICES.md` is the licensing authority. It ships over FTP because it is not denylisted, but it is deliberately excluded from `PRECACHE_URLS`: attribution must remain publicly accessible, but it does not need to block offline installation.

License decisions that must not be reduced to generic claims:

- GSAP uses the **GreenSock Standard License; it is not MIT**.
- `assets/icons/icons.svg` contains Font Awesome Free 7.3.1 geometry under **CC BY 4.0**. The Font Awesome runtime, CSS, and icon webfont are neither distributed nor loaded.
- Poppins and League Spartan retain their OFL license files in their directories.
- Leaflet is BSD-2-Clause; Workbox and the local OneSignal worker are MIT.

## 6. JavaScript, configuration, and execution traps

The maintained first-party code comprises ten scripts: `js/main.js`, `js/pwa-launch.js`, five files under `js/components/`, two under `js/pages/`, and `js/utils/analytics.js`. `js/OneSignalSDK.sw.js` and `js/workbox-sw.js` are third-party copies.

Observed conventions:

- Classic scripts and shared global scope; do not convert one file to an ES module without redesigning its load graph.
- Initialization occurs through `DOMContentLoaded`; the call order at the end of `js/main.js` is functional, not cosmetic.
- `data-*` attributes form a declarative behavior API for config injection, sharing, copying, analytics, and animation.
- Historical code favors `var` and `!0`/`!1`, with a few exceptions. Cosmetic modernization alone does not justify mixing styles.
- `data-config-text` and `data-config-href` resolve dotted paths inside `APP_CONFIG`.

Important couplings:

- `js/pages/nosotros.js` assigns the Formspree endpoint and listens for `form-success`. Removing it can stop form delivery or its success UX even when the HTML looks complete.
- `js/components/youtube-api.js` is loaded only by Home. Its polling, visibility, and service-window gates protect API quota. Its time conversion assumes `America/Monterrey` has no DST.
- Salvation has two ScrollTrigger systems touching the same cards: reveal behavior in `animations.js` and stacking in `salvacion.js`. They animate different properties but depend on script order and refresh measurements.
- The YouTube API key is necessarily public in this static architecture. Protect it through provider-side referrer and quota restrictions, not through an assumption of secrecy in `config/config.js`.
- The theme bootstrap, early Settings guard, Home JSON-LD, and Offline-only CSS/script remain inline for pre-paint, SEO, or offline-reliability reasons.

Motion has two deliberate sources: `css/main.css` owns CSS-transition tokens, while `js/components/animations.js` owns the GSAP `ANIM` scale. A buildless site has no natural shared token module between them. Every new animated surface must handle `prefers-reduced-motion`; a single global rule does not cover Swiper, Leaflet, splash, counters, and timelines.

## 7. Current visual system

### Color

The system uses a slate-tinted neutral base and a single brand family anchored at `#00C0F6`. Semantic roles are consolidated into one matrix repeated in `:root`, explicit `html[data-theme="light"]` / `html[data-theme="dark"]` blocks, and the system-dark block. Every theme-dependent token must resolve in light, dark, and system-default modes.

| Role | Light | Dark |
|---|---|---|
| Background | `#FFFFFF` | `#070D15` |
| Surface | `#F4F7FA` | `#0E1724` |
| Secondary surface | `#E7EEF4` | `#162334` |
| Primary text | `#112233` | `#E6EEF6` |
| Heading | `#081422` | `#F6FAFD` |
| Secondary text | `#33485E` | `#9CB0C4` |
| Border | `#D8E2EC` | `#1C2C3E` |
| Strong border | `#768FA7` | `#3E5570` |
| Base brand | `#00C0F6` | `#00C0F6` |
| Strong brand for text/focus | `#006E96` | `#38BDF8` |

The cyan family is reserved for primary actions, active navbar/tabbar states, links, focus, map pins, and Splash progress. Raw `#00C0F6` is used for action/state fills; links and focus use `--color-brand-strong` to improve legibility without changing color family. Surfaces, shared icon boxes, and ordinary content stay neutral so brand color remains a signal rather than decoration.

`--color-on-brand` is `#FFFFFF` in light, dark, and system modes. White on `#00C0F6` is approximately **2.13:1**, below AA for normal text. This is an explicit, knowingly accepted client decision: do not change the hue or reopen it as a defect. Legibility is supported through size, weight, chip/button shape, and context; active navigation labels also use weight 700 and therefore do not rely on color alone.

The color pass removed **11 obsolete color tokens** and normalized shared icon boxes to neutral surfaces, secondary ink, and shared size/radius rules. Do not reintroduce ornamental card gradients or unrelated gold/green families into ordinary components.

### Type and spacing

Hierarchy comes from size, weight, and rhythm before color:

- Identity heading: `clamp(2.25rem, 5.5vw, 3.25rem)`.
- Chapter heading: `clamp(1.75rem, 4vw, 2.5rem)`.
- Local heading: `clamp(1.15rem, 2.2vw, 1.375rem)`.
- Text scale: `0.75`, `0.8125`, `0.875`, `1`, `1.125`, `1.3125`, `1.625`, and `2rem` (`--text-2xs` through `--text-2xl`).
- First-party spacing scale: `--space-1` through `--space-8`, from `0.5rem` to `3rem`.

### Character and motion

The shared language is restrained, bright, and pastoral: pale/slate surfaces, typographic hierarchy, and selective cyan. Shared components avoid decorative rings, glows, and hover movement/elevation; the branded logo shadow in `css/pages/splash.css` is the existing page-specific exception. Shared elevation is structural, and motion respects reduced-motion preferences.

## 8. Icon system

`assets/icons/icons.svg` contains **65 local symbols**. Geometry comes from Font Awesome Free 7.3.1, names use a Lucide-like vocabulary, and all paths use `currentColor`. HTML and JavaScript render `<svg class="icon"><use href="assets/icons/icons.svg#i-…"></use></svg>`.

The `.icon` optical box uses `--icon-ratio: 1.25`, matching the widest sprite `viewBox` (640/512). Height remains `1em`, width may grow to `1.25em`, and negative inline margins return inline advance to `1em`. This keeps wide icons from looking smaller without distortion or layout drift.

Five currently unreferenced symbols are deliberately retained: `i-arrow-left-right`, `i-building-2`, `i-calendar-range`, `i-forward`, and `i-user-plus`. Removing them would recover only about **0.5–0.6 KB gzip**; the risk of deleting a dynamic reference or later restoring geometry outweighs that saving.

### Audit trap: JavaScript-built icon references

A grep for `#i-` does not find every icon. `ICON_SPRITE` already ends with `#i-`, and some names are concatenated later:

- `i-bell-off`: the `bell-off` name is passed to `setIcon()` from `js/components/push.js`.
- `i-loader-circle`: `js/main.js` concatenates `ICON_SPRITE + 'loader-circle'` for the “Updating” state.

Two separate audits incorrectly classified those symbols as dead. A `<use>` whose symbol is missing fails silently: it leaves an empty box and produces no console error. The comment block at the top of `assets/icons/icons.svg` therefore lists dynamic references. Before deleting a symbol, combine static-reference search with literals passed to `setIcon()` / `makeIcon()` and `ICON_SPRITE` concatenations. Add every new dynamic reference to that comment block.

## 9. PWA, caching, SEO, and release behavior

`sw.js` uses Workbox 7.4.1 and contains **51 `PRECACHE_URLS` entries**; all 51 exist in the current tree. The list includes eight pages, nine CSS files, required first-party scripts, Workbox modules, GSAP/ScrollTrigger, Leaflet, essential sprite/logo assets, install icons, the YouVersion QR image, and `assets/calendar/CIMA_2026.ics`.

`THIRD_PARTY_NOTICES.md`, `robots.txt`, and `sitemap.xml` ship but are not part of the application precache. Documents use `NetworkFirst`; CDN resources, fonts, tiles, and images use bounded runtime caches. `offline.html` is the document catch handler.

`manifest.json` keeps `id` and `scope` at `./`, `start_url` at `splash.html`, `display` at `standalone`, and includes a maskable icon. `js/pwa-launch.js` covers deep/restored standalone entry and prevents loops with session state. Updates use `GET_VERSION` and `SKIP_WAITING` messages and wait for `controllerchange` before restarting the initiating tab.

Current SEO state:

- All eight pages have a `<title>` and Open Graph metadata.
- The five public pages have canonical URLs and appear in `sitemap.xml`.
- Home contains JSON-LD with `@type: "Church"`.
- `settings.html`, `splash.html`, and `offline.html` use `meta robots="noindex"` and do not appear in the sitemap.
- `robots.txt` allows general crawling and declares `sitemap.xml`; it has no Settings-specific rule.

Changing a resource in `PRECACHE_URLS` requires an explicit release decision. To
release a new version, change only `APP_CONFIG.appVersion` in `config/config.js`.
Because it is imported by `sw.js`, that change participates in the Service Worker
update check and supplies the precache revision and Settings value.

## 10. Completed audits and open debt

### Completed

- Full first-party JavaScript audit: syntax is clean and responsibilities remain intact; `js/pwa-launch.js` remains separate because it must run synchronously.
- Audit and reorganization of all nine CSS files. The pass recorded approximately **9.2 KB uncompressed** saved at its completion point; this is a historical pass measurement, not reproducible without that exact comparison tree.
- Color tokens consolidated into one semantic light/dark/system matrix; 11 obsolete color tokens removed.
- HTML/shared-chrome audit, with `nosotros.html` established as the physical reference.
- SEO pass: titles, canonical URLs, Open Graph, `Church` JSON-LD, `robots.txt`, and `sitemap.xml`.
- Sprite audit: 65 symbols, dynamic references documented, and five unused symbols retained intentionally.
- `THIRD_PARTY_NOTICES.md` created with verified licenses.
- CIMA 2026 added to Home with a downloadable, precached calendar file.

### Open or deliberately deferred

- **Bootstrap CSS:** the coverage pass reported about **88% unused** and roughly **30.8 KB gzip potentially recoverable**. Removing it or producing a subset is a high-risk cross-page change across the six shell pages and remains open.
- **`monotonous-spacing`:** the finding mixes Bootstrap spacing utilities (`gap-*`, margin/padding helpers) with `--space-1` through `--space-8`. Decide whether to normalize that mix; do not add another scale merely to silence a detector.
- Validate production installation, activation, precaching, and the complete `SKIP_WAITING` / `controllerchange` cycle with an already-installed client.
- Test real OneSignal subscription and delivery on a supported desktop browser and an installed iOS/iPadOS PWA.
- Verify top/bottom/landscape safe areas on physical iPhone hardware with a notch or Dynamic Island, including `offline.html`.
- `.leaflet-control-attribution` remains hidden. This is an unresolved product/license decision relative to tile-provider attribution terms.
- GSAP Flip and TextPlugin are stored locally but no page loads them; font directories also retain unreferenced weights/styles. These are size opportunities, not runtime defects.
- Redesign YouTube timezone conversion before changing to a DST-observing zone.
- Review both Salvation ScrollTrigger systems together if scroll measurements become incorrect.
- The Bootstrap-coverage and CSS-saving figures are audit records; remeasure them before using them as a reproducible performance baseline.

There is no automated test suite. Syntax checks do not replace browser, Service Worker, production, or physical-device verification.

## 11. AI maintenance workflow and installed skills

### Working rules for future AI assistants

1. Read `README.md`, this file, and the authoritative files in §12 before editing.
2. Classify the request first: documentation, behavior, visual design, PWA, SEO, content, or tooling. Load only the skills that match the task.
3. Inspect current code before proposing changes. Do not trust line numbers, old summaries, or audit counts without rechecking them.
4. Preserve file ownership and the no-build architecture. Do not introduce a framework, package manager, generated bundle, or runtime dependency without explicit authorization.
5. For shared chrome changes, start from `nosotros.html`, propagate to the other five copies, and preserve active state, theme/notification/install controls, and all five tabbar items.
6. For JavaScript changes, run `node --check` on every affected first-party file and on `sw.js` when relevant.
7. For CSS or HTML changes, serve all eight pages and check mobile/desktop plus light/dark/system states, focus, hover, content flow, and horizontal overflow.
8. For precache changes, verify the count and existence of every path, then test clean installation, offline navigation, and update from an older release.
9. For PWA/WebKit work, follow the required official-documentation protocol below. Platform behavior changes too quickly to rely on memory or a dated snapshot.
10. Keep this document state-based: record durable architecture, reasoning, traps, installed skill versions, and open debt—not chat transcripts, temporary Git status, or test screenshots.

The former long, dated WebKit/PWA standards snapshot was intentionally removed because copied external guidance aged faster than the implementation. Its durable instruction is rule 9. Historical trajectory is also not a source of current state; use `git log` when history is actually needed.

### Required WebKit and Progressive Web App documentation protocol

Any new PWA/WebKit adjustment, feature, optimization, compatibility fix, audit, or
release-affecting change must begin with the current official documentation. Use
both [WebKit](https://webkit.org/) and the [Progressive Web Apps collection on
web.dev](https://web.dev/explore/progressive-web-apps) as the primary references;
follow the linked, feature-specific official guidance when the work concerns a
particular API or platform behavior.

- Check current support and documented constraints before selecting an approach.
  Do not infer Safari/WebKit behavior from Chromium behavior, old test results,
  memory, blog posts, or copied documentation.
- Prefer progressive enhancement and capability detection. The ordinary website
  must remain usable when installation, push, storage, Service Workers, sharing,
  or another optional PWA capability is unavailable or denied.
- Preserve the PWA contract unless a release decision explicitly changes it:
  valid manifest scope/start behavior, secure-context requirements, offline
  fallback, bounded caching, and the existing version-aware Service Worker update
  path.
- Turn the relevant documented requirements into a focused verification pass.
  Test in the affected Safari/WebKit context when practical, in addition to the
  browser and offline/update checks already required by this document. Record an
  untestable physical-device or provider-dependent behavior as open work rather
  than declaring it verified.
- Cite the exact official pages consulted in the change record, review, or audit
  output when external behavior informed the decision. Keep this file focused on
  durable project constraints; do not paste transient standards snapshots here.

### Installed skill inventory

This inventory records project-scoped skills and the task-specialized suites already relevant to IBMty work, as audited on **2026-08-27**. It is intentionally not a catalog of every plugin available to the host. A skill guides development work; it is not shipped application code. Recheck the listed path before relying on it because user-scoped skills may not exist on another workstation.

#### Project-scoped frontend skill

| Skill | Installed version | Canonical path | Use for |
|---|---:|---|---|
| `impeccable` | **4.1.1** | `.agents/skills/impeccable/SKILL.md` | Frontend design, UI audit, accessibility, responsive behavior, theming, typography, spacing, color, motion, and interface polish. |

Compatibility copies of Impeccable 4.1.1 also exist at `.claude/skills/impeccable/SKILL.md` and `.gemini/skills/impeccable/SKILL.md`. Their adapter-specific frontmatter differs, so do not expect byte-identical files. For agents that understand `.agents/skills/`, treat that copy as canonical.

#### Official GSAP skill suite

The GSAP skills are installed at user scope under `/Users/azael/.agents/skills/` from `greensock/gsap-skills`. Upstream does **not** declare semantic versions in their `SKILL.md` frontmatter. Their installed version is therefore identified by the folder hash pinned in `/Users/azael/.agents/.skill-lock.json` (lock schema version 3), installed on 2026-07-25.

| Skill | Installed snapshot hash | Relevance to IBMty |
|---|---|---|
| `gsap-core` | `135754edd728103e329a8df8b471b197375b370e` | Core tweens, eases, responsive motion, reduced motion. |
| `gsap-scrolltrigger` | `7838f515e05bfab0a79dd63368a409ddc7d76ee6` | Scroll reveals, parallax, pinning, and Salvation stack behavior. |
| `gsap-timeline` | `37eb5d623c3e14367864d57160acb64f13950994` | Sequenced hero, modal, navbar, and splash animation. |
| `gsap-utils` | `3f7aa617dd2dc7ebf21f30349b9c7b6d8640d789` | Collection and numeric helpers used in animation work. |
| `gsap-performance` | `34dec2f051872f8d02df06de97450e448bac9c5e` | Transform-first animation and jank prevention. |
| `gsap-plugins` | `e31ccbdb75cf41f0e7df0fec567f6e07956eaca9` | Plugin registration and review; ScrollTrigger still uses its dedicated skill. |
| `gsap-frameworks` | `5b086fa623be801882128fa16b2a9b446d193029` | Installed, but not applicable while IBMty remains framework-free. |
| `gsap-react` | `ac01a338b96fddbc6cf65a89858d2e6068887b39` | Installed, but not applicable while IBMty remains vanilla JavaScript. |

Use the smallest relevant set. For example, a scroll-linked animation normally needs `gsap-core`, `gsap-scrolltrigger`, and possibly `gsap-performance`; it does not need React/framework guidance.

#### Ponytail simplification suite

The Ponytail plugin is installed in Codex at version **4.9.0** under `/Users/azael/.codex/plugins/cache/ponytail/ponytail/4.9.0/`. It is relevant to IBMty's simplify/unify/shrink passes, but it must be invoked only when the host's trigger rules or the user's request call for it.

| Skill | Installed version | Use for |
|---|---:|---|
| `ponytail` | 4.9.0 | Minimal implementation decisions: YAGNI, native platform features, and the smallest safe solution. |
| `ponytail-review` | 4.9.0 | Diff-focused review for over-engineering and removable complexity. |
| `ponytail-audit` | 4.9.0 | Whole-repository audit for bloat, unnecessary abstraction, and native replacements. |
| `ponytail-debt` | 4.9.0 | Inventory of deliberate `ponytail:` deferrals. |
| `ponytail-gain` | 4.9.0 | General benchmark impact summary; not a repository-specific measurement. |
| `ponytail-help` | 4.9.0 | Command and mode reference. |

#### Claude-local helper skills

| Skill | Installed version | Path | Scope |
|---|---|---|---|
| `webapp-testing` | **Not declared by its manifest** | `.claude/skills/webapp-testing/SKILL.md` | Local browser interaction and Playwright-based UI verification when that environment exposes it. |
| `skill-creator` | **Not declared by its manifest** | `.claude/skills/skill-creator/SKILL.md` | Creating or evaluating skills, not ordinary IBMty application work. |

Do not invent semantic versions for unversioned skills. Record a manifest version when one exists; otherwise record the exact lock hash or state plainly that the manifest is unversioned. If a future task updates a skill, update this inventory in the same change.

## 12. Sources of truth

This document has no automated consistency check. If sources disagree, use this order:

1. **Version and caching:** `config/config.js` (`APP_CONFIG.appVersion`) is the sole authority. `sw.js` derives `APP_SW_VERSION` from it; Settings derives its displayed value from it.
2. **Actual loading:** each HTML `<head>` for CSS, scripts, order, SRI, metadata, and inline code.
3. **Design:** live tokens/selectors in `css/main.css` and `css/components/carousel.css`, then the matching page stylesheet.
4. **Behavior:** actual functions and listeners under `js/`; do not infer dynamic use from literal grep alone.
5. **PWA:** `manifest.json`, `sw.js`, `js/pwa-launch.js`, and `offline.html`.
6. **SEO:** the five public-page heads, Home JSON-LD, `robots.txt`, and `sitemap.xml`.
7. **Licenses:** `THIRD_PARTY_NOTICES.md` and license files shipped with dependencies.
8. **Publishing and tooling isolation:** `.github/workflows/main.yml` and `.gitignore`, which must remain coordinated.
9. **Installed skills:** each skill's `SKILL.md` frontmatter; for unversioned user-scoped skills, `/Users/azael/.agents/.skill-lock.json`.
10. **History:** `git log` only for trajectory; it never overrides the current tree.
11. **External state:** a real test on `https://www.ibmty.com`, the relevant provider, or physical hardware. If it was not tested, keep it open rather than assuming success.
