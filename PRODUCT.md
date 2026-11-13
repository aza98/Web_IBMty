# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Members and visitors of Iglesia Bautista de Monterrey, including people unfamiliar with
the church or with digital tools. The website and installed PWA must support different
access needs, larger text, keyboard use and unreliable connections. Do not infer ability
or experience from age.

## Product Purpose

Website and installable app of the church. Make it easy to find the next activity, take
part in the service and reach information, salvation, giving and privacy.

## Positioning

«Una iglesia que piensa en ti» (a church that thinks of you). Everything the church does is
presented as guided by the Word of God.

## Operating Context

- Sunday service at 11:00, `America/Monterrey` time zone; schedule configurable in
  `assets/js/core/config.js`.
- YouTube broadcasts; links to the church's organization on YouVersion and the RVR1960 Bible.
- Events with their own posters, in `assets/data/events.json`; do not keep a duplicate
  calendar in this document.

## Capabilities and Constraints

- Main pages: Inicio, Nosotros, Salvación, Donativos and Privacidad. PWA: splash, offline
  and settings. See [status](docs/status.md).
- Classic HTML/CSS/JS and local dependencies; no build or own backend.
- Spanish content (`es-MX`) with an English overlay, mobile design and offline fallbacks.
  Forms, video and remote maps need a connection and configuration.

## Brand Commitments

IBMty; logo in `assets/icons/app/logo.svg`, cyan identity, League Spartan for headings and
Poppins for text. See [design](DESIGN.md) and the
[contrast criteria](docs/design-review.md#contraste-de-botones-primarios).

## Evidence on Hand

Existing photos, posters, logos and QR codes in `assets/images/`; do not invent
testimonials, attendance figures, personal data or event dates. Editorial permissions must
be confirmed when adding material.

## Product Principles

1. Useful from the first visit: find the next activity, service, location or contact route
   without installing the app or enabling optional services.
2. The Sunday broadcast must be easy to find.
3. Resources point to the Bible.
4. Clear Spanish, mobile first and tolerance of network failures.
5. Optional follow-up stays optional; availability, copying and update feedback describe
   what actually happened. Preserve people's work and their ability to leave a flow.
