/*
 * Home page: countdown to the Sunday live broadcast ([data-countdown]) and the
 * motion only this page has (GSAP + ScrollTrigger): the hero photo drifts and its
 * copy recedes as the first sheet slides over it, the countdown cells settle from
 * the centre, and the QR's diamond ground turns into place. The shared sheet
 * motion lives in components/animations.js. Without GSAP or under reduced motion
 * nothing moves. Events come from assets/data/events.json.
 */
(function(IBMty) {
    'use strict';

    function eventCard(item, app) {
        const e = app.escapeHtml;
        const status = item.status === 'upcoming' ? 'event-status event-status--upcoming' : 'event-status';
        return `
      <article class="swiper-slide slide-card event-card" id="${e(item.id)}" data-share-scope="" data-label="${e(item.label)}" data-status="${e(item.status)}">
        <div class="slide-card__media">
          <img class="slide-card__photo" src="${e(app.root + item.image)}" alt="${e(item.imageAlt)}" width="1920" height="1080"${item.lazy ? ' loading="lazy"' : ''} decoding="async">
        </div>
        <div class="slide-card__body event-card__body">
          <h3 class="event-card__title">${e(item.title)}</h3>
          <p class="event-card__meta" data-share-part="">
            <span class="${status}">${e(item.statusText)}</span>
            <time datetime="${e(item.datetime)}">${e(item.date)}</time>${item.place ? ` ·<span class="nowrap">${e(item.place)}</span>` : ''}
          </p>
          <p class="event-card__text" data-share-part="">${e(item.text)}</p>
${IBMty.shareActions(app, item.image, item.links)}
        </div>
      </article>`
    }
    const pad = (value) => String(value).padStart(2, '0');

    function countdown(app) {
        const root = document.querySelector('[data-countdown]');
        if (!root) return;
        const fields = {
            days: root.querySelector('[data-unit="days"]'),
            hours: root.querySelector('[data-unit="hours"]'),
            minutes: root.querySelector('[data-unit="minutes"]'),
            seconds: root.querySelector('[data-unit="seconds"]')
        };
        const update = (unit, value) => {
            const text = pad(value);
            if (fields[unit].textContent !== text) fields[unit].textContent = text
        };
        const tick = () => {
            if (document.hidden) return;
            const {
                live,
                untilStart: left
            } = app.schedule.serviceState(new Date(), app.config);
            const state = live ? 'live' : 'waiting';
            if (root.dataset.state !== state) root.dataset.state = state;
            update('days', Math.floor(left / 86400));
            update('hours', Math.floor(left / 3600) % 24);
            update('minutes', Math.floor(left / 60) % 60);
            update('seconds', left % 60)
        };
        document.addEventListener('visibilitychange', tick);
        tick();
        setInterval(tick, 1000)
    }

    function motion() {
        if (typeof gsap !== 'object' || typeof ScrollTrigger !== 'function') return;
        gsap.registerPlugin(ScrollTrigger);
        gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', homeMotion)
    }

    function homeMotion() {
        const {
            toArray,
            distribute
        } = gsap.utils;
        const hero = document.querySelector('.hero');
        if (hero) {
            const leaving = {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: !0
            };
            gsap.to('.hero__photo', {
                yPercent: 14,
                scale: 1.08,
                ease: 'none',
                scrollTrigger: leaving
            });
            gsap.to('[data-hero-content]', {
                y: -60,
                autoAlpha: 0.15,
                ease: 'none',
                scrollTrigger: {
                    ...leaving,
                    end: '75% top'
                }
            })
        }
        const units = toArray('.countdown__unit');
        if (units.length) {
            gsap.from(units, {
                scale: 0.85,
                autoAlpha: 0,
                duration: 0.7,
                ease: 'back.out(1.6)',
                stagger: distribute({
                    amount: 0.3,
                    from: 'center'
                }),
                scrollTrigger: {
                    trigger: '.countdown',
                    start: 'top 80%',
                    once: !0
                }
            })
        }
        if (document.querySelector('.word__qr-ground')) {
            gsap.from('.word__qr-ground', {
                rotation: -45,
                scale: 0.7,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.word',
                    start: 'top 85%',
                    end: 'center 55%',
                    scrub: 0.8
                }
            })
        }
    }
    IBMty.register('page:home', {
        async prepare(app) {
            const root = document.querySelector('[data-content="events"]');
            try {
                const events = await app.content.load('events');
                app.content.fill('[data-content="events"]', events, (item) => eventCard(item, app));
                if (events.length) return;
                root.textContent = 'No hay eventos publicados por ahora. Consulta el horario del servicio más abajo.'
            } catch {
                root.textContent = 'No pudimos cargar los eventos.';
                const retry = document.createElement('button');
                retry.type = 'button';
                retry.className = 'btn-app btn-app--outline';
                retry.textContent = 'Volver a cargar';
                retry.addEventListener('click', () => location.reload());
                root.append(retry)
            }
        },
        init(app) {
            const links = document.querySelectorAll('[data-href-en]');
            links.forEach((link) => {
                link.dataset.hrefEs = link.getAttribute('href')
            });
            const localize = () => links.forEach((link) => {
                link.href = app.i18n.lang === 'en' ? link.dataset.hrefEn : link.dataset.hrefEs
            });
            localize();
            app.on('language-change', localize);
            countdown(app);
            motion()
        }
    })
})(self.IBMty = self.IBMty || {})