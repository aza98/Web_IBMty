/*
 * Cookie choice shown only when analytics is configured and no choice is stored.
 * IBMty.consent.set('granted' | 'denied') stores the choice, applies Google Analytics
 * Consent Mode when configured (services/analytics.js) and emits consent-change.
 */
(function(IBMty, document) {
    'use strict';
    const ART = `
    <svg class="prompt-card__art" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <rect class="art__ring" x="20" y="20" width="56" height="56" rx="12" transform="rotate(45 48 48)" />
      <rect class="prompt-ill__ground" x="25" y="25" width="46" height="46" rx="9" transform="rotate(45 48 48)" />
      <ellipse class="art__shadow" cx="48" cy="79" rx="26" ry="3.5" />
      <path class="art__shadow" d="M54.8 29.8 A22 22 0 1 0 65.8 43.9 A6.5 6.5 0 0 0 58.3 37.8 A6.5 6.5 0 0 0 54.8 29.8 Z" />
      <path class="prompt-ill__cookie" d="M53.3 27.6 A22 22 0 1 0 64.3 41.7 A6.5 6.5 0 0 0 56.8 35.6 A6.5 6.5 0 0 0 53.3 27.6 Z" />
      <path class="prompt-ill__cookie-shade" d="M23.5 52 A20 20 0 0 0 54 64.5 A22 22 0 0 1 23.5 52 Z" opacity=".45" />
      <circle class="prompt-ill__chip" cx="35" cy="39" r="2.9" />
      <circle class="prompt-ill__chip" cx="45.5" cy="36.5" r="2.2" />
      <circle class="prompt-ill__chip" cx="31.5" cy="51" r="2.4" />
      <circle class="prompt-ill__chip" cx="43.5" cy="49.5" r="3.1" />
      <circle class="prompt-ill__chip" cx="38.5" cy="60" r="2.3" />
      <circle class="prompt-ill__cookie-crumb" cx="62.5" cy="27.5" r="1.6" />
      <circle class="prompt-ill__cookie-crumb" cx="68" cy="33.5" r="1.2" />
      <path class="art__shadow" d="M64.5 44 L77 48.6 C78.2 49 79 50.2 79 51.5 L79 60.5 C79 69.5 72.8 76.1 64.5 79.2 C56.2 76.1 50 69.5 50 60.5 L50 51.5 C50 50.2 50.8 49 52 48.6 Z" />
      <path class="art__card" d="M63 42 L75.5 46.6 C76.7 47 77.5 48.2 77.5 49.5 L77.5 58.5 C77.5 67.5 71.3 74.1 63 77.2 C54.7 74.1 48.5 67.5 48.5 58.5 L48.5 49.5 C48.5 48.2 49.3 47 50.5 46.6 Z" />
      <path class="art__brand" d="M63 45.5 L73 49.2 C73.9 49.5 74.5 50.4 74.5 51.4 L74.5 58.3 C74.5 65.6 69.6 70.9 63 73.5 C56.4 70.9 51.5 65.6 51.5 58.3 L51.5 51.4 C51.5 50.4 52.1 49.5 53 49.2 Z" />
      <path class="art__brand-deep" d="M63 45.5 L73 49.2 C73.9 49.5 74.5 50.4 74.5 51.4 L74.5 58.3 C74.5 65.6 69.6 70.9 63 73.5 Z" opacity=".34" />
      <path class="art__check" stroke-width="2.2" d="M58.5 59.2 L61.6 62.3 L67.8 55.8" />
      <path class="art__brand" d="M21 20 Q21 24 25 24 Q21 24 21 28 Q21 24 17 24 Q21 24 21 20 Z" />
    </svg>`;
    let popup = null;

    function set(choice) {
        IBMty.storage.set(IBMty.storage.KEYS.consent, choice);
        popup?.remove();
        popup = null;
        IBMty.analytics?.applyConsent();
        IBMty.emit('consent-change', choice)
    }
    IBMty.consent = {
        set
    };
    IBMty.register('component:consent', {
        init(app) {
            if (!app.analytics?.enabled) return;
            app.analytics.applyConsent();
            if (app.storage.get(app.storage.KEYS.consent)) return;
            popup = document.createElement('aside');
            popup.className = 'prompt-card';
            popup.dataset.consentPopup = '';
            popup.setAttribute('aria-labelledby', 'consent-popup-title');
            popup.innerHTML = `
        <div class="prompt-card__body">
          ${ART}
          <div>
            <h2 class="prompt-card__title" id="consent-popup-title">Uso de cookies</h2>
            <p class="prompt-card__text"><span>Usamos cookies de análisis para saber qué páginas son útiles y mejorar tu experiencia. Consulta nuestro</span> <a href="${app.url('pages/privacy.html')}">aviso de privacidad</a>.</p>
          </div>
        </div>
        <div class="prompt-card__actions">
          <button class="btn-app btn-app--primary" type="button" data-consent-accept><i class="fa-solid fa-check icon" aria-hidden="true"></i>Aceptar</button>
          <button class="btn-app btn-app--outline" type="button" data-consent-reject><i class="fa-solid fa-xmark icon" aria-hidden="true"></i>Rechazar</button>
        </div>`;
            popup.querySelector('[data-consent-accept]').addEventListener('click', () => set('granted'));
            popup.querySelector('[data-consent-reject]').addEventListener('click', () => set('denied'));
            document.body.append(popup)
        }
    })
})(self.IBMty = self.IBMty || {}, document);