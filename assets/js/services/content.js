/*
 * Repeated records kept as data: assets/data/<name>.json (events, ministries,
 * missionaries). Paths inside the JSON are relative to the site root.
 * Pages render them in their prepare() step (core/app.js), so carousels, the map,
 * sharing and animations find the markup when they start.
 * IBMty.content { load(name), fill(selector, records, template) }.
 */
(function(IBMty) {
    'use strict';
    async function load(name) {
        const response = await fetch(IBMty.url(`assets/data/${name}.json`));
        if (!response.ok) throw new Error(`${name}.json ${response.status}`);
        return response.json()
    }

    function fill(selector, records, template) {
        const container = document.querySelector(selector);
        if (!container) return;
        container.innerHTML = records.map(template).join('');
        let id = location.hash.slice(1);
        try {
            id = decodeURIComponent(id)
        } catch {}
        const target = id && document.getElementById(id);
        if (target && container.contains(target)) requestAnimationFrame(() => target.scrollIntoView({
            block: 'start'
        }))
    }
    IBMty.content = {
        load,
        fill
    }
})(self.IBMty = self.IBMty || {})