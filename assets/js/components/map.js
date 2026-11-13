/*
 * Leaflet stage on [data-map]: the map half of the missionary stage on About.
 * Markers come from the list it points to (data-map-list="<id>"): each [data-lat][data-lng]
 * item is a place, so the list stays readable without JavaScript, offline or without Leaflet.
 *
 * The page owns the selection; the map follows it and reports taps:
 *   in   `map:focus` {index}   draw the route from Monterrey and fit both ends
 *   out  `map:ready`           (also data-map-ready) the stage can rely on the map
 *   out  `map:select` {index}  a marker was tapped or activated with the keyboard
 *   out  `map:unavailable`     tiles never loaded: the page shows the plain list
 * [data-map-cover] beside the map is an element floating over it (the desktop panel):
 * fitted routes keep clear of it.
 *
 * Phones move the map through the card, the markers and the zoom pill, never with a
 * one-finger drag, so scrolling the page never gets caught by the map.
 * Nearby places merge into a numbered cluster (Leaflet.markercluster); the selected
 * marker leaves its cluster so it is always visible.
 * OpenStreetMap tiles: attribution stays visible; only viewed tiles load.
 */
(function(IBMty) {
    'use strict';
    const ORIGIN = [25.6866, -100.3161];
    const nearOrigin = (lng) => lng - ORIGIN[1] > 180 ? lng - 360 : lng - ORIGIN[1] < -180 ? lng + 360 : lng;

    function arc(to) {
        const [lat0, lng0] = ORIGIN;
        const [lat1, lng1] = to;
        const side = 0.18 * (Math.sign(lng1 - lng0) || 1);
        const control = [(lat0 + lat1) / 2 + (lng1 - lng0) * side, (lng0 + lng1) / 2 - (lat1 - lat0) * side];
        const points = [];
        for (let i = 0; i <= 48; i++) {
            const t = i / 48;
            const u = 1 - t;
            points.push([u * u * lat0 + 2 * u * t * control[0] + t * t * lat1, u * u * lng0 + 2 * u * t * control[1] + t * t * lng1])
        }
        return points
    }
    const clusterIcon = (cluster) => L.divIcon({
        className: 'map-cluster',
        html: `<span>${cluster.getChildCount()}</span>`,
        iconSize: [44, 44]
    });

    function start(el) {
        const list = document.getElementById(el.dataset.mapList);
        const items = Array.from(list?.querySelectorAll('[data-lat][data-lng]') || []);
        el.hidden = !items.length;
        if (el.hidden) return;
        const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
        const emit = (type, detail) => el.dispatchEvent(new CustomEvent(type, {
            bubbles: !0,
            detail
        }));
        const map = L.map(el, {
            zoomControl: !1,
            attributionControl: !1,
            scrollWheelZoom: !1,
            dragging: !L.Browser.mobile,
            minZoom: Math.max(1, Math.ceil(Math.log2(el.clientHeight / 256))),
            maxBounds: [
                [-85, -540],
                [85, 540]
            ],
            maxBoundsViscosity: 1
        });
        L.control.zoom({
            position: 'bottomright',
            zoomInTitle: 'Acercar',
            zoomOutTitle: 'Alejar'
        }).addTo(map);
        L.control.attribution({
            position: 'bottomleft',
            prefix: !1
        }).addTo(map);
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            crossOrigin: !0,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker(ORIGIN, {
            icon: L.divIcon({
                className: 'map-origin',
                iconSize: [32, 32]
            }),
            interactive: !1,
            keyboard: !1
        }).bindTooltip('Monterrey', {
            permanent: !0,
            direction: 'bottom',
            offset: [0, 10],
            className: 'map-origin__label'
        }).addTo(map);
        const route = L.polyline([], {
            className: 'map-route',
            interactive: !1
        }).addTo(map);
        const cluster = L.markerClusterGroup({
            showCoverageOnHover: !1,
            maxClusterRadius: 48,
            iconCreateFunction: clusterIcon
        }).addTo(map);
        const markers = items.map((item, index) => {
            const marker = L.marker([Number(item.dataset.lat), nearOrigin(Number(item.dataset.lng))], {
                icon: L.divIcon({
                    className: 'map-marker',
                    iconSize: [32, 32]
                }),
                title: item.querySelector('[data-map-title]').textContent,
                keyboard: !0
            });
            marker.on('click', () => emit('map:select', {
                index
            }));
            cluster.addLayer(marker);
            return marker
        });
        const cover = el.parentElement.querySelector('[data-map-cover]');
        const insetLeft = () => cover && getComputedStyle(cover).position === 'absolute' ? cover.offsetLeft + cover.offsetWidth + 24 : 32;
        let current = -1;

        function focus(index, animate) {
            const marker = markers[index];
            if (!marker) return;
            if (markers[current] && current !== index) {
                markers[current].getElement()?.classList.remove('is-current');
                map.removeLayer(markers[current]);
                cluster.addLayer(markers[current])
            }
            if (current !== index) {
                cluster.removeLayer(marker);
                marker.setZIndexOffset(1000).addTo(map);
                marker.getElement()?.classList.add('is-current')
            }
            current = index;
            const path = arc([marker.getLatLng().lat, marker.getLatLng().lng]);
            route.setLatLngs(path);
            const fit = {
                paddingTopLeft: [insetLeft(), 40],
                paddingBottomRight: [40, 56],
                maxZoom: 5
            };
            if (animate && !reduced()) map.flyToBounds(L.latLngBounds(path), {
                ...fit,
                duration: 0.9
            });
            else map.fitBounds(L.latLngBounds(path), fit)
        }
        el.addEventListener('map:focus', (event) => focus(Number(event.detail.index), event.detail.animate !== !1));
        let resizing;
        map.on('resize', () => {
            clearTimeout(resizing);
            resizing = setTimeout(() => current >= 0 && focus(current, !1), 150)
        });
        let loaded = !1;
        tiles.once('tileload', () => {
            loaded = !0
        });
        tiles.once('tileerror', () => {
            if (loaded) return;
            el.hidden = !0;
            delete el.dataset.mapReady;
            emit('map:unavailable')
        });
        el.dataset.mapReady = '';
        emit('map:ready')
    }
    IBMty.register('component:map', {
        init(app) {
            if (!app.config.features.map || typeof L === 'undefined' || !L.markerClusterGroup) return;
            document.querySelectorAll('[data-map]').forEach(start)
        }
    })
})(self.IBMty = self.IBMty || {})