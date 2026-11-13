/*
 * Optional push activation from the bell. It is offered only when configured and while
 * this device can still subscribe (state off); cookie choice never opens another prompt.
 * Settings always explains availability.
 */
(function(IBMty, document) {
    'use strict';
    const STRINGS = {
        title: 'Activa las notificaciones',
        text: 'Recibe avisos de transmisiones en vivo y actividades de la iglesia en tu dispositivo.',
        accept: 'Aceptar',
        notNow: 'Ahora no',
        fabLabel: 'Activar notificaciones'
    };
    const PUSH_SVG = `
    <svg class="prompt-card__art" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <rect class="art__ring" x="20" y="20" width="56" height="56" rx="12" transform="rotate(45 48 48)" />
      <rect class="prompt-ill__ground" x="25" y="25" width="46" height="46" rx="9" transform="rotate(45 48 48)" />
      <ellipse class="art__shadow" cx="48" cy="79" rx="26" ry="3.5" />
      <g transform="rotate(-7 38 46)">
        <rect class="art__shadow" x="21" y="27" width="38" height="44" rx="8" />
        <rect class="art__card" x="19" y="25" width="38" height="44" rx="8" />
        <rect class="art__tint" x="24" y="30" width="28" height="11" rx="3.5" />
        <rect class="art__brand" x="27.5" y="33.5" width="4" height="4" rx="0.9" transform="rotate(45 29.5 35.5)" />
        <rect class="art__ink" x="35" y="34" width="13" height="3" rx="1.5" />
        <rect class="art__muted" x="24" y="46" width="22" height="3" rx="1.5" />
        <rect class="art__muted" x="24" y="52" width="16" height="3" rx="1.5" />
      </g>
      <g transform="rotate(6 58 52)">
        <circle class="art__warm" cx="58" cy="68.5" r="4.8" />
        <rect class="art__brand-deep" x="55" y="30" width="6" height="6" rx="3" />
        <path class="art__shadow" d="M59.5 36 C50.5 36 45.5 42.2 45.5 51 L45.5 57.5 L41 63 C40.2 64 40.9 65.5 42.2 65.5 L76.8 65.5 C78.1 65.5 78.8 64 78 63 L73.5 57.5 L73.5 51 C73.5 42.2 68.5 36 59.5 36 Z" />
        <path class="art__brand" d="M58 34 C49 34 44 40.2 44 49 L44 55.5 L39.5 61 C38.7 62 39.4 63.5 40.7 63.5 L75.3 63.5 C76.6 63.5 77.3 62 76.5 61 L72 55.5 L72 49 C72 40.2 67 34 58 34 Z" />
        <path class="art__brand-deep" d="M58 34 C67 34 72 40.2 72 49 L72 55.5 L76.5 61 C77.3 62 76.6 63.5 75.3 63.5 L58 63.5 Z" opacity=".32" />
        <path class="art__shine" stroke-width="2.2" d="M48.5 48 C48.5 42.8 51.6 39.2 55.8 38.2" />
      </g>
      <circle class="art__notif" stroke-width="2" cx="72" cy="36" r="5.5" />
      <path class="prompt-ill__wave" d="M75 24 C79.5 26.5 82 30.8 82.5 36" />
      <path class="art__warm" d="M19 60 Q19 63.5 22.5 63.5 Q19 63.5 19 67 Q19 63.5 15.5 63.5 Q19 63.5 19 60 Z" />
    </svg>`;
    const FAB_SVG = `
    <svg class="push-fab__svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.9" d="M6.2 12.2 A10.5 10.5 0 0 1 9.5 7.2 M25.8 12.2 A10.5 10.5 0 0 0 22.5 7.2" opacity=".72" />
      <path fill="currentColor" d="M16 4.5 a1.8 1.8 0 0 1 1.8 1.8 v.7 a7.5 7.5 0 0 1 5.7 7.3 v4.5 l1.9 2.2 a1.1 1.1 0 0 1 -.84 1.82 H7.44 a1.1 1.1 0 0 1 -.84 -1.82 L8.5 18.8 v-4.5 a7.5 7.5 0 0 1 5.7 -7.3 v-.7 A1.8 1.8 0 0 1 16 4.5 Z" />
      <path fill="currentColor" d="M13.2 24.3 a2.8 2.8 0 0 0 5.6 0 Z" />
      <circle class="push-fab__dot" cx="23.2" cy="8.6" r="3.8" />
    </svg>`;
    IBMty.register('component:push-offer', {
        init(app) {
            if (!app.config.features.push || !app.config.services.oneSignalAppId || !app.push) return;
            const KEY = app.storage.KEYS.pushOffer;
            const NOTES = app.push.messages;
            let currentState = null;
            const popup = document.createElement('aside');
            popup.className = 'prompt-card prompt-card--dismissible';
            popup.dataset.pushPopup = '';
            popup.setAttribute('aria-labelledby', 'push-popup-title');
            popup.hidden = true;
            popup.innerHTML = `
        <button class="prompt-card__close icon-btn" type="button" data-push-dismiss aria-label="${STRINGS.notNow}"><i class="fa-solid fa-xmark icon" aria-hidden="true"></i></button>
        <div class="prompt-card__body">
          ${PUSH_SVG}
          <div>
            <h2 class="prompt-card__title" id="push-popup-title">${STRINGS.title}</h2>
            <p class="prompt-card__text">${STRINGS.text}</p>
          </div>
        </div>
        <p class="prompt-card__note" data-push-offer-note role="status" aria-live="polite"></p>
        <div class="prompt-card__actions">
          <button class="btn-app btn-app--primary" type="button" data-push-accept><i class="fa-solid fa-bell icon" aria-hidden="true"></i><span data-push-accept-label>${STRINGS.accept}</span></button>
        </div>`;
            const fab = document.createElement('button');
            fab.type = 'button';
            fab.className = 'float-btn push-fab';
            fab.dataset.pushFab = '';
            fab.setAttribute('aria-label', STRINGS.fabLabel);
            fab.setAttribute('title', STRINGS.fabLabel);
            fab.hidden = true;
            fab.innerHTML = FAB_SVG;
            document.body.append(popup, fab);
            const acceptBtn = popup.querySelector('[data-push-accept]');
            const acceptLabel = popup.querySelector('[data-push-accept-label]');
            const dismissBtn = popup.querySelector('[data-push-dismiss]');
            const noteEl = popup.querySelector('[data-push-offer-note]');

            function focusSettings() {
                const target = [...document.querySelectorAll('[data-settings-toggle], [data-page-link="settings"]')]
                    .find((element) => element.getClientRects().length);
                if (target) target.focus({
                    preventScroll: true
                });
                else {
                    const main = document.querySelector('main');
                    if (main) {
                        main.tabIndex = -1;
                        main.focus({
                            preventScroll: true
                        });
                    }
                }
            }

            const offerable = () => currentState === 'off' && app.storage.get(KEY) !== 'dismissed';

            function closePopup() {
                const restoreFocus = !popup.hidden && (popup.contains(document.activeElement) || document.activeElement === document.body);
                popup.hidden = true;
                fab.hidden = !offerable();
                if (restoreFocus) {
                    if (!fab.hidden) fab.focus();
                    else focusSettings();
                }
            }

            function dismiss() {
                app.storage.set(KEY, 'dismissed');
                noteEl.textContent = '';
                closePopup();
            }

            function openPopup() {
                if (currentState !== 'off') return;
                noteEl.textContent = '';
                fab.hidden = true;
                popup.hidden = false;
                acceptBtn.focus();
                app.push.state().catch(() => {});
            }
            dismissBtn.addEventListener('click', dismiss);
            fab.addEventListener('click', openPopup);
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && !popup.hidden) dismiss();
            });
            acceptBtn.addEventListener('click', () => {
                if (acceptBtn.disabled) return;
                acceptBtn.disabled = true;
                app.push.enable().catch(() => {});
            });
            app.on('push-change', (event) => {
                const state = event.detail;
                const fabFocused = document.activeElement === fab;
                const busy = state === 'enabling' || state === 'disabling';
                currentState = state;
                acceptBtn.disabled = state !== 'off' && state !== 'error';
                acceptLabel.textContent = busy ? NOTES[state] : STRINGS.accept;
                noteEl.textContent = state === 'off' || state === 'on' ? '' : NOTES[state];
                fab.disabled = busy;
                fab.hidden = !offerable() || !popup.hidden;
                if (state === 'on') {
                    app.storage.set(KEY, 'granted');
                    closePopup();
                }
                if (fabFocused && fab.hidden) focusSettings();
            });
            app.push.state().catch(() => {});
        }
    })
})(self.IBMty = self.IBMty || {}, document)