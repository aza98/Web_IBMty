/*
 * Settings panel opened from the navbar gear ([data-settings-toggle]): appearance
 * (light, dark or automatic, through IBMty.theme), language (IBMty.i18n), church notices
 * (IBMty.push, services/push.js) and app installation (IBMty.install).
 * The panel is built here so its markup lives in one place; it closes on Escape,
 * on a click outside or when the page changes.
 * The installed app hides the navbar, so the Ajustes page (app/settings.html) mounts
 * the same appearance and language controls inline in [data-appearance] and [data-language],
 * and binds its own [data-push] group with the same bindPush().
 */
(function(IBMty, document) {
    'use strict';
    const CLOSE = '<i class="fa-solid fa-xmark icon" aria-hidden="true"></i>';
    const DOWNLOAD = '<i class="fa-solid fa-download icon" aria-hidden="true"></i>';
    const preview = (theme, label) => `
    <button class="theme-option" type="button" role="radio" aria-checked="false" data-theme-option="${theme}">
      <span class="theme-option__preview theme-option__preview--${theme}" aria-hidden="true">
        <span class="theme-option__dots"><i></i><i></i><i></i></span>
        <span class="theme-option__time">9:41</span>
        <span class="theme-option__bar"></span><span class="theme-option__bar"></span>
      </span>
      <span class="theme-option__label">${label}</span>
      <span class="theme-option__radio" aria-hidden="true"></span>
    </button>`;
    const appearance = (prefix) => `
    <div class="theme-options" role="radiogroup" aria-labelledby="${prefix}-appearance">
      ${preview('light', 'Claro')}${preview('dark', 'Oscuro')}
    </div>
    <label class="settings-switch">
      <span>Automático</span>
      <input type="checkbox" role="switch" data-theme-auto aria-describedby="${prefix}-auto-note">
      <span class="settings-switch__track" aria-hidden="true"></span>
    </label>`;
    const autoNote = (prefix) => `<p class="settings-panel__note" id="${prefix}-auto-note">Automático sigue el aspecto claro u oscuro de tu dispositivo.</p>`;
    const LANGUAGES = [
        ['es', 'Español'],
        ['en', 'English']
    ];
    const language = (prefix) => `
    <div class="language-options" role="radiogroup" aria-labelledby="${prefix}-language">
      ${LANGUAGES.map(([code, name]) => `<button class="language-option" type="button" role="radio" aria-checked="false" data-language-option="${code}" lang="${code}"><span>${name}</span><span class="theme-option__radio" aria-hidden="true"></span></button>`).join('')}
    </div>`;

    function bindRadioKeys(options) {
        options.forEach((option, index) => option.addEventListener('keydown', (event) => {
            const direction = {
                ArrowRight: 1,
                ArrowDown: 1,
                ArrowLeft: -1,
                ArrowUp: -1
            } [event.key];
            if (!direction) return;
            event.preventDefault();
            const next = options[(index + direction + options.length) % options.length];
            next.click();
            next.focus()
        }))
    }

    function bindLanguage(app, root) {
        const options = root.querySelectorAll('[data-language-option]');
        const sync = () => options.forEach((option) => {
            const selected = option.dataset.languageOption === app.i18n.lang;
            option.setAttribute('aria-checked', String(selected));
            option.tabIndex = selected ? 0 : -1
        });
        bindRadioKeys(options);
        options.forEach((option) => option.addEventListener('click', () => app.i18n.set(option.dataset.languageOption)));
        app.on('language-change', sync);
        sync()
    }
    const pushRow = (prefix) => `
    <label class="settings-switch settings-switch--first">
      <span class="settings-row__label"><span class="settings-icon" aria-hidden="true"><i class="fa-solid fa-bell icon"></i></span>Avisos de la iglesia</span>
      <input type="checkbox" role="switch" data-push-toggle aria-describedby="${prefix}-push-status" disabled>
      <span class="settings-switch__track" aria-hidden="true"></span>
    </label>`;
    const pushNote = (prefix) => `<p class="settings-panel__note" id="${prefix}-push-status" data-push-status role="status">Comprobando…</p>`;

    function bindPush(root) {
        const toggle = root.querySelector('[data-push-toggle]');
        const note = root.querySelector('[data-push-status]');
        if (!toggle || !note || !IBMty.push) return () => {};
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn-app btn-app--outline';
        retry.dataset.pushRetry = '';
        retry.textContent = 'Volver a comprobar';
        retry.setAttribute('aria-describedby', note.id);
        retry.hidden = !0;
        note.after(retry);
        let checked = !1;
        const render = (state) => {
            const busy = state === 'enabling' || state === 'disabling';
            const retryFocused = document.activeElement === retry;
            if (!busy) checked = state === 'on';
            toggle.checked = checked;
            toggle.disabled = state !== 'on' && state !== 'off';
            note.textContent = IBMty.push.messages[state];
            retry.hidden = state !== 'error';
            retry.disabled = busy;
            if (retryFocused && retry.hidden) {
                if (!toggle.disabled) toggle.focus();
                else {
                    note.tabIndex = -1;
                    note.focus()
                }
            }
        };
        IBMty.on('push-change', ({
            detail
        }) => render(detail));
        toggle.addEventListener('change', () => {
            const turningOn = toggle.checked;
            toggle.checked = checked;
            toggle.disabled = !0;
            (turningOn ? IBMty.push.enable() : IBMty.push.disable()).catch(() => {})
        });
        const load = () => {
            retry.disabled = !0;
            return IBMty.push.state().catch(() => {})
        };
        retry.addEventListener('click', load);
        return load
    }

    function bindAppearance(app, root) {
        const options = root.querySelectorAll('[data-theme-option]');
        const auto = root.querySelector('[data-theme-auto]');
        const sync = () => {
            auto.checked = app.theme.mode === 'auto';
            options.forEach((option) => {
                const selected = option.dataset.themeOption === app.theme.resolved;
                option.setAttribute('aria-checked', String(selected));
                option.tabIndex = selected ? 0 : -1
            })
        };
        bindRadioKeys(options);
        options.forEach((option) => option.addEventListener('click', () => app.theme.set(option.dataset.themeOption)));
        auto.addEventListener('change', () => app.theme.set(auto.checked ? 'auto' : app.theme.resolved));
        app.on('theme-change', sync);
        sync()
    }
    IBMty.register('component:settings-panel', {
        init(app) {
            const inline = document.querySelector('[data-appearance]');
            if (inline) {
                inline.innerHTML = appearance('page') + autoNote('page');
                bindAppearance(app, inline);
                inline.closest('[hidden]')?.removeAttribute('hidden')
            }
            const inlineLanguage = document.querySelector('[data-language]');
            if (inlineLanguage) {
                inlineLanguage.innerHTML = language('page');
                bindLanguage(app, inlineLanguage);
                inlineLanguage.closest('[hidden]')?.removeAttribute('hidden')
            }
            const pagePush = document.querySelector('[data-push]');
            if (pagePush && IBMty.push) {
                pagePush.hidden = !1;
                bindPush(pagePush)()
            }
            const toggles = document.querySelectorAll('[data-settings-toggle]');
            if (!toggles.length) return;
            const panel = document.createElement('div');
            panel.className = 'settings-panel';
            panel.id = 'settings-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-labelledby', 'settings-panel-title');
            panel.hidden = !0;
            panel.tabIndex = -1;
            panel.innerHTML = `
        <header class="settings-panel__head">
          <h2 class="settings-panel__title" id="settings-panel-title">Ajustes</h2>
          <button class="settings-panel__close icon-btn" type="button" aria-label="Cerrar ajustes">${CLOSE}</button>
        </header>
        <section aria-labelledby="settings-appearance">
          <h3 class="settings-panel__heading" id="settings-appearance">Aspecto</h3>
          <div class="settings-panel__card">${appearance('settings')}</div>
          ${autoNote('settings')}
        </section>
        <section aria-labelledby="settings-language">
          <h3 class="settings-panel__heading" id="settings-language">Idioma</h3>
          <div class="settings-panel__card">${language('settings')}</div>
        </section>
        <section aria-labelledby="settings-notifications"${IBMty.push ? '' : ' hidden'}>
          <h3 class="settings-panel__heading" id="settings-notifications">Notificaciones</h3>
          <div class="settings-panel__card" data-panel-push>${pushRow('settings')}</div>
          ${pushNote('settings')}
        </section>
        <section class="settings-panel__install" aria-labelledby="settings-install" hidden>
          <h3 class="settings-panel__heading" id="settings-install">Instalar la app</h3>
          <button class="btn-app btn-app--primary" type="button" data-install>${DOWNLOAD}Instalar IBMty</button>
        </section>`;
            document.body.append(panel);
            const install = panel.querySelector('.settings-panel__install');

            function sync() {
                install.hidden = !(app.install && app.install.available) || document.documentElement.dataset.display === 'standalone'
            }
            bindAppearance(app, panel);
            bindLanguage(app, panel);
            const loadPush = bindPush(panel);
            panel.querySelector('[data-install]').addEventListener('click', () => app.install.prompt());
            app.on('install-change', sync);

            function setOpen(open) {
                panel.hidden = !open;
                toggles.forEach((toggle) => toggle.setAttribute('aria-expanded', String(open)));
                if (open) {
                    sync();
                    loadPush();
                    panel.focus()
                }
            }
            toggles.forEach((toggle) => toggle.addEventListener('click', () => setOpen(panel.hidden)));
            const close = () => {
                setOpen(!1);
                toggles[0].focus()
            };
            panel.querySelector('.settings-panel__close').addEventListener('click', close);
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && !panel.hidden) close();
            });
            document.addEventListener('click', (event) => {
                if (!panel.hidden && !panel.contains(event.target) && ![...toggles].some((toggle) => toggle.contains(event.target))) setOpen(!1);
            });
            sync()
        }
    })
})(self.IBMty = self.IBMty || {}, document)