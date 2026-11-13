/*
 * Copy to clipboard on [data-copy] buttons: copies the exact data-copy text,
 * swaps the label to "Copiado" and announces it in [data-copy-status].
 * Account digits stay stable; confirmation is shown on the button and in the status.
 * A copied button keeps data-copied, so pages can style progress with :has().
 */
(function(IBMty) {
    'use strict';
    async function write(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true
        } catch {
            const area = document.createElement('textarea');
            const focused = document.activeElement;
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.cssText = 'position:fixed;opacity:0';
            document.body.append(area);
            try {
                area.select();
                return document.execCommand('copy')
            } catch {
                return false
            } finally {
                area.remove();
                focused?.focus({
                    preventScroll: true
                })
            }
        }
    }

    IBMty.register('component:copy', {
        init() {
            const status = document.querySelector('[data-copy-status]');
            document.querySelectorAll('[data-copy]').forEach((button) => {
                const label = button.querySelector('[data-copy-label]');
                let timer;
                button.addEventListener('click', async () => {
                    const ok = await write(button.dataset.copy);
                    const name = button.dataset.copyName || 'Texto';
                    if (status) status.textContent = ok ? `Copiado: ${name}.` : 'No se pudo copiar. Mantén presionado el texto para copiarlo.';
                    if (!ok) return;
                    button.classList.add('is-copied');
                    button.dataset.copied = '';
                    label.textContent = 'Copiado';
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        button.classList.remove('is-copied');
                        label.textContent = 'Copiar'
                    }, 2000)
                })
            })
        }
    })
})(self.IBMty = self.IBMty || {})