/*
 * Notices: small floating messages (offline, updates, sharing). IBMty.notices.show({ id, text,
 * action: { label, onClick }, dismissLabel, onDismiss }) adds or replaces the notice with that id;
 * IBMty.notices.hide(id) removes it. They are announced through a polite live region.
 * Defined at load (not in init) so other modules can use it from their own init.
 */
(function(IBMty, document) {
    'use strict';
    let stack;
    const items = new Map();

    function container() {
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'notices';
            stack.setAttribute('role', 'status');
            stack.setAttribute('aria-live', 'polite');
            document.body.append(stack)
        }
        return stack
    }

    function hide(id) {
        items.get(id)?.remove();
        items.delete(id)
    }
    const ICONS = {
        rotate: '<i class="fa-solid fa-arrows-rotate icon" aria-hidden="true"></i>',
        close: '<i class="fa-solid fa-xmark icon" aria-hidden="true"></i>'
    };

    function button(label, className, onClick, icon) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = className;
        el.innerHTML = ICONS[icon];
        el.append(label);
        el.addEventListener('click', onClick);
        return el
    }

    function show({
        id,
        text,
        action,
        dismissLabel,
        onDismiss
    }) {
        hide(id);
        const notice = document.createElement('div');
        notice.className = 'notice';
        const message = document.createElement('p');
        message.className = 'notice__text';
        message.textContent = text;
        notice.append(message);
        if (action || dismissLabel) {
            const actions = document.createElement('div');
            actions.className = 'notice__actions';
            if (action) actions.append(button(action.label, 'btn-app btn-app--primary notice__button', () => {
                hide(id);
                action.onClick()
            }, 'rotate'));
            if (dismissLabel) actions.append(button(dismissLabel, 'btn-app btn-app--outline notice__button', () => {
                hide(id);
                onDismiss?.()
            }, 'close'));
            notice.append(actions)
        }
        container().append(notice);
        items.set(id, notice);
        return notice
    }
    IBMty.notices = {
        show,
        hide
    }
})(self.IBMty = self.IBMty || {}, document)