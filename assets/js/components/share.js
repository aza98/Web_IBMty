/*
 * Share buttons ([data-share-item], hidden until this runs): Web Share API, falling back
 * to copying the text and link. data-share-title / -text / -url on the button win;
 * otherwise they come from the closest [data-share-scope]: its heading, its
 * [data-share-part] texts and its id (or data-share-id, on a carousel's loop copies) as the link hash. Live share links can be
 * updated by other modules through data-share-url.
 * data-share-image attaches that picture when the device can share files.
 * [data-share] shares the configured location, with feedback in data-share-status.
 * IBMty.shareActions(app, image, links) renders a carousel card's actions as round icon buttons:
 * Compartir plus one link per social profile ({icon, label, url, family}).
 */
(function(IBMty) {
    'use strict';
    const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    IBMty.shareActions = (app, image, links = []) => {
        const e = app.escapeHtml;
        return `
          <div class="slide-card__actions">
            <button class="btn-app btn-app--outline btn-app--icon" type="button" title="Compartir" data-share-item="" data-share-image="${e(app.root + image)}" hidden=""><i class="fa-solid fa-share icon" aria-hidden="true"></i><span class="visually-hidden">Compartir</span></button>${links.map((link) => `<a class="btn-app btn-app--outline btn-app--icon" href="${e(/^https:\/\//i.test(link.url) ? link.url : '#')}" target="_blank" rel="noopener" aria-label="${e(link.label)}" title="${e(link.label)}"><i class="fa-${link.family === 'solid' ? 'solid' : 'brands'} fa-${e(link.icon)} icon" aria-hidden="true"></i></a>`).join('')}
          </div>`
    };

    function picture(button) {
        if (!button.dataset.shareImage || !navigator.canShare) return Promise.resolve(null);
        button.picture ||= fetch(button.dataset.shareImage).then((response) => response.blob()).then((blob) => {
            const file = new File([blob], button.dataset.shareImage.split('/').pop(), {
                type: blob.type
            });
            return navigator.canShare({
                files: [file]
            }) ? file : null
        }).catch(() => null);
        return button.picture
    }

    function payload(button, app) {
        const translated = (text) => app.i18n?.translate(text) || text;
        if (button.hasAttribute('data-share')) return {
            title: app.config.church.name,
            text: translated('Te esperamos en la Iglesia Bautista de Monterrey'),
            url: app.config.church.directionsUrl || location.href
        };
        const scope = button.closest('[data-share-scope]');
        const data = button.dataset;
        const title = data.shareTitle ? translated(data.shareTitle) : clean(scope && scope.querySelector('h2, h3')) || document.title;
        const parts = scope ? Array.from(scope.querySelectorAll('[data-share-part]'), clean).filter(Boolean) : [];
        const text = [title, data.shareText ? translated(data.shareText) : parts.join('\n')].filter(Boolean).join('\n');
        const url = new URL(data.shareUrl || location.href, location.href);
        if (!data.shareUrl) url.hash = scope ? scope.id || scope.dataset.shareId || '' : '';
        return {
            title,
            text,
            url: url.href
        }
    }

    function notify(app, button, text) {
        const status = document.getElementById(button.dataset.shareStatus);
        if (status) {
            status.textContent = text;
            return
        }
        if (!app.notices) return;
        app.notices.show({
            id: 'share',
            text,
            dismissLabel: 'Cerrar'
        })
    }
    IBMty.register('component:share', {
        init(app) {
            const BUTTONS = '[data-share-item], [data-share]';
            document.querySelectorAll(BUTTONS).forEach((button) => {
                button.hidden = !1
            });
            const target = (event) => event.target.closest?.(BUTTONS);
            ['pointerover', 'touchstart', 'focusin'].forEach((type) => document.addEventListener(type, (event) => {
                const button = target(event);
                if (button) picture(button)
            }, {
                passive: !0
            }));
            document.addEventListener('click', async (event) => {
                const button = target(event);
                if (!button) return;
                const data = payload(button, app);
                try {
                    if (navigator.share) {
                        const file = await picture(button);
                        await navigator.share(file ? {
                            ...data,
                            files: [file]
                        } : data);
                        return
                    }
                    await navigator.clipboard.writeText(button.hasAttribute('data-share') ? data.url : `${data.text}\n${data.url}`);
                    notify(app, button, 'Enlace copiado.')
                } catch (error) {
                    if (error.name === 'AbortError') return;
                    const notice = app.notices.show({
                        id: 'share',
                        text: 'No se pudo compartir. Selecciona y copia este enlace.',
                        dismissLabel: 'Cerrar',
                        onDismiss: () => button.focus()
                    });
                    const field = document.createElement('textarea');
                    field.className = 'field__input';
                    field.readOnly = !0;
                    field.setAttribute('aria-label', 'Enlace para compartir');
                    field.value = data.url;
                    notice.append(field);
                    field.focus();
                    field.select()
                }
            })
        }
    })
})(self.IBMty = self.IBMty || {})