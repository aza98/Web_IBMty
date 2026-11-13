---
name: Iglesia Bautista de Monterrey
description: Una iglesia que piensa en ti (a church that thinks of you). Welcoming church site and installable app for members and visitors.
colors:
  brand-cyan: "#00c0f6"
  brand-cyan-strong: "#006e92"
  brand-cyan-tint: "#e8f8ff"
  brand-cyan-tint-strong: "#c8edfe"
  on-brand: "#ffffff"
  on-brand-ink: "#14110e"
  paper: "#fcfaf7"
  stone-surface: "#f6f1ec"
  stone-surface-deep: "#ede6de"
  ink: "#1c1915"
  text: "#342f2a"
  text-secondary: "#4c4741"
  text-muted: "#68625b"
  hairline: "#ded6cd"
  band: "#1c1915"
  band-deep: "#26221e"
  on-band: "#fcfaf7"
  on-band-muted: "#c4bcb4"
  clay: "#ab4a2b"
  clay-surface: "#fef1e8"
  success-strong: "#1e7546"
  danger: "#c9302d"
typography:
  display:
    fontFamily: "League Spartan, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.2vw + 1.4rem, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  numeral:
    fontFamily: "League Spartan, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 9vw + 1rem, 7.5rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "League Spartan, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 2vw + 1.2rem, 2.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "League Spartan, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1vw + 1.1rem, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.05
  lead:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 0.5vw + 0.95rem, 1.3125rem)"
    fontWeight: 400
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  label-compact:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  label-small:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
rounded:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  pill: "999px"
  circle: "50%"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "1rem"
  "4": "1.5rem"
  "5": "2.5rem"
  "6": "4rem"
  section: "clamp(3.5rem, 6vw + 1.5rem, 7rem)"
---

# Design — Iglesia Bautista de Monterrey

The frontmatter keeps the format Impeccable reads and the light-theme reference values.
Executable values for both themes live in [tokens.css](assets/css/core/tokens.css). Audience:
[PRODUCT.md](PRODUCT.md). Review criteria and sizes: [design review](docs/design-review.md).

## Identity

- «The line of the year»: answer what comes next before presenting the institution. The
  logo's diamond connects months, tabs, steps and markers; keep it as the shared motif,
  without arbitrary ornaments.
- League Spartan for headings and numbers; Poppins for reading and controls. Photos and
  posters provide content; never invent testimonials or figures.
- «Sky and earth» palette: brand cyan is the sky and the only bright color; warm «stone»
  neutrals are the ground; clay is the second voice, reserved for verses, quotes and dates.
  No navy.
- Cyan for brand, primary actions, focus and active states, never as decoration or a general
  glow. Strong cyan for text and links. Text on bright cyan uses `--color-on-brand-ink`
  (primary buttons included); the darker hover fill uses white.
- Two token layers in tokens.css: primitives (`--stone-*`, `--cyan-*`, `--clay-*`…), equal in
  both themes, and `--color-*` roles assigned per theme. Pages use roles; primitives only
  where a color must not follow the theme (theme previews, Leaflet popups, photos, `--ill-*`
  illustrations). The Salvation gift uses blues only: deep box with a white ribbon, light lid
  with a deep ribbon, and a white ribbon in dark so the bow does not vanish.
- Dark theme: warm graphite; surfaces rise in lightness and bands drop from the canvas towards
  a deep cyan. It is not the inversion of the light theme.
- Dark bands (`--gradient-band`, `--color-on-band*`, `--color-band-raised`,
  `--color-band-line`) in broadcast, visit, decision, thanks and footer. Inside them focus uses
  bright cyan (`--color-focus`). Band classes re-map the roles in `base.css`, so a component
  inside a band needs no override of its own.
- Heading leading comes from `--leading-display/-title/-heading` (tokens.css; `base.css` gives every `h1`–`h4` `--leading-heading` and the title classes raise it): tight on wide screens, looser below 576 px (1 / 1.1 / 1.15) because titles wrap there. Do not hard-code heading line-heights.
- Pill controls, rounded images, generous rhythm and bounded text. Mobile first: primary
  actions sit at the bottom of each section, card, form or modal for thumb reach.
- Shared measures: `--gutter` (16 px; 24 px from 768 px) for container, navigation pill, tab
  bar, notices and panel; `--radius-pill`, `--text-compact`, `--text-small`; `--fab-size`
  (56 px) for the floating buttons and every offset that stacks or clears them. The 1–3 px
  radii of small diamonds are shape detail, not part of the scale.
- Control borders (fields, switch, radios, carousel arrows, giving backgrounds) use
  `--color-control-border` (3:1 on each surface); `--color-border` is for separators.
- Pages with a hero (Settings included) stack content as sheets (`data-sheets` +
  `.sheet--*`); never cut the hero gradient abruptly. A sheet tucks under the section above by
  `--sheet-overlap` = `--sheet-radius` + `--sheet-lift` (72 px, read by `animations.js`), and
  that section holds the same bottom padding. Never overlap by the radius alone: the page
  background would show above the corners of a rising sheet.
- Shared pieces, one place each: `.page-hero` (`--art` for the side illustration,
  `sheets.css`); `.title-display`, `.title-lg`, `.verse`, `.step-node` (`layout.css`; a page
  lights a node with `--node-ink/-fill/-line`); `.slide-card` for event and ministry slides
  (`carousel.css`).
- Theme via `data-bs-theme`; installed mode via `data-display`. Never replace them with older
  selectors.

## Screens

| Screen | Main pattern | Specific CSS / JS |
| --- | --- | --- |
| [Inicio](index.html) | Photo hero, month line, events (`assets/data/events.json`), broadcast and Bible resources | `assets/css/pages/home.css`, `assets/js/pages/home.js` |
| [Nosotros](pages/about.html) | Tabs for philosophy, history, the missionary stage (map + one card, JSON), ministries, visit and contact | `assets/css/pages/about.css`, `assets/js/pages/about.js` |
| [Salvación](pages/salvation.html) | Diamond path, illustrations, decision and modal | `assets/css/pages/salvation.css`, `assets/js/pages/salvation.js` |
| [Donativos](pages/donate.html) | Choose a fund, copy details and prepare a transfer | `assets/css/pages/donate.css`, `assets/js/components/copy.js` |
| [Privacidad](pages/privacy.html) | Summary and notice with native panels | `assets/css/pages/privacy.css`, `assets/js/components/disclosure.js` |
| [Ajustes](app/settings.html) | Built from the site's own pieces: groups titled with the section diamond, elevated rounded cards (lifting off the stone sheet in light; the lighter surface in dark), a tinted icon tile per row, hairlines between rows, a muted note under each group, language as two pills (like the map chips), «Buscar actualizaciones» as a `.btn-app--outline` pill (full width on phones). Groups: appearance, language, push notifications, «Usar esta app» (browser only; two native disclosures whose `summary` is a `.settings-link` row with a chevron that turns when open, plus the contact link, in one `.settings-list`), links (RIBBI, El Saucillo, privacy: installed mode has no footer) and status. Hero and sheet rise as on every page, installed app included; desktop web uses two columns; target of the «Ajustes» tab | `assets/css/pages/settings.css`, `assets/js/pages/settings.js` |
| [Splash](app/splash.html) / [Offline](app/offline.html) | Entry / recovery. Splash follows the theme (light: hero surface; dark: night band); the gradient is a fixed canvas background on `body` with the end color (`--stone-100` light, `--color-band-deep` dark) as fallback, and `.splash` is `position: fixed; inset: 0`, so no seam shows above the bottom safe area. No «Entrar» link: the redirect (script plus meta refresh) is the only way in | Matching CSS and JS in `assets/*/pages/` |

Exact spacing, duration and size values live in the files; this document keeps intent and
contracts.

## Components and behavior

| Component | Contract to keep |
| --- | --- |
| Navigation | Top pill (phones: gear on the left, logo and name centered on the pill's true center, menu button on the right, in a three-cell grid; the closed bar's padding equals (nav height − 44 px) / 2 so opening the menu never shifts the controls; the menu icon is three CSS bars that turn into an X while open (`aria-expanded`); from 768 px brand left, links, gear right); tab bar only in installed mode, docked to the bottom edge (its background covers the safe area; `--tabbar-clearance` is what it takes; the last section of each page, not the `body`, reserves `--tabbar-reserve` = clearance + 8 px, which leaves a 24 px gap above the bar, so pages must not add their own section padding on top of it). In installed mode `theme-color` takes the page's `--color-status-bar` (the color of its top edge); accessible active state; every HTML copy is compared by `tools/verify.mjs`. Links, menu button and Bootstrap close use the same `--color-focus` ring (no blue Bootstrap ring). Nav pill, tab bar and gear panel use `--shadow-chrome` (a `--color-chrome-line` hairline ring plus the raised shadow, no layout change) and, in dark, a chrome fill one step above the canvas, so they stay distinct over same-tone sheets, cards and dark bands |
| Footer | Links are pills like the navigation links (hover and current page on `--color-band-raised`), text kept on the column edge. Bottom row: phones stack privacy link, copyright, «Hecho con amor»; from 768 px privacy link left, copyright centered, «Hecho con amor» right |
| Buttons | `.btn-app` and primary/outline/light variants (the outline turns light on bands through the re-mapped roles); `.btn-app--block` is full width on phones and natural from 576 px. Below 360 px the label is compact (`--text-compact`, 1 rem side padding) so labels stay on one line from 320 px; labels never break inside a word (`overflow-wrap: break-word` over the body's `anywhere`) and wrap only at enlarged text. Primary labels use ink on cyan, white on the darker hover fill. Two actions use `.btn-row`: they share the row while every label fits on one line (`flex-basis: max-content`), otherwise each takes its own full-width row; natural width from 576 px. Salvation's decision action spans the node column on phones. Preserve visible focus and readable labels in both languages. One filled (primary) action per section; secondary actions are outline or light. `.btn-app--icon` is the round icon-only button for Compartir and social links (visually hidden label or `aria-label`, plus `title`); every Compartir uses it, in a `.btn-row` it takes the row's button height. `.icon-btn` is the round 44 px button without a fill (navbar gear, panel close, prompt close); its component class adds only position, size of the glyph or tone. Information (times, values, statuses, notes) never takes a button's pill-and-border shape. |
| Configuration | `data-config`/`data-config-as` resolve values; an empty value hides its link (and its list item) so people never meet a control that cannot work; without JS the link stays `aria-disabled`. Every control hidden by configuration has a `data-config-pending` note (`.config-pending`, in `buttons.css`) naming the alternative. An unavailable form inside About's contact section omits the «Ver opciones de contacto» link to itself |
| Carousels | Swiper enhances a readable list and loops endlessly: a list shorter than 8 is repeated (copies keep no id; `data-share-id` gives the share link its hash) because Swiper's loop jumps over cards without spare slides; the counter, slide labels and month line (drawn by `carousel.js`, not Swiper's pagination) use the real position; each card ends in `.slide-card__actions` (`IBMty.shareActions`): one row of round `.btn-app--icon` buttons, «Compartir» first (label kept for screen readers) and then the profile links; only enlarged text wraps it; «Compartir» attaches the card's picture when the device can share files (event photo; ministry logo, or its `flyer` when it has one), followed by the 44 px round outline links to the profiles in the JSON `links`; home uses months as pagination; ministries show the position («3 de 9», `data-carousel-count`). Their slides are rendered from JSON before Swiper starts (`prepare()`); keep the fallback without the library |
| Tabs | Selected diamond and associated panel; keyboard with arrows/Home/End; without JS, panels in sequence |
| Map | Only About uses it, as the map half of the missionary stage (`components/map.js`). The HTML list (rendered from `missionaries.json`) feeds the markers in list order; the page owns the selection (`map:focus` in; `map:ready`, `map:select`, `map:unavailable` out). The selected marker leaves its cluster, grows and gets an ink ring; a dotted cyan arc runs from the Monterrey origin (ink diamond with a permanent «Monterrey» pill), longitudes kept within half a world of it so Sydney is reached across the Pacific, and each route is fitted clear of a floating `[data-map-cover]`. No popups and no chips: the card is the detail. Phones never drag the map with one finger (scrolling stays free); pinch, zoom pill and markers still work. Markers with a 32 px touch area (14 px diamond). Zoom is one vertical pill (44 px targets) at the bottom right from 1024 px and at the top right below it, clear of the floating buttons; attribution is its own pill at the bottom left without Leaflet's prefix, with the OpenStreetMap link given a larger hit area. Tiles that never load hide the map and return the plain list. Viewed tiles are cached (same setting as RIBBI) |
| Forms | When disabled or missing an endpoint, replace inputs with an availability message and contact route before collecting data. Configured forms keep labels, validation, error focus, input after failure and duplicate-send protection. Success only after HTTP acceptance. Updates defer while a form is edited or pending. |
| Copy | Copy numbers without spaces, confirm and keep a manual alternative. `data-copied` keeps the visual progress; displayed digits remain stable. Failed sharing exposes a selectable link inside the app and restores focus on dismissal. |
| Giving | Native radios and `:has` for selection; grouped digits with an accessible number; no payment processing. Each step head is a grid: node and title on one row, a note below (full width on phones, aligned with the title from 768 px). Copying the CLABE is the step's primary action (full width on phones); account number and holder copies are compact outline buttons |
| Privacy | One reading column (`--reading-max`) centered in the page, back-to-top button included; `details[data-disclosure]`, opening from a fragment and for printing; Expand/Collapse all as a JS enhancement |
| Prayer modal | Five explanatory steps and an unnumbered decision; prayer/welcome stages, focus and close. Welcome explicitly labels follow-up optional and offers Finish before any form. Configured follow-up requires consent and at least one contact. |
| Notices and settings | Review `components/notices.js` and `settings-panel.js` before changing opening, focus, installation or actions. Appearance and language mount the same way in the gear panel and in `[data-appearance]` / `[data-language]` of Settings: installed mode has no gear. Language rows reuse the theme options' check mark. The theme previews are a phone lock screen on phone widths and in the installed app, and a screen alone (window dots, no stand or phone details) on desktop web (≥768 px, not `data-display="standalone"`). The gear panel hangs from the nav pill on every width, is as tall as its content and shares the group look with the Ajustes page (diamond title, tinted tile, card, note). Notifications (`bindPush`) also live in the gear panel on the web. Both mounts consume the same `push-change` events, revalidated on opening and return from system settings. Activation/deactivation locks both controls; an unconfirmed subscription offers a keyboard-accessible retry. Only permission plus an active OneSignal subscription with ID and token turns the switch on. iPhone/iPad browser mode explains Home Screen installation. See `.impeccable/surfaces/settings.md` |
| WhatsApp and push buttons | Floating controls require their configured service; push also requires the push module. Consent appears only for configured analytics. A configured push bell appears only while the device can still subscribe (not on, blocked or unsupported) and the visitor has not declined the invitation on this device («Ahora no» retires it; Ajustes and the gear panel keep the switch); it opens its invitation on request and wears the chrome tone (`--color-chrome-bg`, `--shadow-chrome`, strong-cyan bell), never the primary cyan; refusing cookies never opens it automatically. Native permission alone is not a subscription. Floating controls yield to Settings, Privacy, focused content/forms, the open gear panel and short viewports. Installed users retain the WhatsApp visibility preference; contact routes remain in About and Settings help. Floating buttons, prompts and notices never print. |
| Broadcast band | Video first on phones, schedule/countdown second; two columns from 1024 px. The scheduled window says «Horario del servicio» and keeps the time visible. Only a fetched live result says «En vivo ahora»; cached live content says «Transmisión por confirmar». Keep the recording label and a direct channel link beside the video fallback, separate from Subscribe. Under the countdown one row holds «Abrir canal de YouTube» (the primary: watching comes first), «Suscríbete» (light) and Compartir as an icon. Share uses the selected destination. |
| Home and journeys | Primary hero action: «Ver en vivo» (members first, same destination as the «Transmisión en vivo» section); Nosotros opens with an «En esta página» index of underlined text links (not pills); Donativos says it is a bank transfer and names each step as an action |

- Fund selection works with CSS; copying and copy progress need JS. Never describe the whole
  transfer as JS-free.
- The installed tab bar keeps five direct destinations when labels fit. Below 22 root-font
  units of viewport width, its native Menu disclosure gives a single readable column;
  ResizeObserver keeps content clearance in sync. Theme and language radios use one tab stop
  and arrow-key selection in both mounts. Long labels and URLs wrap; prompts and notices
  scroll within the viewport. These safeguards still need device and zoom validation.
- About merges history and missions in one sheet («De Monterrey al mundo»): first the origin
  as its own block (title, 1988 with years since, text, photo; photo beside the text from
  1024 px), then the missionary stage, then the close (Marcos 16:15 and «Ofrendar para
  misiones», side by side from 768 px). The stage is one frame where the map and a single
  card share the selection, in departure order: map on top and card below on phones and
  tablets; from 1024 px the card floats as a panel over the map (photo 4:3 there, uncropped
  965×1080 beside the text on smaller widths). The card holds photo, destination, family,
  names, departure (clay) and years serving; its footer has the count («3 de 9», live), a
  line of diamonds (the lit one is in view; its own row in the desktop panel) and the
  carousel arrows. Arrows, a horizontal swipe on the card, arrow keys inside it and a tap on
  a marker all choose; every card shares one grid cell, so changing never moves the page.
  Without the map (no Leaflet, feature off, tiles failing) the same list reads as a
  timeline of rows (two columns from 768 px). Cards slide in from the side of travel; the
  global reduced-motion rule and an unanimated fit cover reduced motion. Failed or empty JSON loads explain their state; Home failures offer
  Retry. Settings includes installation, offline limits and contact help without a forced tour.

## Icons, images and motion

- Navbar DOM order equals its visual order: gear → brand → menu on phones, brand → page links
  → gear on desktop. `components/navigation.js` moves the same gear button at 768 px and keeps
  its focus; never use a positive tabindex.
- In the installed app, bottom clearance includes the visible floating button stack and
  shrinks when WhatsApp or push is hidden, so the last action scrolls fully above the
  buttons. Pages without floating controls keep the normal tab-bar clearance.
- The root reserves scrollbar space so full-bleed ornaments fit; the reservation is released
  while Bootstrap's modal is open, because Bootstrap adds its own compensation.
- Icons use the Font Awesome Free 7.3.1 web font:
  `<i class="fa-solid fa-house icon" aria-hidden="true"></i>`. Pages load only the icons in
  use ([icons.css](assets/css/core/icons.css)); a new icon needs its rule copied from
  `vendor/fontawesome/`, and `tools/verify.mjs` fails until it is there. `.icon` keeps a 1em
  box; size icons with `font-size`, not `width`/`height`. Decorative icons are `aria-hidden`;
  the control's text or `aria-label` names the action.
- Scene illustrations in `pages/salvation.html`, `pages/donate.html`, `pages/privacy.html`,
  `app/settings.html`, `app/offline.html`, `components/consent.js` and
  `components/push-offer.js` are multi-layer inline SVG themed through `--ill-*` and
  `--color-*` tokens; shared parts are the `.art__*` classes in
  [illustrations.css](assets/css/components/illustrations.css). Keep their meaning and
  accessible text.
- Keep photo and poster proportions and loading fallbacks. Never copy personal data from the
  lists into docs or fixtures.
- GSAP and ScrollTrigger add entrances, progress and illustrations. Prefer transform/opacity,
  respect reduced motion (one global rule in `base.css` cuts CSS motion; new components need
  nothing else), keep content readable when a library is missing and never let CSS and GSAP
  drive the same property. See [animations.js](assets/js/components/animations.js) and the
  page script; do not assume View Transitions.
- CSS transitions and entrance keyframes take their duration from the scale in
  [tokens.css](assets/css/core/tokens.css) (`--dur-fast` hover and press, `--dur-base` small
  moves, `--dur-slow` panels and colour shifts, `--dur-slower` the month marker) and their
  easing from `--ease-out`; a new component picks a step instead of a number. Endless loops
  (the live pulse, the spinner) and the splash sequence keep their own timing.
- Scroll motion runs inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`, so
  turning reduced motion on with the page open reverts it and shows everything. `[data-reveal]`
  in a sheet rises in when that element reaches the viewport (`ScrollTrigger.batch`; those
  arriving together stagger in reading order); in a hero it rises in on load. Every element in
  a group carries it, buttons included, or the unmarked one shows before the rest: the reveal
  switches the element's CSS transition off while it runs and clears it afterward, so a
  button's hover transition never fights GSAP's transform. Trigger points are measured again
  when `<main>` changes height. `will-change: transform` only on what scroll scrubs every frame
  (ornament diamonds, the Home hero photo).

## Maintenance

When a component changes, update its contract here and the screen brief in
`.impeccable/surfaces/` if the screen's intent changes. Apply the
[design review](docs/design-review.md) matrix and record evidence in
[status](docs/status.md). This document is not an approved visual review.
