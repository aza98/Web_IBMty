# Settings: notification preferences

Audience: visitors using the website or the installed PWA. Keep the existing Settings
page and gear panel; both consume the same push state from `assets/js/services/push.js`.

- Spanish is the source; every status and action has an English overlay.
- A switch is on only for a confirmed OneSignal subscription with permission, ID and token.
- During activation/deactivation, retain the last confirmed check and disable all switches.
- An unconfirmed state disables the switch and offers **Volver a comprobar** beside its note.
- Returning from browser/device settings or restoring the page refreshes every mounted control.
- iPhone/iPad browser visitors receive Home Screen instructions; supported installed apps
  and browsers control the subscription belonging to their current context.
- The bell appears only while activation is possible (`off`) and the visitor has not declined
  the invitation on this device; «Ahora no» retires it for good, so Settings and the gear panel
  are the lasting entry. It wears the chrome tone, not primary cyan. Completion restores focus
  to a visible Settings entry or main content.
- «Usar esta app» (browser only) is a list of rows like «Enlaces»: two disclosures (install,
  offline limits) and the contact link. «Instalar la app» shows only while the browser has an
  install offer.
- Status notes remain live, retry actions keyboard-accessible, and layouts support both themes,
  reduced motion and safe areas. Existing HTML/no-JS navigation remains available.

Shared contracts: [DESIGN.md](../../DESIGN.md). Runtime details:
[offline-pwa.md](../../docs/offline-pwa.md). Evidence and pending checks:
[status.md](../../docs/status.md).
