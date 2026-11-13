/*
 * Fills links and text from IBMty.config: <a data-config="church.phone" data-config-as="tel">.
 * data-config-as: text | href | tel | mailto | whatsapp | src (default text).
 * An empty value hides a link (and its list item) and an iframe: people never meet a control
 * that cannot work. Without JS the link stays disabled (aria-disabled, no href).
 * [data-config-pending="path"] notes show only while that value is empty and name the alternative.
 * data-config-message prefills whatsapp text or the mailto body; data-config-subject the mailto subject.
 */
(function(IBMty) {
    'use strict';
    const read = (config, path) => path.split('.').reduce((value, key) => value?.[key], config) || '';
    const formats = {
        tel: (value) => `tel:${value.replace(/[^\d+]/g, '')}`,
        mailto: (value) => `mailto:${value}`,
        whatsapp: (value) => `https://wa.me/${value.replace(/\D/g, '')}`,
        href: (value) => value
    };
    IBMty.register('component:config-bindings', {
        init(app) {
            document.querySelectorAll('[data-config-pending]').forEach((el) => {
                el.hidden = Boolean(read(app.config, el.dataset.configPending))
            });
            document.querySelectorAll('[data-config]').forEach((el) => {
                const value = read(app.config, el.dataset.config);
                const as = el.dataset.configAs || 'text';
                if (as === 'text') {
                    if (value) el.textContent = value
                } else if (as === 'src') {
                    if (value) el.src = value;
                    el.hidden = !value
                } else if (value) {
                    const {
                        configMessage: message,
                        configSubject: subject
                    } = el.dataset;
                    const query = as === 'whatsapp' ? {
                        text: message
                    } : as === 'mailto' ? {
                        subject,
                        body: message
                    } : {};
                    const params = Object.entries(query).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
                    el.href = formats[as](value) + (params ? `?${params}` : '');
                    el.removeAttribute('aria-disabled')
                } else {
                    el.removeAttribute('href');
                    el.setAttribute('aria-disabled', 'true');
                    (el.parentElement?.matches('li') ? el.parentElement : el).hidden = !0
                }
            })
        }
    })
})(self.IBMty = self.IBMty || {})