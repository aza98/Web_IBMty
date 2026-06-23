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
var TILE_THEMES = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};
var TILE_OPTIONS = {
    subdomains: 'abcd',
    maxZoom: 20,
    detectRetina: !0,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

function _currentMapTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function pin(html, size) {
    var h = size / 2;
    return L.divIcon({
        className: 'missionary-marker',
        html: html,
        iconSize: [size, size],
        iconAnchor: [h, h],
        popupAnchor: [0, -h]
    })
}

function initMissionariesMap() {
    var container = document.getElementById('missionaries-map');
    if (!container || typeof L === 'undefined') return;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var map = L.map(container, {
        scrollWheelZoom: !1,
        zoomAnimation: !reducedMotion,
        fadeAnimation: !reducedMotion,
        markerZoomAnimation: !reducedMotion
    });
    var activeTheme = _currentMapTheme();
    var tileLayer = L.tileLayer(TILE_THEMES[activeTheme], TILE_OPTIONS).addTo(map);
    var markerIcon = pin('<span class="missionary-marker-pin">' + '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>' + '</span>', 32);
    var clusterIcon = function(n) {
        return pin('<span class="missionary-marker-pin missionary-marker-pin--cluster">' + n + '</span>', 34)
    };
    var byContinent = {};
    var valid = MISSIONARIES.filter(function(m) {
        return typeof m.lat === 'number' && typeof m.lng === 'number'
    });
    valid.forEach(function(m) {
        if (!m.continent) return;
        if (!byContinent[m.continent]) byContinent[m.continent] = [];
        byContinent[m.continent].push([m.lat, m.lng])
    });
    var groups = _groupByLocation(valid, 0.6);
    var bounds = [];
    groups.forEach(function(g) {
        var multiple = g.items.length > 1;
        var label = multiple ? (g.items.length + ' familias misioneras en ' + g.label) : _missionaryLabel(g.items[0], '');
        var marker = L.marker(g.center, {
            icon: multiple ? clusterIcon(g.items.length) : markerIcon,
            title: label,
            alt: label,
            keyboard: !0
        }).addTo(map);
        marker.bindPopup(_buildPopupContent(g, map), {
            closeButton: !1,
            maxWidth: 280,
            autoPanPadding: [24, 24]
        });
        var el = marker.getElement();
        if (el) {
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', label);
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
            el.addEventListener('keydown', function(ev) {
                if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
                    ev.preventDefault();
                    marker.openPopup()
                }
            })
        }
        bounds.push(g.center)
    });
    if (bounds.length > 1) {
        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 6
        })
    } else if (bounds.length === 1) {
        map.setView(bounds[0], 5)
    } else {
        map.setView([20, 0], 2)
    }
    if (bounds.length) {
        _initContinentNav(map, L.latLngBounds(bounds), byContinent, reducedMotion)
    }
    map.on('popupopen', function(e) {
        var popupEl = e.popup.getElement();
        if (!popupEl) return;
        var btn = popupEl.querySelector('.popup-close');
        if (btn) btn.focus();
    });
    map.on('popupclose', function(e) {
        var src = e.popup._source;
        if (src && typeof src.getElement === 'function') {
            var srcEl = src.getElement();
            if (srcEl) srcEl.focus();
        }
    });
    var themeObserver = new MutationObserver(function() {
        var next = _currentMapTheme();
        if (next === activeTheme) return;
        activeTheme = next;
        map.removeLayer(tileLayer);
        tileLayer = L.tileLayer(TILE_THEMES[next], TILE_OPTIONS).addTo(map)
    });
    themeObserver.observe(document.documentElement, {
        attributes: !0,
        attributeFilter: ['data-theme']
    })
}
var CONTINENT_ORDER = ['Norteamérica', 'Sudamérica', 'Europa', 'África', 'Asia', 'Oceanía'];

function _makeContinentBtn(label, count) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'misioneros-continent-btn';
    b.appendChild(document.createTextNode(label));
    var badge = document.createElement('span');
    badge.className = 'misioneros-continent-count';
    badge.textContent = count;
    b.appendChild(badge);
    b.setAttribute('aria-label', label + ': ' + count + ' misioneros');
    b.setAttribute('aria-pressed', 'false');
    return b
}

function _initContinentNav(map, allBounds, byContinent, reducedMotion) {
    var nav = document.getElementById('misioneros-continents');
    if (!nav) return;
    nav.innerHTML = '';
    var buttons = [];

    function setActive(active) {
        buttons.forEach(function(b) {
            b.setAttribute('aria-pressed', b === active ? 'true' : 'false')
        })
    }

    function go(targetBounds, maxZoom, btn) {
        setActive(btn);
        if (!targetBounds || !targetBounds.isValid()) return;
        var opts = {
            padding: [40, 40],
            maxZoom: maxZoom
        };
        if (reducedMotion) {
            map.fitBounds(targetBounds, opts)
        } else {
            map.flyToBounds(targetBounds, opts)
        }
    }
    var total = 0;
    CONTINENT_ORDER.forEach(function(cont) {
        if (byContinent[cont]) total += byContinent[cont].length
    });
    var allBtn = _makeContinentBtn('Mapa completo', total);
    allBtn.addEventListener('click', function() {
        go(allBounds, 6, allBtn)
    });
    buttons.push(allBtn);
    nav.appendChild(allBtn);
    CONTINENT_ORDER.forEach(function(cont) {
        var pts = byContinent[cont];
        if (!pts || !pts.length) return;
        var contBounds = L.latLngBounds(pts);
        var btn = _makeContinentBtn(cont, pts.length);
        btn.addEventListener('click', function() {
            go(contBounds, 5, btn)
        });
        buttons.push(btn);
        nav.appendChild(btn)
    });
    setActive(allBtn)
}

function _groupByLocation(list, threshold) {
    var groups = [];
    list.forEach(function(m) {
        var found = null;
        for (var i = 0; i < groups.length; i++) {
            var c = groups[i].center;
            if (Math.abs(c[0] - m.lat) < threshold && Math.abs(c[1] - m.lng) < threshold) {
                found = groups[i];
                break
            }
        }
        if (!found) {
            found = {
                items: [],
                center: [m.lat, m.lng]
            };
            groups.push(found)
        }
        found.items.push(m);
        var la = 0,
            ln = 0;
        found.items.forEach(function(x) {
            la += x.lat;
            ln += x.lng
        });
        found.center = [la / found.items.length, ln / found.items.length]
    });
    groups.forEach(function(g) {
        var counts = {},
            best = '',
            bestN = 0;
        g.items.forEach(function(x) {
            var k = x.country || '';
            counts[k] = (counts[k] || 0) + 1;
            if (counts[k] > bestN) {
                bestN = counts[k];
                best = k
            }
        });
        g.label = best
    });
    return groups
}

function _missionaryLabel(m, prefix) {
    var parts = [];
    if (m.family) parts.push('Familia ' + m.family);
    if (m.name) parts.push(m.name);
    var label = parts.join(': ');
    if (m.country) label += (label ? ' — ' : '') + m.country;
    return (prefix || '') + (label || 'Familia misionera')
}

function _buildGroupItem(m) {
    var li = document.createElement('li');
    li.className = 'missionary-group-item';
    var thumb = document.createElement('div');
    thumb.className = 'missionary-group-thumb';
    if (m.image) {
        var img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = _missionaryLabel(m, 'Fotografía de ');
        img.src = m.image;
        img.addEventListener('error', function() {
            thumb.classList.add('missionary-group-thumb--empty');
            thumb.innerHTML = '<i class="fa-solid fa-people-group" aria-hidden="true"></i>'
        });
        thumb.appendChild(img)
    } else {
        thumb.classList.add('missionary-group-thumb--empty');
        thumb.innerHTML = '<i class="fa-solid fa-people-group" aria-hidden="true"></i>'
    }
    li.appendChild(thumb);
    var info = document.createElement('div');
    info.className = 'missionary-group-info';
    if (m.family) {
        var fam = document.createElement('p');
        fam.className = 'missionary-card-family';
        fam.textContent = 'Familia ' + m.family;
        info.appendChild(fam)
    }
    var name = document.createElement('p');
    name.className = 'missionary-group-name';
    name.textContent = m.name || (m.family ? 'Familia ' + m.family : 'Familia misionera');
    info.appendChild(name);
    if (m.date) {
        var date = document.createElement('p');
        date.className = 'missionary-card-meta missionary-card-date';
        date.innerHTML = '<i class="fa-regular fa-calendar" aria-hidden="true"></i>';
        date.appendChild(document.createTextNode(' ' + m.date));
        info.appendChild(date)
    }
    li.appendChild(info);
    return li
}

function _buildPopupContent(g, map) {
    var items = g.items;
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'popup-close';
    close.setAttribute('aria-label', 'Cerrar');
    close.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    close.addEventListener('click', function() {
        map.closePopup()
    });
    if (items.length > 1) {
        var group = document.createElement('div');
        group.className = 'missionary-card missionary-card--group';
        group.appendChild(close);
        var head = document.createElement('div');
        head.className = 'missionary-group-head';
        var hk = document.createElement('p');
        hk.className = 'missionary-card-family';
        hk.textContent = items.length + ' familias';
        head.appendChild(hk);
        var hl = document.createElement('h3');
        hl.className = 'missionary-card-name';
        hl.textContent = g.label || 'Misioneros';
        head.appendChild(hl);
        group.appendChild(head);
        var list = document.createElement('ul');
        list.className = 'missionary-group-list';
        items.forEach(function(m) {
            list.appendChild(_buildGroupItem(m))
        });
        group.appendChild(list);
        return group
    }
    var m = items[0];
    var card = document.createElement('div');
    card.className = 'missionary-card';
    var media = document.createElement('div');
    media.className = 'missionary-card-media';
    var img = document.createElement('img');
    img.className = 'missionary-card-img';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 965;
    img.height = 1080;
    img.alt = _missionaryLabel(m, 'Fotografía de ');
    if (m.image) img.src = m.image;
    var fallback = document.createElement('div');
    fallback.className = 'missionary-card-fallback';
    fallback.setAttribute('aria-hidden', 'true');
    fallback.innerHTML = '<i class="fa-solid fa-people-group"></i>';
    img.addEventListener('error', function() {
        media.classList.add('missionary-card-media--empty')
    });
    if (!m.image) media.classList.add('missionary-card-media--empty');
    media.appendChild(img);
    media.appendChild(fallback);
    card.appendChild(media);
    card.appendChild(close);
    var body = document.createElement('div');
    body.className = 'missionary-card-body';
    if (m.family) {
        var fam = document.createElement('p');
        fam.className = 'missionary-card-family';
        fam.textContent = 'Familia ' + m.family;
        body.appendChild(fam)
    }
    var name = document.createElement('h3');
    name.className = 'missionary-card-name';
    name.textContent = m.name || (m.family ? 'Familia ' + m.family : 'Familia misionera');
    body.appendChild(name);
    if (m.country) {
        var country = document.createElement('p');
        country.className = 'missionary-card-meta missionary-card-country';
        country.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>';
        country.appendChild(document.createTextNode(' ' + m.country));
        body.appendChild(country)
    }
    if (m.date) {
        var date = document.createElement('p');
        date.className = 'missionary-card-meta missionary-card-date';
        date.innerHTML = '<i class="fa-regular fa-calendar" aria-hidden="true"></i>';
        date.appendChild(document.createTextNode(' ' + m.date));
        body.appendChild(date)
    }
    card.appendChild(body);
    return card
}
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('missionaries-map')) initMissionariesMap();
})