document.addEventListener('DOMContentLoaded', function() {
    var root = document.getElementById('live-stream');
    if (!root) return;
    var TIME_ZONE = 'America/Monterrey';
    var SERVICE_DAY = 0;
    var SERVICE_HOUR = 11;
    var SERVICE_MIN = 0;
    var LIVE_WINDOW_START_MIN = 650;
    var LIVE_WINDOW_END_MIN = 820;
    var POLL_MS = 900000;
    var TICK_MS = 1000;
    var LATEST_CACHE_KEY = 'ibmty_latest_video';
    var LATEST_TTL_MS = 30 * 60 * 1000;
    var videoBlock = document.getElementById('live-video-block');
    var kickerTextEl = document.getElementById('live-kicker-text');
    var digitEls = {
        days: document.getElementById('cd-days'),
        hours: document.getElementById('cd-hours'),
        mins: document.getElementById('cd-mins'),
        secs: document.getElementById('cd-secs')
    };
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tickTimer = null;
    var pollTimer = null;
    var windowTimer = null;
    var isActive = !1;
    var currentMode = null;
    var currentVideoId = null;
    var latestVideo = null;

    function partsOf(date, opts) {
        var p = {};
        new Intl.DateTimeFormat('en-US', opts).formatToParts(date).forEach(function(x) {
            p[x.type] = x.value
        });
        return p
    }

    function getTzOffsetMs(date) {
        var p = partsOf(date, {
            timeZone: TIME_ZONE,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
        return asUTC - date.getTime()
    }

    function zonedWallToUtc(y, mo, d, h, mi, s) {
        var guess = Date.UTC(y, mo, d, h, mi, s);
        return guess - getTzOffsetMs(new Date(guess))
    }

    function getZonedNowParts() {
        var p = partsOf(new Date(), {
            timeZone: TIME_ZONE,
            hourCycle: 'h23',
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        var weekdayMap = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6
        };
        return {
            year: +p.year,
            month: +p.month - 1,
            day: +p.day,
            weekday: weekdayMap[p.weekday],
            hour: +p.hour,
            minute: +p.minute
        }
    }

    function inLiveWindow() {
        var n = getZonedNowParts();
        if (n.weekday !== SERVICE_DAY) return !1;
        var mins = n.hour * 60 + n.minute;
        return mins >= LIVE_WINDOW_START_MIN && mins <= LIVE_WINDOW_END_MIN
    }

    function getNextServiceUtc() {
        var now = getZonedNowParts();
        var daysToSunday = (SERVICE_DAY - now.weekday + 7) % 7;
        var base = new Date(Date.UTC(now.year, now.month, now.day));
        base.setUTCDate(base.getUTCDate() + daysToSunday);
        var target = zonedWallToUtc(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), SERVICE_HOUR, SERVICE_MIN, 0);
        if (target <= Date.now()) {
            base.setUTCDate(base.getUTCDate() + 7);
            target = zonedWallToUtc(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), SERVICE_HOUR, SERVICE_MIN, 0)
        }
        return target
    }

    function getWindowCloseUtc() {
        var now = getZonedNowParts();
        return zonedWallToUtc(now.year, now.month, now.day, Math.floor(LIVE_WINDOW_END_MIN / 60), LIVE_WINDOW_END_MIN % 60, 0)
    }

    function getNextWindowOpenUtc() {
        var now = getZonedNowParts();
        var openH = Math.floor(LIVE_WINDOW_START_MIN / 60);
        var openM = LIVE_WINDOW_START_MIN % 60;
        var daysToSunday = (SERVICE_DAY - now.weekday + 7) % 7;
        var base = new Date(Date.UTC(now.year, now.month, now.day));
        base.setUTCDate(base.getUTCDate() + daysToSunday);
        var open = zonedWallToUtc(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), openH, openM, 0);
        if (open <= Date.now()) {
            base.setUTCDate(base.getUTCDate() + 7);
            open = zonedWallToUtc(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), openH, openM, 0)
        }
        return open
    }

    function setDigit(key, value) {
        var el = digitEls[key];
        if (!el) return;
        var text = String(value).padStart(2, '0');
        if (el.textContent === text) return;
        el.textContent = text;
        if (!prefersReducedMotion) {
            el.classList.remove('countdown-digit--tick');
            void el.offsetWidth;
            el.classList.add('countdown-digit--tick')
        }
    }

    function renderCountdown() {
        if (currentMode === 'live') {
            setDigit('days', 0);
            setDigit('hours', 0);
            setDigit('mins', 0);
            setDigit('secs', 0);
            return
        }
        var diff = getNextServiceUtc() - Date.now();
        if (diff < 0) diff = 0;
        var total = Math.floor(diff / 1000);
        setDigit('days', Math.floor(total / 86400));
        setDigit('hours', Math.floor((total % 86400) / 3600));
        setDigit('mins', Math.floor((total % 3600) / 60));
        setDigit('secs', total % 60)
    }

    function startTick() {
        if (tickTimer) return;
        renderCountdown();
        tickTimer = setInterval(renderCountdown, TICK_MS)
    }

    function stopTick() {
        if (tickTimer) {
            clearInterval(tickTimer);
            tickTimer = null
        }
    }

    function setVideoContent(buildFn) {
        if (prefersReducedMotion) {
            videoBlock.innerHTML = '';
            buildFn(videoBlock);
            return
        }
        videoBlock.classList.add('is-swapping');
        setTimeout(function() {
            videoBlock.innerHTML = '';
            buildFn(videoBlock);
            void videoBlock.offsetWidth;
            videoBlock.classList.remove('is-swapping')
        }, 200)
    }

    function buildVideo(target, videoId, title, isLive) {
        var safeTitle = title || (isLive ? 'Transmisión en vivo' : 'Último video');
        var src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?rel=0&modestbranding=1&playsinline=1' + (isLive ? '&autoplay=1&mute=1' : '');
        var watchUrl = 'https://www.youtube.com/watch?v=' + videoId;
        var head = document.createElement('div');
        head.className = 'live-player-head';
        if (isLive) {
            var badge = document.createElement('span');
            badge.className = 'live-badge';
            var dot = document.createElement('span');
            dot.className = 'live-badge-dot';
            dot.setAttribute('aria-hidden', 'true');
            badge.appendChild(dot);
            badge.appendChild(document.createTextNode('En vivo'));
            head.appendChild(badge)
        }
        var h3 = document.createElement('h3');
        h3.className = 'live-title text-clamp-2';
        h3.textContent = safeTitle;
        head.appendChild(h3);
        var videoWrap = document.createElement('div');
        videoWrap.className = 'live-video';
        var iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = safeTitle;
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
        iframe.loading = 'lazy';
        iframe.setAttribute('allowfullscreen', '');
        videoWrap.appendChild(iframe);
        var actions = document.createElement('div');
        actions.className = 'live-actions';
        var channelUrl = APP_CONFIG.youtube || 'https://www.youtube.com';
        var subscribeUrl = channelUrl + (channelUrl.includes('?') ? '&' : '?') + 'sub_confirmation=1';
        var subscribe = document.createElement('a');
        subscribe.className = 'btn-primary-pill';
        subscribe.href = subscribeUrl;
        subscribe.target = '_blank';
        subscribe.rel = 'noopener';
        var ytIcon = document.createElement('i');
        ytIcon.className = 'fa-brands fa-youtube me-1';
        ytIcon.setAttribute('aria-hidden', 'true');
        subscribe.appendChild(ytIcon);
        subscribe.appendChild(document.createTextNode('Suscríbete'));
        subscribe.setAttribute('data-track-category', 'youtube');
        subscribe.setAttribute('data-track-action', 'subscribe_click');
        subscribe.setAttribute('data-track-label', videoId);
        actions.appendChild(subscribe);
        var share = document.createElement('button');
        share.type = 'button';
        share.className = 'btn-secondary-pill';
        share.setAttribute('aria-label', 'Compartir');
        share.setAttribute('data-share-title', safeTitle);
        share.setAttribute('data-share-text', (isLive ? 'Transmisión en vivo de ' : 'Mira esto en ') + (APP_CONFIG.appName || 'IBMty'));
        share.setAttribute('data-share-url', watchUrl);
        var shareIcon = document.createElement('i');
        shareIcon.className = 'fa-solid fa-share';
        shareIcon.setAttribute('aria-hidden', 'true');
        share.appendChild(shareIcon);
        share.appendChild(document.createTextNode(' Compartir'));
        actions.appendChild(share);
        target.appendChild(head);
        target.appendChild(videoWrap);
        target.appendChild(actions)
    }

    function buildFallback(target) {
        var box = document.createElement('div');
        box.className = 'live-video live-video--loading';
        var link = document.createElement('a');
        link.className = 'btn-secondary-pill';
        link.href = APP_CONFIG.youtube || 'https://www.youtube.com';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Visítanos en YouTube';
        box.appendChild(link);
        target.appendChild(box)
    }

    function showVideo(videoId, title, isLive) {
        var mode = isLive ? 'live' : 'latest';
        if (currentVideoId === videoId && currentMode === mode) return;
        currentVideoId = videoId;
        currentMode = mode;
        if (kickerTextEl) kickerTextEl.textContent = isLive ? 'Transmisión en vivo ahora' : 'Próxima transmisión en vivo';
        setVideoContent(function(target) {
            buildVideo(target, videoId, title, isLive)
        });
        if (typeof trackEvent === 'function') {
            trackEvent('youtube', isLive ? 'live_loaded' : 'latest_loaded', mode, videoId)
        }
    }

    function showFallback() {
        if (currentMode === 'none') return;
        currentMode = 'none';
        currentVideoId = null;
        if (kickerTextEl) kickerTextEl.textContent = 'Próxima transmisión en vivo';
        setVideoContent(buildFallback)
    }

    function apiAvailable() {
        return !!((APP_CONFIG.youtubeApiKey || '').trim() && APP_CONFIG.youtubeChannelId)
    }

    function ytFetch(params) {
        var key = APP_CONFIG.youtubeApiKey.trim();
        var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=' + APP_CONFIG.youtubeChannelId + '&key=' + key + params;
        return fetch(url).then(function(r) {
            if (!r.ok) throw new Error('YouTube API ' + r.status);
            return r.json()
        }).then(function(data) {
            return data.items && data.items[0]
        })
    }

    function uploadsPlaylistId() {
        var ch = (APP_CONFIG.youtubeChannelId || '');
        return ch.indexOf('UC') === 0 ? 'UU' + ch.slice(2) : ch
    }

    function plFetch() {
        var key = APP_CONFIG.youtubeApiKey.trim();
        var url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=' + uploadsPlaylistId() + '&key=' + key;
        return fetch(url).then(function(r) {
            if (!r.ok) throw new Error('YouTube API ' + r.status);
            return r.json()
        }).then(function(data) {
            return data.items && data.items[0]
        })
    }

    function readLatestCache() {
        try {
            var obj = JSON.parse(sessionStorage.getItem(LATEST_CACHE_KEY) || 'null');
            if (!obj || !obj.id || !obj.ts) return null;
            if (Date.now() - obj.ts > LATEST_TTL_MS) return null;
            return {
                id: obj.id,
                title: obj.title
            }
        } catch (e) {
            return null
        }
    }

    function writeLatestCache(video) {
        try {
            sessionStorage.setItem(LATEST_CACHE_KEY, JSON.stringify({
                id: video.id,
                title: video.title,
                ts: Date.now()
            }))
        } catch (e) {}
    }

    function fetchLatest() {
        if (!apiAvailable()) {
            showFallback();
            return
        }
        plFetch().then(function(item) {
            var snip = item && item.snippet;
            var vid = snip && snip.resourceId && snip.resourceId.videoId;
            if (vid) {
                latestVideo = {
                    id: vid,
                    title: snip.title
                };
                writeLatestCache(latestVideo);
                if (currentMode !== 'live') showVideo(latestVideo.id, latestVideo.title, !1);
            } else if (currentMode !== 'live') {
                showFallback()
            }
        }).catch(function(err) {
            console.error('Latest video error:', err);
            if (currentMode !== 'live' && !currentVideoId) showFallback();
        })
    }

    function showLatest() {
        if (latestVideo) {
            showVideo(latestVideo.id, latestVideo.title, !1);
            return
        }
        var cached = readLatestCache();
        if (cached) {
            latestVideo = cached;
            showVideo(cached.id, cached.title, !1);
            return
        }
        fetchLatest()
    }

    function fallbackToLatest() {
        if (currentMode === 'live' || currentMode === null) showLatest()
    }

    function checkLive() {
        if (!apiAvailable()) {
            showFallback();
            return
        }
        ytFetch('&eventType=live').then(function(item) {
            var vid = item && item.id && item.id.videoId;
            if (vid) {
                latestVideo = null;
                showVideo(vid, item.snippet && item.snippet.title, !0);
                stopLivePolling()
            } else {
                fallbackToLatest()
            }
        }).catch(function(err) {
            console.error('Live check error:', err);
            fallbackToLatest()
        })
    }

    function startLivePolling() {
        if (pollTimer) return;
        checkLive();
        pollTimer = setInterval(checkLive, POLL_MS)
    }

    function stopLivePolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null
        }
    }

    function clearWindowTimer() {
        if (windowTimer) {
            clearTimeout(windowTimer);
            windowTimer = null
        }
    }

    function syncLiveSchedule() {
        clearWindowTimer();
        if (inLiveWindow()) {
            startLivePolling();
            windowTimer = setTimeout(function() {
                stopLivePolling();
                syncLiveSchedule()
            }, Math.max(1000, getWindowCloseUtc() - Date.now() + 1000))
        } else {
            showLatest();
            windowTimer = setTimeout(syncLiveSchedule, Math.max(1000, getNextWindowOpenUtc() - Date.now()))
        }
    }

    function activate() {
        if (isActive) return;
        isActive = !0;
        startTick();
        syncLiveSchedule()
    }

    function deactivate() {
        if (!isActive) return;
        isActive = !1;
        stopTick();
        stopLivePolling();
        clearWindowTimer()
    }

    function isInViewport() {
        var rect = root.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0
    }
    renderCountdown();
    var io = null;
    if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && document.visibilityState === 'visible') {
                    activate()
                } else {
                    deactivate()
                }
            })
        }, {
            threshold: 0.1
        });
        io.observe(root)
    } else {
        activate()
    }
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            if (!io || isInViewport()) activate();
        } else {
            deactivate()
        }
    })
})