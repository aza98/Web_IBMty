/*
 * About page: years since the church was founded, repeated content and the missionary
 * stage (a map and one card that share the selection; see components/map.js).
 * Ministries and missionaries come from assets/data/{ministries,missionaries}.json.
 */
(function(IBMty) {
    'use strict';

    function ministryCard(item, app) {
        const e = app.escapeHtml;
        const chips = item.chips.map((chip) => `
            <li class="chip" data-share-part=""><i class="fa-solid fa-${e(chip.icon)} icon" aria-hidden="true"></i>${e(chip.text)}</li>`).join('');
        return `
      <article class="swiper-slide slide-card" id="${e(item.id)}" data-share-scope="">
        <figure class="slide-card__media">
          <img class="slide-card__photo" src="${e(app.root + item.photo)}" alt="${e(item.photoAlt)}" width="1920" height="1080" loading="lazy" decoding="async">
          <img class="leader-card__logo" src="${e(app.root + item.logo)}" alt="" width="64" height="64" loading="lazy" decoding="async">
        </figure>
        <div class="slide-card__body leader-card__body">
          <h3 class="leader-card__ministry">${e(item.ministry)}</h3>
          <p class="leader-card__names" data-share-part="">${e(item.names)}</p>
          <p class="leader-card__text" data-share-part="">${e(item.text)}</p>${chips ? `<ul class="chips">${chips}</ul>` : ''}
${IBMty.shareActions(app, item.flyer || item.logo, item.links)}
        </div>
      </article>`
    }
    const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const departure = (since) => {
        const [month, year] = since.toLowerCase().split(' ');
        return year ? Number(year) * 12 + MONTHS.indexOf(month) : Number(month) * 12
    };

    function serving(since) {
        const years = new Date().getFullYear() - Math.floor(departure(since) / 12);
        return years < 1 ? 'Este año' : `${years} ${years === 1 ? 'año' : 'años'}`
    }

    function missionaryCard(item, app) {
        const e = app.escapeHtml;
        return `
      <li class="sending" data-region="${e(item.region)}" data-lat="${e(item.location.lat)}" data-lng="${e(item.location.lng)}">
        <img class="sending__photo" src="${e(app.root + item.image)}" alt="" width="965" height="1080" loading="lazy" decoding="async">
        <div class="sending__body">
          <p class="sending__place">${e(item.place)}</p>
          <h4 class="sending__family" data-map-title="">${e(item.title)}</h4>${item.names ? `<p class="sending__names">${e(item.names)}</p>` : ''}
          <dl class="sending__facts">
            <div><dt>Salida</dt><dd>${e(item.since)}</dd></div>
            <div><dt>Sirviendo</dt><dd>${e(serving(item.since))}</dd></div>
          </dl>
        </div>
      </li>`
    }
    const byDeparture = (records) => [...records].sort((a, b) => departure(a.since) - departure(b.since));

    function stage() {
        const root = document.querySelector('[data-stage]');
        const list = root?.querySelector('[data-content="missionaries"]');
        const map = root?.querySelector('[data-map]');
        const nav = root?.querySelector('[data-stage-nav]');
        const items = list ? [...list.children].filter((item) => item.matches('.sending')) : [];
        if (!map || !nav || !items.length) return;
        const count = nav.querySelector('[data-stage-count]');
        const prev = nav.querySelector('[data-stage-prev]');
        const next = nav.querySelector('[data-stage-next]');
        const line = nav.querySelector('[data-stage-line]');
        line.replaceChildren(...items.map(() => document.createElement('i')));
        let current = -1;

        function show(index, animate = !0) {
            if (index < 0 || index >= items.length || index === current) return;
            list.dataset.direction = index < current ? 'back' : 'forward';
            current = index;
            items.forEach((item, i) => item.classList.toggle('is-current', i === index));
            items.slice(Math.max(0, index - 1), index + 2).forEach((item) => item.querySelector('img')?.setAttribute('loading', 'eager'));
            [...line.children].forEach((dot, i) => dot.classList.toggle('is-current', i === index));
            count.textContent = `${index + 1} de ${items.length}`;
            prev.classList.toggle('is-disabled', index === 0);
            next.classList.toggle('is-disabled', index === items.length - 1);
            prev.setAttribute('aria-disabled', String(index === 0));
            next.setAttribute('aria-disabled', String(index === items.length - 1));
            map.dispatchEvent(new CustomEvent('map:focus', {
                detail: {
                    index,
                    animate
                }
            }))
        }

        function activate() {
            if (root.hasAttribute('data-stage-ready')) return;
            root.setAttribute('data-stage-ready', '');
            nav.hidden = !1;
            current = -1;
            show(0, !1)
        }

        function release() {
            root.removeAttribute('data-stage-ready');
            nav.hidden = !0;
            items.forEach((item) => item.classList.remove('is-current'))
        }
        prev.addEventListener('click', () => show(current - 1));
        next.addEventListener('click', () => show(current + 1));
        root.addEventListener('keydown', (event) => {
            if (!root.hasAttribute('data-stage-ready') || !event.target.closest('[data-map-cover]')) return;
            if (event.key === 'ArrowLeft') show(current - 1);
            else if (event.key === 'ArrowRight') show(current + 1);
            else return;
            event.preventDefault()
        });
        const card = root.querySelector('[data-map-cover]');
        let touch = null;
        card.addEventListener('touchstart', (event) => {
            touch = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null
        }, {
            passive: !0
        });
        card.addEventListener('touchend', (event) => {
            if (!touch || !root.hasAttribute('data-stage-ready')) return;
            const dx = event.changedTouches[0].clientX - touch[0];
            const dy = event.changedTouches[0].clientY - touch[1];
            touch = null;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1))
        }, {
            passive: !0
        });
        map.addEventListener('map:select', (event) => show(event.detail.index));
        map.addEventListener('map:ready', activate);
        map.addEventListener('map:unavailable', release);
        if (map.hasAttribute('data-map-ready')) activate()
    }

    function note(selector, text) {
        const root = document.querySelector(selector);
        const p = document.createElement('p');
        p.setAttribute('role', 'status');
        p.textContent = text;
        (root.closest('[data-carousel]') || root).after(p)
    }
    const LISTS = [
        ['ministries', ministryCard],
        ['missionaries', missionaryCard, byDeparture]
    ];
    IBMty.register('page:about', {
        async prepare(app) {
            await Promise.all(LISTS.map(async ([name, template, order = (records) => records]) => {
                const selector = `[data-content="${name}"]`;
                try {
                    const records = await app.content.load(name);
                    app.content.fill(selector, order(records), (item) => template(item, app));
                    if (!records.length) note(selector, 'No hay información publicada en esta lista por ahora.')
                } catch (error) {
                    console.warn(`IBMty: ${name} unavailable`, error);
                    note(selector, 'No pudimos cargar esta lista. Recarga la página para volver a intentarlo.')
                }
            }))
        },
        init() {
            document.querySelectorAll('[data-years-since]').forEach((el) => {
                el.textContent = String(new Date().getFullYear() - Number(el.dataset.yearsSince))
            });
            stage()
        }
    })
})(self.IBMty = self.IBMty || {})