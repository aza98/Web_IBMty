# CONTEXT.md

Internal, AI-assistant-facing documentation for this repository. Purpose: let
any AI coding assistant (Claude Code, Codex, or others) get productive on this
project in one read, without re-deriving the architecture from scratch each
session. Everything below was verified directly against the current working
tree for application release **7.0.0**. See the "Sources of truth" note at
the end for how to keep it accurate.

---

## 1. What this is

**IBMty** is the official website/PWA of **Iglesia Bautista de Monterrey**
(IBMty), a church in Monterrey, Nuevo León, Mexico. It's a public-facing,
Spanish-language (`lang="es"`) site for the congregation and visitors:
service times and location, church philosophy/history/leadership, an
evangelistic "path to salvation" page, online-donation bank details, a
privacy notice (Mexican data-protection law compliance), and PWA plumbing
(installable app, push notifications, offline support).

It is maintained solo (single committer, "Azael", in the git history) and
deployed as a live production site at `www.ibmty.com`.

## 2. The hard constraint: no build, no backend, static FTP deploy

Every architectural choice in this repo traces back to one constraint:
**there is no build step and no server-side runtime.** `git push` to `main`
triggers `.github/workflows/main.yml`, which runs `SamKirkland/FTP-Deploy-Action`
and copies the repository's files as-is to an FTP host (`server-dir: /ibmty/`).
No `npm install`, no bundler, no transpiler, no template engine touches the
code between your editor and production.

This single fact explains most of what might otherwise look like odd choices:

- **Why config is a plain global `<script>`, not an env file or JSON import**:
  there's no build step to inject environment variables or resolve module
  imports, so `config/config.js` just assigns to a global `APP_CONFIG` object
  and every other script reads `window.APP_CONFIG` at runtime.
- **Why there are no ES modules / bundling**: all JS is loaded via ordinary
  `<script defer>` tags in a fixed order per page, sharing one global scope.
  There's nothing to bundle into, so script order in each HTML `<head>` *is*
  the dependency graph — get it wrong and things silently fail (e.g. a script
  reading `APP_CONFIG` before `config/config.js` has loaded).
- **Why some vendor libraries are vendored locally instead of CDN-only**:
  GSAP (`gsap-public/`), Leaflet (`leaflet/`), and Workbox's loader
  (`js/workbox-sw.js`) are self-hosted so the service worker can precache
  them for offline use and so there's one less third-party origin in the
  critical path. Bootstrap, Swiper, Font Awesome, OneSignal's SDK, and
  canvas-confetti are left on jsDelivr/OneSignal CDNs with SRI
  (`integrity="sha384-..."`) hashes instead — these are either large,
  updated independently of app releases, or (for OneSignal) need to be
  loaded from OneSignal's own CDN to function. There's no bundler to unify
  the two strategies, so both coexist by necessity.
- **Why paths matter and are all relative**: FTP-Deploy-Action copies the
  repo root straight to the web root (`server-dir: /ibmty/`), so `assets/…`,
  `css/…`, `js/…` resolve identically in local dev and production. Don't
  introduce absolute paths assuming a sub-directory or a different origin.
- **Why there's no dev server config, no `package.json`**: nothing to
  install. "Running the project" means serving static files (see README).

## 3. Repository layout

```
index.html, nosotros.html, salvacion.html,     7 top-level pages + offline
donativo.html, privacidad.html,                fallback page, all siblings
settings.html, splash.html, offline.html       at the repo root
manifest.json, sw.js, robots.txt, sitemap.xml  PWA + SEO root files
config/config.js                               single global APP_CONFIG object
js/
  pwa-launch.js                                synchronous pre-paint installed-app launch guard
  main.js                                      site-wide behavior, auto-init on DOMContentLoaded
  workbox-sw.js                                Workbox 7.4.1 loader (used only by sw.js)
  components/                                  behavior used on 2+ pages
    animations.js, carousel.js, push.js,
    missionaries-map.js
    youtube-api.js                             live-stream widget — index.html ONLY (see note below)
  utils/
    analytics.js                                GA4 wrapper, consent-gated
  pages/                                        behavior scoped to exactly one page
    nosotros.js                                 contact-form action wiring + success UX (see note below)
    salvacion.js                                timeline card stack + prayer-modal confetti
css/
  main.css                                      design tokens + shared component library (~2230 lines)
  components/carousel.css                       Swiper skin shared by 2 carousels
  pages/*.css                                    one file per page, page-only rules
gsap-public/minified/                           GSAP 3.15.0 core + plugins, self-hosted
leaflet/dist/                                    Leaflet 1.9.4, self-hosted
workbox/                                         Workbox 7.4.1 submodules, self-hosted (loaded by js/workbox-sw.js)
assets/
  fonts/                                        League Spartan + Poppins (full family download; see §9)
  icons/                                         app icons, favicons, ministry logos
  images/                                        eventos/ extras/ lideres/ misioneros/ salvacion/
.github/workflows/main.yml                      push-to-main → FTP deploy
```

**How pages relate.** Six shell pages (`index.html`, `nosotros.html`,
`salvacion.html`, `donativo.html`, `privacidad.html`, `settings.html`) share
the same navbar/tabbar markup (copy-pasted per page, not templated — there's
no include mechanism); the five public content pages also share the footer,
while PWA-only `settings.html` does not. `splash.html` and `offline.html`
intentionally omit all fixed shell chrome. The shell pages use the same boot
sequence: `config/config.js` → (optional OneSignal SDK) →
`js/components/push.js` → page-specific scripts → `js/utils/analytics.js` →
`js/main.js` → (optional) `gsap` + `ScrollTrigger` +
`js/components/animations.js` → carousel/page-specific scripts.
Before that deferred sequence, each shell page and `splash.html` loads the
small synchronous `js/pwa-launch.js` bootstrap. In browser mode it is a
no-op. In standalone mode it uses a `sessionStorage` marker to route an
unexpected first page through `splash.html` before paint; `splash.html`
sets the same marker so the redirect cannot loop. The manifest itself starts
at `splash.html`, so this script is a fallback for restored/deep install
contexts, not the primary launch mechanism.

`js/main.js`'s single `DOMContentLoaded` listener at the bottom of the file
is the closest thing this project has to an entry point — it calls 16 init
functions (theme, SW registration, PWA install prompt, nav highlighting,
share, forms, cookie banner, etc.) in a fixed order, then binds the three
theme-toggle buttons. **That order is the dependency graph, not style** —
e.g. `detectEnvironment()` must set `.is-pwa` on `<body>` before anything
reads it, and `applyConfigValues()` must run before `initWhatsAppLinks()`.

The file holds **64 top-level functions, 7 top-level `var`s and that one
listener**, grouped into 14 commented sections (§1 header → §2 environment,
§3 config, §4 theme, §5 `makeToast`, §6 SW, §7 install, §8 nav, §9
clipboard, §10 Web Share, §11 WhatsApp, §12 forms, §13 misc UI, §14 boot).
Every function is a hoisted declaration, so **where** a function is defined
says nothing about **when** it runs — only §14 decides that. Section
grouping is source organization; reordering §14 is a functional change.

**`js/components/youtube-api.js` is page-scoped despite its folder.** Only
`index.html` loads it; every DOM hook (`#live-stream`, `#live-video-block`,
`#live-kicker-text`, `#cd-*`) and all its CSS (`css/pages/index.css`) are
index-only. It contradicts the "2+ pages" rule above — **left where it is on
purpose**, since moving it would touch `index.html`, `sw.js:52` and this file
for no functional gain. Three things to know before editing it: (1) all
service-time math runs in `America/Monterrey` via `Intl.DateTimeFormat`,
never browser-local, and `zonedWallToUtc()` uses a **single-pass** UTC-offset
correction that is only valid because Monterrey observes no DST — repointing
`TIME_ZONE` at a DST zone introduces a silent 1-hour error twice a year;
(2) the polling stack (15-min interval, Sunday 10:50–13:40 window, viewport +
tab-visibility gating, stop-on-live-found) is **quota engineering, not
premature optimization** — the live check hits `/search` at 100 quota units
per call against a 10,000/day budget, while the latest-upload path uses
`/playlistItems` at 1 unit; removing any layer puts the quota in reach;
(3) it *emits* `data-track-*` and `data-share-*` on buttons it creates at
runtime, which is why the delegated listeners in `analytics.js`/`main.js` are
load-bearing here.

**Why `js/pages/nosotros.js` exists** (it looks like dead weight — it isn't).
16 physical lines, one `DOMContentLoaded` listener, three jobs, none of them
duplicated anywhere: (1) it sets `#contact-form`'s `action` from
`APP_CONFIG.appointments.formspreeEndpoint` — **the form has no `action` in
the HTML**, and `applyConfigValues()` structurally cannot supply one (it only
writes `href` and `textContent`). Delete this file and `submitFormData()`
falls into its `if (!action)` branch: no POST to Formspree, no error, no
visible symptom — the contact form silently stops delivering mail. (2) It is
the **only** listener in the repo for the `form-success` `CustomEvent` that
`main.js` dispatches after a successful POST — that event exists precisely so
page scripts can supply their own success UX. (3) It owns the form →
`#contact-success` swap and scroll-into-view; `#contact-success` appears only
in `nosotros.html` and its page CSS, so no shared file knows about it.
Precached at `sw.js:50`. Load order is safe by design: `main.js` (line 50)
attaches the submit handler before `nosotros.js` (line 56) sets the
`action`, but `submitFormData()` reads `action` at submit time, not init time.

**How config is centralized.** `config/config.js` defines one object,
`APP_CONFIG` (brand color, contact info, social links, API keys, feature
IDs — see file for the full shape). Two declarative HTML attributes read
from it at runtime via `applyConfigValues()` in `main.js`:
- `data-config-text="path.to.key"` → sets `el.textContent`
- `data-config-href="path.to.key"` → sets `el.href` (with `mailto:`/`tel:`
  special-casing for `email`/`phone1`/`phone2`)

Dotted paths (`externalLink1.label`) resolve into nested objects. This is
how the footer's contact/social/link block, the "Ubicación" address, and
settings.html's app name/version are populated identically across every
page from one source.

## 4. Tech stack (verified versions)

| Layer | Library | Version | Delivery |
|---|---|---|---|
| CSS framework | Bootstrap | 5.3.8 | CDN (jsDelivr, SRI-pinned) |
| Carousel | Swiper | 12.2.0 | CDN (jsDelivr, SRI-pinned) |
| Icons | Font Awesome Free | 7.3.0 | CDN (jsDelivr, SRI-pinned) |
| Animation | GSAP core | 3.15.0 | Self-hosted (`gsap-public/minified/gsap.min.js`) |
| Animation | GSAP ScrollTrigger | 3.15.0 | Self-hosted, **loaded** |
| Animation | GSAP Flip, TextPlugin | 3.15.0 | Self-hosted, **present but not loaded by any page** (see §9) |
| Maps | Leaflet | 1.9.4 (+v1.d15112c build) | Self-hosted (`leaflet/dist/`), `nosotros.html` only |
| Map tiles | CARTO Basemaps (Voyager/Dark Matter) | — | Runtime fetch, no key, theme-reactive |
| Push notifications | OneSignal Web SDK | v16 | CDN (`cdn.onesignal.com`) |
| Confetti | canvas-confetti | 1.9.4 | CDN (jsDelivr, SRI-pinned), `salvacion.html` only |
| Offline/caching | Workbox | 7.4.1 | Self-hosted loader (`js/workbox-sw.js`) + self-hosted submodules (`workbox/`) |
| Analytics | Google Analytics 4 (gtag.js) | — | CDN, loaded dynamically post cookie-consent |
| Fonts | League Spartan, Poppins | — | Self-hosted woff2/ttf, `@font-face` in `css/main.css` |
| Forms backend | Formspree | — | `nosotros.html` contact form only |
| CI/CD | SamKirkland/FTP-Deploy-Action | v4.3.4 | GitHub Actions |

No package manager, no `package.json`, no lockfile — versions above are
read directly from each vendor file's header comment or CDN URL, not
assumed.

## 5. Features that exist and work today

- **Marketing/info pages**: home (hero, event carousel, YouTube live-stream
  widget with countdown), about (mission/vision/values, church history,
  world-missions map, staff/ministry carousel, embedded Google Map,
  contact form), salvation (illustrated scroll timeline + "sinner's prayer"
  modal with confetti), donation (bank account details with copy-to-clipboard),
  privacy notice (accordion, Mexican ARCO-rights compliant).
- **PWA**: installable (custom install prompt via `beforeinstallprompt` +
  a hand-built iOS "Add to Home Screen" walkthrough modal since iOS doesn't
  fire that event), offline fallback page, light/dark theme with
  system-preference detection and manual override, persisted across a
  `localStorage` key and reflected in three separate UI surfaces (settings
  page, desktop navbar dropdown, mobile menu).
- **Push notifications** via OneSignal, with a permission-etiquette pattern:
  the opt-in prompt only arms after the app is installed (standalone mode)
  and fires on the visitor's *next tap*, not immediately.
- **Live YouTube integration**: polls the YouTube Data API for a live
  broadcast during a padded Sunday-service window (timezone-correct via
  `Intl.DateTimeFormat`, not the browser's local zone), falls back to the
  channel's latest upload otherwise, with session-cached results and
  viewport-gated polling (only active while the widget is actually visible).
- **Web Share** with a real fallback chain: native `navigator.share` (with
  best-effort image attachment) → clipboard copy with a "share to WhatsApp"
  action → `window.prompt` as a last resort — plus dedicated share-target
  URLs (WhatsApp/Telegram/Facebook/X/LinkedIn/email) if the user picks one
  from the fallback toast.
- **Consent-gated analytics**: GA4 does not load at all until consent is
  given. `window.gtag` and `window.dataLayer` are created **only** inside
  `startAnalytics()` (`analytics.js`) — there is no GA/GTM snippet in any
  `<head>` — and `trackEvent()`/`trackPageView()` no-op without `window.gtag`,
  so no hit is sent or even queued before consent. `startAnalytics()` has
  **two** entry points, not one: `analytics.js`'s own `DOMContentLoaded`
  listener when `cookieConsent === 'accepted'` is already stored (the common
  case — every repeat visit, bypassing the banner entirely), and
  `main.js`'s `initCookieBanner()` → `dismiss()` on first acceptance.
  Tracking itself is overwhelmingly **direct JS calls, not attributes**:
  16 call sites (`trackEvent` ×11 in `main.js`, ×1 each in `youtube-api.js`
  and `salvacion.js`; `trackFormSubmit` ×3 in `main.js`) versus **three**
  elements carrying `data-track-action`: `privacidad.html:312`,
  `salvacion.html:327`, and the subscribe button that `youtube-api.js:238`
  **creates at runtime** (`subscribe_click`) — that third one is invisible to
  a static grep of the HTML, so don't trust an HTML-only count here. The
  `data-track-*` path is still the exception, not the driver — see the
  `data-*` vocabulary list below.
- **Missionary world map** (Leaflet): hand-rolled proximity clustering,
  custom popups, continent quick-filter buttons, and a tile layer that
  swaps between light/dark CARTO basemaps reactively via a
  `MutationObserver` on `<html data-theme>`. Initial view is device-aware:
  desktop/tablet (`min-width: 768px`) still `fitBounds()`s every missionary
  pin ("mapa completo"); phones instead open on a fixed Latin-America
  bounding box (`LATAM_BOUNDS` in `missionaries-map.js`) so the map isn't
  zoomed out to the point of showing empty ocean. `minZoom: 2` on the
  `L.map(...)` call prevents Leaflet from ever zooming out far enough to
  letterbox the container (at zoom 0 the world tile is only 256px tall —
  shorter than the map container — leaving blank bands top/bottom; verified
  in a headless browser before fixing). The `.leaflet-control-attribution`
  badge is hidden (`display: none !important` in `nosotros.css`) — a
  deliberate departure from OpenStreetMap/CARTO's tile usage terms, which
  ask for visible attribution; revisit if that becomes a problem.
- **Update flow**: the service worker and the page negotiate a version
  handshake (`postMessage` `GET_VERSION`/`SKIP_WAITING`) so the user sees a
  "New version available → Update" toast instead of a silent/forced reload.

## 6. Conventions actually observed in this code

These are descriptive (what the code does), not prescriptive — follow them
when editing, since the codebase is consistent about them even though
nothing enforces them:

- **Global scope, `<script defer>` order as the module system.** Most files
  declare top-level `function`/`var` directly in global scope (`main.js`,
  `animations.js`, `missionaries-map.js`). A few instead wrap everything in
  a `DOMContentLoaded` closure so internals stay private (`push.js`,
  `youtube-api.js`, `carousel.js`). Both patterns coexist; there's no hard
  rule, but newer/smaller files lean toward the closure form.
- **Leading underscore = "private" helper.** Functions not meant to be
  called from outside their file are prefixed `_` (`_updateThemeIcon`,
  `_groupByLocation`, `_isNewerVersion`, …). This is the only visibility
  signal available without modules — it's a naming convention, not enforced.
  Shared cross-file helpers stay unprefixed: `isStandaloneMode()` lives in
  `main.js` and is intentionally called by `push.js` as well as `main.js`.
- **`!0` / `!1` instead of `true` / `false`.** Used consistently for boolean
  literals across almost every hand-written JS file (`main.js`,
  `animations.js`, `carousel.js`, `missionaries-map.js`, `push.js`,
  `analytics.js`, `salvacion.js`). Match it when editing these files rather
  than "fixing" it to `true`/`false` — it's the house style, not a mistake.
- **`var` is dominant; `salvacion.js` is the one file using `const`/`let`.**
  Not a hard rule, just what's there today.
- **HTML `data-*` attributes as a delegation/behavior API.** This is the
  single most important convention in the codebase: interactivity is wired
  through attributes read by a small number of centrally-delegated
  listeners, not inline `onclick` or per-element `addEventListener` calls.
  The vocabulary in active use:
  - `data-gsap="fade-up|fade-left|fade-right|scale-up|stagger-children"` — scroll-reveal animation (animations.js)
  - `data-config-text` / `data-config-href` — value injection from `APP_CONFIG` (main.js)
  - `data-share-title` / `-text` / `-url` / `-image` — Web Share payload (main.js)
  - `data-action="open-whatsapp"` — WhatsApp link population (main.js)
  - `data-copy="…"` — copy-to-clipboard (main.js)
  - `data-track-category` / `-action` / `-label` — GA4 event tracking (analytics.js).
    **Barely used**: 2 elements in the HTML (`privacidad.html:312`,
    `salvacion.html:327`) plus one created at runtime by `youtube-api.js:238`.
    Most tracking is direct `trackEvent()` calls from
    JS. `salvacion.html:327` also carries `data-share-title`, and
    `initShareDelegation()` calls `e.stopPropagation()` on it — tracking still
    fires, because both listeners sit on `document` and `stopPropagation()`
    doesn't cancel sibling listeners on the same node. See `analytics.js` §4.
  - `data-img-fallback` — broken-image fallback swap (main.js)
  - `data-page` (on `<body>`) / `data-page-link` (on nav items) — active-nav-item highlighting (main.js)
  When adding a new interactive element that fits one of these patterns,
  prefer adding the attribute over writing new bespoke JS.
  **Exception — the service-worker update toast is _not_ data-driven.** It is
  built entirely in JS by `makeToast()` (main.js §5) and its button is wired
  through the `opts.onAction` closure passed by `_showUpdateToast()` /
  `_markUpdateReady()` (§6). There is no `data-action` for it; don't look for
  one and don't add one without moving the whole toast to markup first. The
  only other JS-generated control in this family is the iOS install modal's
  close button, which does use `data-action="close-ios-install"` — matched by
  a listener scoped to that overlay, not by a document-level delegate.
- **CSS is BEM-flavored, not strict BEM.** `component-element` (single
  hyphen, e.g. `.card-event-title`) and `component--modifier` (double
  hyphen, e.g. `.card-app--padded`, `.content-wrapper--narrow`) are used
  consistently; there's no `block__element` middle tier.
- **Custom properties, not a preprocessor.** No Sass/Less/PostCSS anywhere —
  theming and tokens are native CSS custom properties (`:root { --color-brand: … }`),
  which is what makes "no build step" viable for a themed, tokenized design
  system at all.
- **Colors that get alpha-blended carry an RGB-triplet twin.** A color used
  at partial opacity has both a hex custom property (`--color-brand`) and a
  space-separated RGB triplet (`--color-brand-rgb: 0 192 246`), used as
  `rgb(var(--color-brand-rgb) / .12)`. This is how the codebase does
  "brand color at 12% opacity" without hardcoding a second color per use.
  It is **not** every themeable color: 6 of the 14 in `main.css`'s `:root`
  (`--color-brand-hover`, `--color-on-brand`, `--color-bg`,
  `--color-text-primary`, `--color-text-muted`, `--color-border`) are never
  blended and deliberately have no twin — don't add ones they don't need.
  When a twin does exist it sits immediately beside its hex, and the pair
  moves together. `--color-success-rgb` is currently unused (settings.css
  uses the plain hex) but is kept so the convention stays uniform.
- **Page-local one-off tokens are scoped, not global.** Values used by only
  one component define their own custom properties on that component's
  root instead of polluting `:root` — e.g. `#live-stream { --countdown-digit-size: 2rem; }`,
  `.salvacion-hero { --salv-hero-1: #D6F0FA; }`. Follow this instead of
  adding single-use variables to `main.css`'s `:root`.
- **A custom breakpoint scale layered on top of Bootstrap's.** Hand-written
  CSS uses `361px, 480px, 576px, 768px, 992px, 1024px, 1280px, 1920px` as
  `min-width` breakpoints. `main.css` itself uses 7 of those (everything but
  `480px`, which appears only in `nosotros.css`). **`640px` is not a CSS
  breakpoint at all** — it exists only as a Swiper `breakpoints` key inside
  `js/components/carousel.js`, so don't look for it in a stylesheet. The
  scale is denser than, and only partially overlapping
  with, Bootstrap's own grid breakpoints (576/768/992/1200/1400, which are
  still what drives `col-*`/`d-*-none` utility classes in the markup). The
  two scales serve different jobs (component sizing vs. grid/utility
  visibility) and don't conflict in practice, but a newcomer should know
  they're not the same scale.
- **Bootstrap is used for JS behavior and grid/utilities, not visuals.**
  Collapse (navbar), dropdown, modal, and accordion all come from
  Bootstrap's JS bundle, and the grid/utility classes (`d-flex`, `col-lg-5`,
  `gap-2`, …) are used extensively. But Bootstrap's own component *styling*
  (buttons, cards, navbar chrome) is almost entirely overridden — the site
  has its own button (`.btn-primary-pill`/`.btn-secondary-pill`), card
  (`.card-app`), and navbar look, defined in `main.css`.
- **Every `.container` inside `<main>` (and the footer's) uses the same
  outer shell as the floating navbar/tabbar, not Bootstrap's default
  breakpoints.** `--shell-safe-gutter` combines the normal `1rem` gutter
  with `env(safe-area-inset-left/right)`, and drives the navbar, tabbar and
  page containers together. The web shell is capped by `--shell-max`/
  `--shell-max-xl` (900px/1000px at `1024px`/`1920px`); standalone PWA
  content uses `--shell-max-pwa` (540px) to match the tabbar. Containers
  have no internal horizontal padding: the old combination of a reduced
  `max-width` plus padding under global `border-box` sizing subtracted the
  gutter twice, making visible content 40–56px narrower than the chrome.
  If you add a section wrapper, use plain `.container` and avoid a second
  structural max-width. The one exception is `.content-wrapper--narrow`,
  retained at 480px/700px as a centered reading measure for the salvación
  timeline's prose and Bible quotations, not as a competing page shell. It is
  defined in `css/main.css` (`.content-wrapper--narrow { max-width: 480px }`,
  bumped to `700px` at `@media (min-width:992px)`), **not** in
  `salvacion.css` — the salvación page only *applies* it via
  `class="timeline content-wrapper content-wrapper--narrow"` in the markup.
- **`#footer-web` and `.pg-hero` must not carry their own horizontal
  padding.** Both now set only `padding-top`/`padding-bottom`; their inner
  `.container` supplies the complete shared shell width and safe gutter.
  Adding side padding to either outer element would create a second inset
  and break alignment at every breakpoint.

## 7. Non-obvious decisions a newcomer would otherwise reverse-engineer

- **`main.css` isn't split, and that's an explicit, historical decision.**
  Early history (Jan 2026) had `styles/variables.css`, `global.css`,
  `responsive-fixes.css`, `social-icons.css` as separate files; commit
  `b43bdba` ("Unificación de archivos CSS en Main CSS") deliberately merged
  them. `main.css` today is genuinely the site's shared design system —
  tokens *and* a component library (buttons, cards, icon-boxes, nav/tabbar,
  footer, the `.pg-hero` internal-page-hero pattern reused on 4 pages,
  hint affordances) — used identically across most pages. `css/pages/*.css`
  only holds what's actually page-unique. Splitting `main.css` further
  would mean duplicating shared component rules across page files with no
  build step to de-duplicate them again. `css/components/carousel.css` owns
  the complete carousel mechanism, including `.carousel-clip` and the
  `.card-ministerio-*` family; cross-page row affordances belong in
  `main.css` through `.interactive-row-chevron` and its existing-class
  aliases.
- **Dual navigation, toggled by one CSS class.** Browser visitors get a
  floating top navbar (`#navbar-web`) and a full footer. Installed-PWA
  visitors get neither — `body.is-pwa` (set by `detectEnvironment()` in
  `main.js`, using the shared `isStandaloneMode()` predicate) hides both via
  `main.css` (`body.is-pwa #navbar-web, #footer-web { display: none }`)
  and shows a native-app-style bottom tab bar (`#tabbar-pwa`) instead. It's
  effectively two different layouts sharing one HTML document, switched
  entirely by a body class. `initPersistentStorage()` and `push.js`'s
  `initAutoPrompt()` use the same helper instead of repeating the predicate.
- **`settings.html` is PWA-only, enforced twice.** A blocking inline
  `<script>` in its own `<head>` (`window.location.replace('index.html')`
  if not standalone) prevents any flash of content when the page is hit
  directly in a browser; `detectEnvironment()` in `main.js` does the same
  check again later through `isStandaloneMode()`, after `DOMContentLoaded`.
  Both are real — the inline one is what actually prevents flash-of-content,
  the deferred one is a fallback. `robots.txt` also disallows indexing it.
- **The remaining inline code is deliberate.** Every page's small theme
  bootstrap stays synchronous and inline after charset/viewport but before
  styles/body content; externalizing it would add a render-blocking cold
  request and a new failure path to anti-flash code. `settings.html`'s guard
  stays inline for the same pre-paint reason. `index.html`'s JSON-LD is
  non-executable page data, and `offline.html` keeps its page-only CSS and
  retry/reconnect script inline so the precached fallback is self-contained.
  Do not pursue an "inline-free head" without a new requirement that
  outweighs those timing and offline-reliability costs.
- **`splash.html` is the single installed-app launch entry.**
  `manifest.json` keeps the stable `id: "./"` and `scope: "./"` but now uses
  `start_url: "splash.html"`, so installation from any content page and a
  normal installed-app launch begin at Splash rather than inheriting the
  page where installation happened. The synchronous `js/pwa-launch.js`
  bootstrap provides a pre-paint fallback when a standalone browser restores
  another shell page: it marks the browsing session, redirects with
  `window.location.replace('splash.html')`, and becomes a no-op for the rest
  of that session. Browser-mode pages never redirect. Splash completion also
  uses `location.replace('index.html')`, so Splash never remains in history.
  `_restartApp()` enters the same path only after the initiating tab receives
  a real service-worker `controllerchange`; other tabs receive an
  "Abrir inicio" action instead of redirecting automatically. The existing
  4.5s failsafe, reduced-motion path, GSAP animation and branding are
  unchanged.
- **Two motion-token systems, not one.** `main.css`'s `:root` defines a CSS
  motion scale (`--motion-instant/fast/base/emphasized`, `--ease-standard`,
  `--ease-spring`) for hover/theme/state-driven CSS `transition`s. A
  separate JS `ANIM` object at the top of `animations.js` (durations
  0.2–1.6s, `'power3.out'`/`'back.out(1.4)'`/`'power2.inOut'` eases) drives
  every GSAP timeline. They follow the same philosophy (small named scale,
  a "standard" and a "spring" ease) but are not the same values and aren't
  shared — CSS transitions and GSAP timelines have no natural way to share
  a token source without a build step. If you're touching motion, decide
  which layer you're in and use that layer's tokens.
- **The YouTube Data API key is intentionally public.** `config/config.js`
  ships `youtubeApiKey` in a file served to every visitor. There is no
  backend to hide it behind — this is a direct consequence of §2. It must
  rely on Google Cloud Console referrer/quota restrictions, not secrecy.
  The Google Maps embed on `nosotros.html`, by contrast, needs no key at
  all (it's the keyless `maps/embed?pb=…` share-embed format).
- **Content data lives inside JS, not config or a CMS.** The 9-family
  missionary dataset (`MISSIONARIES` array in `missionaries-map.js`) is
  hardcoded in the component file itself, not in `config.js` or a JSON
  file. To add/remove a missionary family, edit that array directly.
- **`index.html`'s home hero (`#hero-content`) participates in the shared
  shell.** The parallax background remains full-bleed, while the foreground
  content carries `.container` and therefore aligns with the navbar on every
  breakpoint. Hero-specific CSS owns only vertical spacing and text
  alignment; it must not reintroduce a bespoke horizontal max-width or
  padding.
- **Every toggle's "on" color is `--color-brand`, not a semantically-themed
  color, except notifications.** `.theme-sw`, `.wa-sw` (the WhatsApp
  floating-button toggle in `settings.html`) and any future on/off switch
  in `settings.html` use `var(--color-brand)` for their active state — the
  WhatsApp toggle used to use `--color-whatsapp` (WhatsApp's own brand
  green) instead, which broke the pattern; it's now `--color-brand` like
  every other switch. `.notif-sw` is the one deliberate exception: it uses
  `--color-success` (green) for "granted" and a dimmed danger red for
  "denied", because it's reporting a real OS permission state, not a
  simple app preference — don't generalize that exception to other
  toggles.

## 8. The motion/animation system

This project has a genuinely coherent, deliberately-designed motion system —
not scattered ad hoc animation calls — and it's worth documenting at some
depth because of that.

**One shared token object.** Every GSAP call in `animations.js` pulls from
a single `ANIM` constant at the top of the file: named durations
(`duration`, `durationFast`, `durationSlow`, `durationSplash`, `durationExit`),
three eases (`ease: 'power3.out'`, `easeSpring: 'back.out(1.4)'`,
`easeInOut: 'power2.inOut'`), and named offsets (`y`, `ySm`, `yHero`,
`xSlide`, `xNudge`, `scaleIn`, `scaleExit`). The one place
this is *not* used is deliberate and explicitly commented: the navbar's
`-80`/`-100`px show/hide offsets and its `'top -80px'` ScrollTrigger
threshold are geometry (the navbar's own height), not motion design, and
the code says so inline rather than smuggling a layout number into the
motion scale.

**Reduced motion is checked in many places, and `animations.js` alone has
three of them.** The main gate is `initAnimations()`: it checks
`prefers-reduced-motion: reduce` once and, if set, snaps every `[data-gsap]`
element to its resting state and returns without registering any GSAP
animation at all. That gate does **not** cover the whole file, though —
`initHintAnimations()` and `initSplashAnimation()` are called straight from
the boot listener rather than through `initAnimations()`, so each carries its
own independent check (hint suppression; splash timeline swapped for a 400 ms
redirect). All three are load-bearing; none is redundant. Move either
function inside `initAnimations()` and its check becomes dead — but until
then, removing it would break reduced motion for that surface. Beyond this
file, nearly every other animated surface in the app independently
re-checks the same media query for its *own* effect: the Swiper carousels
handle it in two complementary places — `carousel.js` drops Swiper's
`speed` to 0 (killing Swiper's own slide-translate motion), while
`css/components/carousel.css` carries its own `@media (prefers-reduced-motion:
reduce)` block that neutralizes the CSS-level slide opacity-fade transition;
the two cover different animations and both are needed — the Leaflet map disables its built-in
zoom/fade/marker animations, the countdown digits skip their "tick" pulse,
the hint affordances (scroll/carousel/map nudges) don't arm at all, the
splash screen swaps its full GSAP timeline for a flat 400ms delay, and
`main.css` backs this up with a matching `@media (prefers-reduced-motion: reduce)`
block that neutralizes essentially every `@keyframes` animation and
CSS-level GSAP-adjacent transition in the stylesheet. This is a real,
consistently-applied cross-cutting concern, not a single accessibility
checkbox.

**A declarative activation API for the common case.** Most scroll-reveal
animation is opt-in via `data-gsap="fade-up|fade-left|fade-right|scale-up|stagger-children"`
in the markup — HTML declares intent, `initScrollAnimations()` supplies the
implementation via `gsap.utils.toArray`. Two things instead activate
*automatically*, with no attribute needed, which is the one inconsistency
worth knowing about: every `.section-heading` gets an entrance animation,
and every `h1`–`h4` inside `<main>` gets a per-word split-and-reveal
animation (guarded against hero sections, headings that already contain
interactive children, and elements already processed).

**Bespoke timelines reuse the same tokens.** Beyond the declarative system:
a hero entrance timeline + parallax `scrub` (index), a near-identical hero
timeline for `salvacion.html`, a card-stacking scroll effect for the
salvación timeline (see below), a once-per-`sessionStorage` navbar drop-in, and a GSAP-choreographed
Bootstrap modal open/close that intercepts `hide.bs.modal` with
`preventDefault()`, plays an exit tween, then re-invokes Bootstrap's own
`.hide()` inside the tween's `onComplete` (guarded by a `dataset.closing`
flag to avoid re-triggering itself).

**Two files animate the salvación timeline, and they share elements.**
`initSalvacionTimeline()` (`animations.js` §6) creates a non-pinning reveal
`ScrollTrigger` per `.timeline-item` (animating `y`); `initSalvacionStack()`
(`salvacion.js` §2) creates a pinning, scrubbed one per item (animating
`scale`/`rotationX`). Different properties, so no GSAP overwrite conflict,
and no observed defect — but neither sets `refreshPriority`, and pinning
changes the layout that the other triggers already measured. Creation order
is decided purely by the `<script>` order in `salvacion.html`
(`animations.js` 50 before `salvacion.js` 52). If either effect starts
mis-measuring its scroll positions, look at both together. Commented at both
ends; recorded here because it's shared state across two files that nothing
else makes visible.

**The salvación card stack** (`js/pages/salvacion.js` §2) is the one bespoke
effect that does **not** follow the shared-token rule — it hardcodes every
value. Mechanism: with 6 `.timeline-item`s it creates **5 independent
`ScrollTrigger`s**, one per non-final card, each `pin: wrapper`,
`pinSpacing: !1`, `scrub: !0`, `invalidateOnRefresh: !0`, all sharing the
*last* card as `endTrigger`, animating `scale: 0.9 + 0.025*i` and
`rotationX: -10` from `transformOrigin: 'top center'`. They are not two
triggers cooperating on one visual — each card pins itself and they pile up
because they all end on the same closer element. Two couplings to know:
the 3D only reads as 3D because of the perspective on `.timeline-item` in
`css/pages/salvacion.css`, which is set via a scoped custom-property token —
`.timeline { --salv-stack-perspective: 1200px }` consumed by
`.timeline-item { perspective: var(--salv-stack-perspective) }`, resolving to
`1200px` (remove it or change the value and the effect silently flattens),
and `salvacion.js` never calls `gsap.registerPlugin(ScrollTrigger)` — it
depends on `animations.js` running first, which holds only because of the
`<script>` order in `salvacion.html`. Reorder those tags and the stack dies
with no error. The bail-out guards (no GSAP, no `.timeline`, reduced motion,
<2 cards, tallest card taller than the viewport) all fall back to plain
scrolling.

**Net assessment**: treat `ANIM` in `animations.js` and the motion custom
properties in `main.css` as the two token sources to extend, not places to
hardcode a new duration/ease into (with `salvacion.js` as the documented
exception above). Treat `prefers-reduced-motion` handling
as mandatory for any new animated feature — the existing code checks it at
every single animation site, not once globally.

## 9. Production status and open items

This is the consolidated maintenance list. Items are either explicitly
closed below or remain open here; do not infer closure from a source
reorganization or a successful static check.

### Closed and re-verified

- **All nine hand-written JS files in the rewrite series are structurally
  complete:** `main.js`, `analytics.js`, `salvacion.js`,
  `nosotros.js`, `youtube-api.js`, `missionaries-map.js`, `push.js`,
  `carousel.js`, and `animations.js`. They pass `node --check` and have
  no debug logging, TODO/FIXME markers, or commented-out executable code.
- **`ANIM.stackScale` is removed.** The current `ANIM` object has 20 live
  tokens. The Salvación card stack intentionally owns its scale values in
  `js/pages/salvacion.js`.
- **Workbox's local module path is complete.** `sw.js` points at
  `workbox/`, and all six Workbox 7.4.1 production modules it loads exist.
- **The three install-breaking stale precache entries are removed:**
  `assets/icons/icon-192-maskable.png`,
  `assets/screenshots/mobile.webp`, and
  `assets/screenshots/desktop.webp`. The current precache has 48 entries,
  all of which exist on disk and fetched successfully in a localhost
  service-worker install.
- **The approved shared-CSS corrections remain present.** The Settings
  chevron hover is limited to anchor rows, `.btn-copy:hover` has sufficient
  theme-selector specificity, `.footer-panel` is gone, the five duplicate
  `main.css` blocks remain consolidated, and the ministry name/role rules
  live together only in `css/components/carousel.css`.
- **The five completed CSS organization passes are**
  `css/main.css`, `css/pages/nosotros.css`, `css/pages/index.css`,
  `css/pages/salvacion.css`, and `css/components/carousel.css`.
  Browser smoke checks found no horizontal overflow or collapsed content at
  desktop and phone widths.

### Live production/device verification still required

- [ ] On `https://www.ibmty.com`, confirm `sw.js` installs, activates,
      controls a page, populates the precache, detects a newer version, and
      completes the `SKIP_WAITING` / `controllerchange` update flow.
      Localhost installation now succeeds, but production hosting and an
      already-installed client are distinct states.
- [ ] Confirm OneSignal subscription and real notification delivery on at
      least one supported desktop browser and an installed iOS/iPadOS PWA.
      `js/OneSignalSDK.sw.js` is present and must be included in deployment.
- [ ] Confirm whether OneSignal v16 currently emits Declarative Web Push
      payloads; that is a provider/backend fact, not statically knowable from
      this repository.
- [ ] On a current notched/Dynamic-Island iPhone in standalone mode, check
      whether the full-height home hero needs
      `env(safe-area-inset-top)` with
      `apple-mobile-web-app-status-bar-style: black-translucent`.
- [ ] On the same hardware, verify the existing bottom safe-area treatment
      for the tab bar, floating action button, sheets, and page content.
- [ ] Check `offline.html` in landscape on a notched iPhone. Its local
      wrapper handles the bottom inset but not explicit left/right insets.

### Flagged, intentionally not fixed

- The remaining page stylesheets—`donativo.css`, `privacidad.css`,
  `settings.css`, and `splash.css`—passed basic load/composition checks
  but have not received the same full file-by-file rewrite audit.
- `.leaflet-control-attribution` is deliberately hidden. That conflicts
  with OpenStreetMap/CARTO's request for visible attribution and remains a
  product/legal policy decision.
- `youtube-api.js` is stored under `js/components/` even though only
  `index.html` loads it. Moving it would touch HTML and precache contracts
  for no runtime benefit.
- YouTube service-time conversion assumes `America/Monterrey` has no DST;
  `zonedWallToUtc()` must be redesigned before changing to a DST-observing
  timezone.
- Salvación has two ScrollTrigger systems touching the same timeline cards.
  They animate different properties and currently work, but script order and
  refresh measurement are coupled; investigate both if scroll positions
  drift.
- GSAP Flip and TextPlugin are vendored but unused. The font folders also
  contain unreferenced family weights and italics. Both are deploy-size
  cleanup opportunities, not runtime defects.
- The iOS install modal and cookie banner use static `innerHTML` templates
  while most dynamic UI uses `createElement`/`textContent`. No user input
  is interpolated, so this is a style inconsistency rather than an XSS bug.
- `gaEnabled: !0` is cosmetically different from the surrounding config
  literals but matches the hand-written JS boolean style.
- The optional `.media-cover` utility and cosmetic naming cleanup remain
  deferred. Do not mix them into behavior work without an explicit scope.
- The manifest intentionally omits optional install `screenshots`; the old
  screenshot assets no longer exist.
- There is no package manager, linter, build, or automated test suite. The
  durable release gate is syntax checking plus local browser/service-worker
  smoke testing and the production/device checks above.

## 10. Recent trajectory (for context, not action)

The current `js/`/`css/`/`sw.js` structure is comparatively young: commit
`c3813b6` ("v7.0.0: reestructurar la PWA y mejorar la navegación",
2026-06-23) was a from-scratch reorganization that deleted a flatter
`context/` + `styles/` + root `service-worker.js` layout (with per-concern
files like `YouTubeManager.js`, `carousel-manager.js`, `parallax.js`) and
introduced the current one, added `js/pages/`, `settings.html`, `splash.html`,
Workbox, and OneSignal-via-Workbox. That same commit also deleted a
standalone `ministerios.html` page and folded its content into `nosotros.html`'s
"Líderes y Ministerios" carousel — which is why that page and its CSS file
are the largest public-page pair. Before that, the project's history is mostly
incremental fixes (OneSignal integration iterated on ~5 times early on,
WebP image conversion, CSS unification — see §7).

The historical commit is context, not the runtime version source. The
current release identity comes from the matching `7.0.0` constants in
`config/config.js` and `sw.js`; do not infer it from a branch name, tag, or
working-tree status.

## 11. Workflow for future maintainers and assistants

- Read this file and `README.md` before editing. Preserve the no-build,
  static-deploy architecture and the existing file ownership boundaries.
- Prefer the repository's code-graph tooling for symbol discovery and call
  tracing when it is available. Use text search for literal strings,
  selectors, URLs, and non-code files.
- Treat each page's stylesheet and `<script defer>` order as a contract.
  Moving a function or selector between files may require synchronized HTML
  and `sw.js` precache changes.
- Do not change `APP_SW_VERSION` or `APP_CONFIG.appVersion` independently.
  Both are currently `7.0.0`; a mismatch changes update-prompt behavior.
- For hand-written JS changes, run `node --check` on every affected file.
  For CSS or markup changes, serve the repo over localhost and verify the
  affected pages at desktop and phone widths.
- For service-worker changes, confirm every `PRECACHE_URLS` path exists and
  perform a real install/update smoke test. A syntactically valid worker can
  still fail installation on one missing precache response.
- Do not introduce package-manager, framework, build, or AI-tooling files as
  incidental cleanup. Such additions are architectural decisions and need
  their own explicit scope.
- Keep `CONTEXT.md` state-based. Record durable architecture, constraints,
  open items, and verification results; do not append conversational logs,
  transient Git status, or machine-specific plugin inventories.

## 12. WebKit & PWA Standards Reference

This section grounds this project's PWA implementation against the two
canonical, living sources for PWA platform behavior — captured from a direct
research pass against both sites' current content, not from training-data
memory of what they used to say (PWA/Safari support is one of the
fastest-moving areas of the web platform). Every claim below traces to a
specific page fetched during that pass (URLs inline); anything not backed by
a fetched page is explicitly marked as such.

**What each source is.** [webkit.org](https://webkit.org/) is WebKit's own
engineering blog and the primary place Apple/WebKit engineers document
Safari/iOS/iPadOS-specific web-platform behavior — new APIs, storage policy
changes, and (historically) the *only* place iOS-specific PWA quirks (Add to
Home Screen, safe-area insets, Web Push on iOS) get documented before they
show up piecemeal in third-party blog posts. Since this project ships a
`display: standalone` PWA with an iOS-specific install walkthrough and iOS
push support depends entirely on WebKit shipping it, WebKit's own posts are
the only trustworthy source for "does X actually work in Safari yet."
[web.dev's PWA hub](https://web.dev/explore/progressive-web-apps) is
Google's own current guidance for the manifest, installability, and
offline/service-worker patterns this project's `manifest.json` and `sw.js`
are built against (via Workbox, a Google project) — it's the Chromium-side
counterpart to WebKit's Safari-side documentation, and where the "generic
PWA best practice" half of this project's implementation should be checked.

### Alignment findings (by area)

**Manifest (`manifest.json`).** web.dev's
[install criteria](https://web.dev/articles/install-criteria) requires
`name`/`short_name`, `icons` at ≥192px and ≥512px, `start_url`, `display` in
`{fullscreen, standalone, minimal-ui, window-controls-overlay}`, and
`prefer_related_applications` absent-or-false; its
[manifest guide](https://web.dev/articles/add-manifest) additionally
recommends `background_color`, `theme_color`, `scope`, `id`, and a maskable
icon. This project's manifest has all of the required fields plus every
recommended one (`id: "./"`, `scope: "./"`, `background_color`,
`theme_color`, a dedicated `icon-512-maskable.png` with
`"purpose": "maskable"` alongside a separate non-maskable 512px icon — a
valid alternative to a single combined `"any maskable"` icon). **Aligned.**
The one thing web.dev mentions but this manifest omits is an optional
`screenshots` array (richer install UI) — not required, and `sw.js`'s §9
dead-precache-entry note already confirms no `screenshots/` assets exist to
reference. WebKit's own [Web Push post](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
confirms Safari reads the manifest `id` field to sync Focus-mode
notification settings across a user's devices — this project's `"id": "./"`
satisfies that. **Aligned.**

**Service worker (`sw.js`).** web.dev's
[offline fallback pattern](https://web.dev/articles/offline-fallback-page)
recommends: precache the offline page at install, use a network-first
strategy for document/navigation requests, and serve the cached offline
page only on failed navigations. `sw.js` does exactly this (Workbox
`NetworkFirst` on `request.destination === 'document'`, `offline.html`
precached, `setCatchHandler` returning `matchPrecache('offline.html')` on
navigation failure) — same strategy, implemented through Workbox's
abstraction rather than web.dev's raw `fetch` handler example. **Aligned.**
Background Sync (queuing failed writes for automatic retry) is not used
anywhere in `sw.js` — third-party compatibility trackers surfaced via web
search (caniuse; no WebKit primary-source page was found confirming or
denying this in Step 1, so treat this specific claim as **lower
confidence** than the WebKit-sourced findings above) indicate Safari has
never shipped the Background Sync API on any platform. Since this project
doesn't attempt to use it, there's no gap — but don't add a Background
Sync–dependent feature (e.g. "retry the Formspree contact form when back
online") assuming Chromium-only coverage without re-verifying Safari status
first. (The `sw.js` precache/OneSignal status changed in the `sw.js`
reorganization pass — the three stale precache entries were removed as
install-breaking, and `js/OneSignalSDK.sw.js` now exists so the SW-side
handler is present; production delivery still needs verification in §9.)

**CSS / safe-area insets (`css/main.css`).** WebKit's
[iPhone X post](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
specifies `viewport-fit=cover` (required for `env()` insets to take effect
at all) and recommends `max(<default-padding>, env(safe-area-inset-*))` so
content never sits flush against a notch/home-indicator on any device.
`index.html`'s (and every page's) `<meta name="viewport" ... viewport-fit=cover>`
is present, and every `env(safe-area-inset-bottom)` use in `main.css`
follows the exact `max(1rem, env(...))` pattern WebKit recommends (tabbar,
FAB, bottom sheets). **Aligned** for the bottom inset — the only one this
project currently needs for its bottom tab bar. Left/right insets are now
consolidated into `--shell-safe-gutter`, shared by the navbar, tabbar and
page containers. **Gap, needs live verification**: no `safe-area-inset-top`
usage exists anywhere in the codebase, while every page sets
`apple-mobile-web-app-status-bar-style: black-translucent` — which means
the status bar overlays page content instead of pushing it down. In
standalone mode on a notched device, the absence of a top inset remains a
candidate for clock/battery-icon overlap. Static reading can't confirm
whether this actually looks broken on a real device — flagged below for
live verification and intentionally not changed by the lateral shell fix.

**Push notifications (OneSignal + `js/components/push.js`).** WebKit's
[Web Push for iOS/iPadOS post](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
confirms Safari has supported the standards-based Push API + Notifications
API + Service Worker stack for standalone web apps since iOS/iPadOS 16.4
(Feb 2023), gated on `display: standalone`/`fullscreen` in the manifest
(satisfied here) and on the subscription prompt firing from direct user
interaction — which matches this project's documented "arms after install,
fires on next tap" pattern (§5). **This is the traditional flow, and it
requires the service worker to handle `push` events.** Per §9, `sw.js`'s
`importScripts('js/OneSignalSDK.sw.js')` is wrapped in a try/catch because
that file is optional — and it **now exists**, so the service-worker side
of push handling is present, not the no-op earlier notes described. That
closes the "SW half is inert"
gap on paper, but nothing here is confirmed live: it needs the same
DevTools → Application check as the install fix (does the SW register the
push handler and actually receive a notification). Separately, WebKit's
[Declarative Web Push post](https://webkit.org/blog/16535/meet-declarative-web-push/)
describes a newer, service-worker-optional push mechanism (iOS/iPadOS 18.4+,
macOS 15.5 beta at time of that post); whether OneSignal v16 sends
notifications in that declarative JSON format is **not determinable from
static code reading** and needs live verification (OneSignal's current
docs/dashboard, not this codebase).

**Installability signals (all 8 HTML documents).** web.dev's
[PWA checklist](https://web.dev/articles/pwa-checklist) and
[install criteria](https://web.dev/articles/install-criteria) call for a
linked manifest, a `theme-color`, and a served-over-HTTPS, responsive page;
WebKit's ecosystem (pre-iOS 26) additionally expects the
`apple-mobile-web-app-*` meta tags and an `apple-touch-icon` link, since
historically iOS didn't fully honor the standard manifest for the Home
Screen experience the way Chromium does. All eight documents—six shell
pages plus `splash.html` and `offline.html`—carry an identical, complete set:
`<link rel="manifest">`, `theme-color`, `mobile-web-app-capable` +
`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`,
`apple-mobile-web-app-title`, `apple-touch-icon`. **Aligned** — this is a
belt-and-suspenders setup that covers both the Chromium/manifest-driven path
and the legacy iOS meta-tag path in one identical block per page. One note
surfaced during Step 1 research, not yet reflected anywhere in this
codebase: WebKit's [WWDC25 Safari 26 post](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)
states that as of iOS 26, Home Screen additions default to opening as a
standalone web app even *without* a manifest at all — meaning the
`apple-mobile-web-app-*` tags are becoming belt-and-suspenders redundancy
rather than a strict requirement on the newest OS versions, not a reason to
remove them (older iOS versions still need them).

### Standing instruction for future AI assistants

**Before changing `manifest.json`, `sw.js`, push-notification code
(`js/components/push.js`, OneSignal config), or any WebKit/Safari-specific
CSS (safe-area insets, `viewport-fit`, `apple-mobile-web-app-*` behavior),
consult these two sources directly rather than relying on training
knowledge, which goes stale quickly in this specific area:**

- WebKit blog: <https://webkit.org/blog/> (browse recent posts; search for
  the specific API/behavior — e.g. "web push," "storage policy," "safe
  area")
- web.dev PWA hub: <https://web.dev/explore/progressive-web-apps>

PWA platform support (especially Safari/iOS push, storage, and
installability) changes across OS point releases, not just major versions —
a fact confirmed within this very research pass (Declarative Web Push
shipped in a `.4` point release, iOS 18.4). Re-check both sources rather
than trusting this section's snapshot once it's more than a few months old.

### Current verification list

The durable production/device action list is consolidated in §9. Keep that
single checklist current when platform guidance or live verification changes;
do not create a second copy in this standards reference.

## 13. Current maintenance baseline

- All eight HTML documents have completed semantic/accessibility review.
  Their critical inline theme bootstrap, Settings standalone guard, index
  JSON-LD, and Offline-only CSS/retry script are intentionally retained.
- The nine application JS rewrite passes are complete and syntax-clean.
  `js/pwa-launch.js` remains a separate synchronous pre-paint bootstrap.
- `sw.js` uses Workbox 7.4.1, a 48-path precache, an offline fallback, and
  a page/SW version handshake. `APP_SW_VERSION` and
  `APP_CONFIG.appVersion` both remain `7.0.0`; the Settings fallback text
  matches, and `manifest.json` intentionally has no version field.
- Installed launches begin at `splash.html`; browser navigation is
  unchanged. Splash and update completion use `location.replace()` so the
  transition page does not remain in Back history.
- Full CSS organization passes are complete for the five files named in §9.
  The other four page stylesheets are integration-smoke-tested but remain
  the next file-by-file CSS work.
- Production/device verification and every intentionally deferred item are
  consolidated in §9.

## Sources of truth, if this file goes stale

This document has no automated check keeping it in sync with the code.
When in doubt, prefer:
- `sw.js`'s precache array, `APP_SW_VERSION`, and
  `workbox.setConfig(...)` over summaries here
- each HTML page's `<head>` for the real script/style load order
- `config/config.js` for the current `APP_CONFIG` shape and application
  version
- the actual selectors/functions in `css/` and `js/` over line counts or
  prose descriptions
- `git log --all --oneline -20` for historical context only
- a production-domain browser/device test for every unchecked item in §9
