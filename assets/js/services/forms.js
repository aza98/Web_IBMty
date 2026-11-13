/*
 * Forms on form[data-form="<name>"], posted to config.services.formEndpoints[name]
 * (Formspree). Validates with the browser's constraints, shows Spanish messages
 * next to each field and reports the result in [data-form-status]. Needs a
 * connection; it never reports success unless the provider accepted the message.
 * data-form-require-one="email telefono" asks for at least one of those fields.
 */
(function(IBMty) {
    'use strict';
    const MESSAGES = {
        valueMissing: 'Este campo es obligatorio.',
        typeMismatch: 'Revisa el formato, por ejemplo nombre@correo.com.',
        tooShort: 'Escribe un poco más.',
        patternMismatch: 'Revisa el formato.'
    };

    function messageFor(field) {
        if (field.type === 'checkbox' && field.validity.valueMissing) return 'Marca esta casilla para continuar.';
        const key = Object.keys(MESSAGES).find((name) => field.validity[name]);
        return key ? MESSAGES[key] : ''
    }

    function showError(field, message) {
        const error = document.getElementById(field.getAttribute('aria-describedby')?.split(' ').find((id) => id.endsWith('-error')));
        field.setAttribute('aria-invalid', String(Boolean(message)));
        if (error) error.textContent = message
    }

    function start(form, app) {
        const status = form.querySelector('[data-form-status]');
        const button = form.querySelector('[type="submit"]');
        const fields = Array.from(form.elements).filter((el) => el.willValidate);
        const endpoint = app.config.services.formEndpoints[form.dataset.form];
        if (!app.config.features.forms || !endpoint) {
            const heading = form.querySelector('h3');
            const link = form.closest('#contacto') ? null : document.createElement('a');
            if (link) {
                link.className = 'btn-app btn-app--outline';
                link.href = app.url('pages/about.html#contacto');
                link.textContent = 'Ver opciones de contacto'
            }
            status.textContent = 'El formulario aún no está disponible. Puedes usar las opciones de contacto.';
            form.replaceChildren(...[heading, status, link].filter(Boolean));
            return
        }
        form.noValidate = !0;
        const setStatus = (text, state) => {
            status.textContent = text;
            status.dataset.state = state
        };
        fields.forEach((field) => field.addEventListener('blur', () => {
            if (field.getAttribute('aria-invalid') === 'true' || field.value) showError(field, messageFor(field));
        }));
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (button.disabled) return;
            fields.forEach((field) => showError(field, messageFor(field)));
            const oneOf = (form.dataset.formRequireOne || '').split(' ').filter(Boolean).map((name) => form.elements[name]);
            const missingOne = oneOf.length > 0 && oneOf.every((field) => !field.value.trim());
            if (missingOne) showError(oneOf[0], 'Escribe un correo o un teléfono para poder contactarte.');
            const invalid = fields.find((field) => !field.validity.valid || (missingOne && field === oneOf[0]));
            if (invalid) {
                setStatus('Revisa los campos marcados.', 'error');
                invalid.focus();
                return
            }
            if (!navigator.onLine) {
                setStatus('No hay conexión. Tu mensaje no se envió; inténtalo cuando vuelvas a estar en línea.', 'error');
                return
            }
            button.disabled = !0;
            form.setAttribute('aria-busy', 'true');
            setStatus('Enviando…', 'pending');
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: {
                        Accept: 'application/json'
                    }
                });
                if (!response.ok) throw new Error(String(response.status));
                form.reset();
                setStatus('¡Gracias! Recibimos tu mensaje y te responderemos pronto.', 'success')
            } catch {
                setStatus('No pudimos enviar tu mensaje. Inténtalo de nuevo o usa otra opción de contacto.', 'error')
            } finally {
                button.disabled = !1;
                form.removeAttribute('aria-busy')
            }
        })
    }
    IBMty.register('service:forms', {
        init(app) {
            document.querySelectorAll('form[data-form]').forEach((form) => start(form, app))
        }
    })
})(self.IBMty = self.IBMty || {})