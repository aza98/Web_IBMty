var MISSIONARIES = [{
    family: 'Gómez',
    name: 'Pablo, Karina, Joey, Tony y Kenny',
    country: 'TX, Estados Unidos',
    continent: 'Norteamérica',
    date: 'Febrero 2025',
    lat: 30.2672,
    lng: -97.7431,
    image: 'assets/images/misioneros/Misioneros_EU.webp'
}, {
    family: 'Arreola Valente',
    name: 'Eugenio, Socorro, Jeremy y Steven',
    country: 'Panamá',
    continent: 'Norteamérica',
    date: 'Agosto 2014',
    lat: 8.9824,
    lng: -79.5199,
    image: 'assets/images/misioneros/Misioneros_Panama.webp'
}, {
    family: 'Barbosa Ramírez',
    name: 'Daniel, Marlen, Christopher, Christian y Darlene',
    country: 'República Dominicana',
    continent: 'Norteamérica',
    date: 'Julio 2005',
    lat: 18.4861,
    lng: -69.9312,
    image: 'assets/images/misioneros/Misioneros_RepDom.webp'
}, {
    family: 'Zamarrón Carmona',
    name: 'Joel, Sandra, Joelito y Sofía',
    country: 'Sevilla, España',
    continent: 'Europa',
    date: 'Noviembre 2023',
    lat: 37.3826,
    lng: -5.9963,
    image: 'assets/images/misioneros/Misioneros_España_1.webp'
}, {
    family: 'Zamarrón López',
    name: 'Josué, Yessenia y Carolina',
    country: 'Sevilla, España',
    continent: 'Europa',
    date: 'Noviembre 2023',
    lat: 37.3946,
    lng: -5.9683,
    image: 'assets/images/misioneros/Misioneros_España_2.webp'
}, {
    family: 'Belenguer Puente',
    name: 'Andrés, Jocely, Carlos y Andrea',
    country: 'Sevilla, España',
    continent: 'Europa',
    date: 'Diciembre 2025',
    lat: 37.4046,
    lng: -6.0083,
    image: 'assets/images/misioneros/Misioneros_España_3.webp'
}, {
    name: 'Yeni Chaires Rodríguez',
    country: 'Sevilla, España',
    continent: 'Europa',
    date: '2026',
    lat: 37.3726,
    lng: -5.9603,
    image: 'assets/images/misioneros/Misioneros_España_4.webp'
}, {
    name: 'Loredana Rodríguez Sarmiento',
    country: 'Eslovaquia',
    continent: 'Europa',
    date: 'Enero 2017',
    lat: 48.1486,
    lng: 17.1077,
    image: 'assets/images/misioneros/Misioneros_Eslovakia.webp'
}, {
    family: 'Brown Karam',
    name: 'Kyle, Salma y Alexander',
    country: 'Sydney, Australia',
    continent: 'Oceanía',
    date: 'Noviembre 2024',
    lat: -33.8688,
    lng: 151.2093,
    image: 'assets/images/misioneros/Misioneros_Australia.webp'
}];
var TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
var TILE_OPTIONS = {
    maxZoom: 19,
    noWrap: !0,
    bounds: [
        [-85.05112878, -180],
        [85.05112878, 180]
    ],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};
var WORLD_BOUNDS = [
    [-90, -180],
    [90, 180]
];
var LATAM_BOUNDS = [
    [-56, -117],
    [33, -34]
];
var CONTINENT_ORDER = ['Norteamérica', 'Sudamérica', 'Europa', 'África', 'Asia', 'Oceanía'];

function _missionaryLabel(m, prefix) {
    var label = [m.family && 'Familia ' + m.family, m.name].filter(Boolean).join(': ');
    if (m.country) label += (label ? ' — ' : '') + m.country;
    return (prefix || '') + (label || 'Familia misionera')
}

function _groupByLocation(list, threshold) {
    var groups = [];
    list.forEach(function(m) {
        var group = groups.find(function(g) {
            return Math.abs(g.center[0] - m.lat) < threshold && Math.abs(g.center[1] - m.lng) < threshold
        });
        if (!group) {
            group = {
                items: [],
                center: [m.lat, m.lng]
            };
            groups.push(group)
        }
        group.items.push(m);
        var lat = 0,
            lng = 0;
        group.items.forEach(function(item) {
            lat += item.lat;
            lng += item.lng
        });
        group.center = [lat / group.items.length, lng / group.items.length]
    });
    groups.forEach(function(group) {
        var counts = Object.create(null),
            best = 0;
        group.label = '';
        group.items.forEach(function(m) {
            var country = m.country || '';
            counts[country] = (counts[country] || 0) + 1;
            if (counts[country] > best) {
                best = counts[country];
                group.label = country
            }
        })
    });
    return groups
}

function _mapElement(tag, className, text) {
    var element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element
}

function _missionaryImage(m) {
    var image = _mapElement('img', '');
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = _missionaryLabel(m, 'Fotografía de ');
    if (m.image) image.src = m.image;
    return image
}

function _missionaryMeta(parent, className, icon, text) {
    if (!text) return;
    var line = _mapElement('p', 'missionary-card-meta ' + className);
    line.append(makeIcon(icon), document.createTextNode(' ' + text));
    parent.appendChild(line)
}

function _missionaryName(parent, m, grouped) {
    if (m.family) parent.appendChild(_mapElement('p', 'missionary-card-family', 'Familia ' + m.family));
    parent.appendChild(_mapElement(grouped ? 'p' : 'h3', grouped ? 'missionary-group-name' : 'missionary-card-name', m.name || (m.family ? 'Familia ' + m.family : 'Familia misionera')))
}

function _buildGroupItem(m) {
    var item = _mapElement('li', 'missionary-group-item');
    var thumb = _mapElement('div', 'missionary-group-thumb');

    function fallback() {
        thumb.classList.add('missionary-group-thumb--empty');
        thumb.replaceChildren(makeIcon('users'))
    }
    if (m.image) {
        var image = _missionaryImage(m);
        image.addEventListener('error', fallback, {
            once: !0
        });
        thumb.appendChild(image)
    } else fallback();
    var info = _mapElement('div', 'missionary-group-info');
    _missionaryName(info, m, !0);
    _missionaryMeta(info, 'missionary-card-date', 'calendar', m.date);
    item.append(thumb, info);
    return item
}

function _buildPopupContent(group, map) {
    var multiple = group.items.length > 1;
    var card = _mapElement('div', 'missionary-card' + (multiple ? ' missionary-card--group' : ''));
    var close = _mapElement('button', 'ctrl-app ctrl-app--surface ctrl-app--md popup-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar');
    close.appendChild(makeIcon('x'));
    close.addEventListener('click', function() {
        map.closePopup()
    });
    if (multiple) {
        var heading = _mapElement('div', 'missionary-group-head');
        heading.append(_mapElement('p', 'missionary-card-family', group.items.length + ' familias'), _mapElement('h3', 'missionary-card-name', group.label || 'Misioneros'));
        var list = _mapElement('ul', 'missionary-group-list');
        group.items.forEach(function(m) {
            list.appendChild(_buildGroupItem(m))
        });
        card.append(close, heading, list);
        return card
    }
    var m = group.items[0];
    var media = _mapElement('div', 'missionary-card-media');
    var image = _missionaryImage(m);
    image.className = 'missionary-card-img';
    image.width = 965;
    image.height = 1080;
    image.addEventListener('error', function() {
        media.classList.add('missionary-card-media--empty')
    }, {
        once: !0
    });
    if (!m.image) media.classList.add('missionary-card-media--empty');
    var fallback = _mapElement('div', 'missionary-card-fallback');
    fallback.setAttribute('aria-hidden', 'true');
    fallback.appendChild(makeIcon('users'));
    media.append(image, fallback);
    var body = _mapElement('div', 'missionary-card-body');
    _missionaryName(body, m, !1);
    _missionaryMeta(body, 'missionary-card-country', 'map-pin', m.country);
    _missionaryMeta(body, 'missionary-card-date', 'calendar', m.date);
    card.append(media, close, body);
    return card
}

function _initContinentNav(map, allBounds, byContinent, isMobile) {
    var nav = document.getElementById('misioneros-continents');
    if (!nav) return;
    nav.replaceChildren();

    function addButton(label, count, bounds, maxZoom, all) {
        var button = _mapElement('button', 'btn btn-app btn-app--secondary btn-app--compact misioneros-continent-btn', label);
        button.type = 'button';
        button.appendChild(_mapElement('span', 'misioneros-continent-count', count));
        button.setAttribute('aria-label', label + ': ' + count + ' misioneros');
        button.setAttribute('aria-pressed', all && !isMobile ? 'true' : 'false');
        if (all) button.classList.add('misioneros-continent-btn--all');
        button.addEventListener('click', function() {
            Array.from(nav.children).forEach(function(item) {
                item.setAttribute('aria-pressed', item === button ? 'true' : 'false')
            });
            if (!bounds.isValid()) return;
            var options = {
                padding: [40, 40],
                maxZoom: maxZoom
            };
            map.stop();
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                options.animate = !1;
                map.fitBounds(bounds, options)
            } else map.flyToBounds(bounds, options)
        });
        nav.appendChild(button)
    }
    var total = 0;
    CONTINENT_ORDER.forEach(function(continent) {
        total += (byContinent[continent] || []).length
    });
    addButton('Mapa completo', total, allBounds, 6, !0);
    CONTINENT_ORDER.forEach(function(continent) {
        var points = byContinent[continent];
        if (points && points.length) addButton(continent, points.length, L.latLngBounds(points), 5, !1)
    })
}

function _initTwoFingerPan(map, container) {
    if (!window.matchMedia('(hover: none)').matches) return;
    map.dragging.disable();

    function syncDragging(event) {
        if (event.touches.length > 1) map.dragging.enable();
        else map.dragging.disable()
    } ['touchstart', 'touchend', 'touchcancel'].forEach(function(event) {
        container.addEventListener(event, syncDragging, {
            passive: !0
        })
    })
    map.on('unload', function() {
        ['touchstart', 'touchend', 'touchcancel'].forEach(function(event) {
            container.removeEventListener(event, syncDragging)
        })
    })
}

function initMissionariesMap() {
    var container = document.getElementById('missionaries-map');
    if (!container || typeof L === 'undefined') return;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var isMobile = window.matchMedia('(max-width: 767.98px)').matches;
    var map = L.map(container, {
        scrollWheelZoom: !1,
        zoomSnap: .25,
        zoomDelta: .5,
        inertia: !motion.matches,
        zoomAnimation: !motion.matches,
        fadeAnimation: !motion.matches,
        markerZoomAnimation: !motion.matches,
        minZoom: 2,
        maxBounds: WORLD_BOUNDS,
        maxBoundsViscosity: 1,
        zoomControl: !1
    });

    function syncMotion() {
        map.stop();
        map.options.inertia = !motion.matches;
        container.classList.toggle('leaflet-fade-anim', !motion.matches)
    }
    motion.addEventListener('change', syncMotion);
    L.control.zoom({
        position: 'bottomright',
        zoomInTitle: 'Acercar',
        zoomOutTitle: 'Alejar'
    }).addTo(map);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
    var valid = MISSIONARIES.filter(function(m) {
        return typeof m.lat === 'number' && typeof m.lng === 'number'
    });
    var byContinent = {};
    valid.forEach(function(m) {
        if (!m.continent) return;
        if (!byContinent[m.continent]) byContinent[m.continent] = [];
        byContinent[m.continent].push([m.lat, m.lng])
    });
    var groups = _groupByLocation(valid, .6);
    var bounds = groups.map(function(group) {
        return group.center
    });
    groups.forEach(function(group) {
        var multiple = group.items.length > 1;
        var pin = _mapElement('span', 'missionary-marker-pin' + (multiple ? ' missionary-marker-pin--cluster' : ''));
        if (multiple) pin.textContent = group.items.length;
        else pin.appendChild(makeIcon('map-pin'));
        var label = multiple ? group.items.length + ' familias misioneras en ' + group.label : _missionaryLabel(group.items[0]);
        var marker = L.marker(group.center, {
            icon: L.divIcon({
                className: 'missionary-marker',
                html: pin,
                iconSize: [44, 44],
                iconAnchor: [22, 22],
                popupAnchor: [0, -22]
            }),
            title: label,
            alt: label,
            keyboard: !0
        }).bindPopup(function() {
            return _buildPopupContent(group, map)
        }, {
            closeButton: !1,
            maxWidth: 280,
            autoPanPadding: [24, 24],
            autoPanPaddingTopLeft: [24, 68],
            autoPanPaddingBottomRight: [24, 64]
        });
        marker.on('add', function() {
            var element = marker.getElement();
            element.setAttribute('aria-label', label);
            element.addEventListener('keydown', function(event) {
                if (event.key === ' ' || event.key === 'Spacebar') {
                    event.preventDefault();
                    marker.openPopup()
                }
            })
        });
        marker.on('popupopen', function() {
            marker.getPopup().getElement().querySelector('.popup-close').focus()
        });
        marker.on('popupclose', function() {
            var element = marker.getElement();
            if (element) element.focus()
        });
        marker.addTo(map)
    });
    if (isMobile) map.fitBounds(LATAM_BOUNDS, {
        padding: [20, 20]
    });
    else if (bounds.length > 1) map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 6
    });
    else if (bounds.length) map.setView(bounds[0], 5);
    else map.setView([20, 0], 2);
    map.whenReady(function() {
        _initTwoFingerPan(map, container)
    });
    if (bounds.length) _initContinentNav(map, L.latLngBounds(bounds), byContinent, isMobile);
    map.on('unload', function() {
        motion.removeEventListener('change', syncMotion)
    })
}
document.addEventListener('DOMContentLoaded', initMissionariesMap)