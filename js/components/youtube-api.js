document.addEventListener('DOMContentLoaded', function() {
    var root = document.getElementById('live-stream');
    if (!root) return;
    var videoBlock = document.getElementById('live-video-block');
    if (!videoBlock) return;
    var TIME_ZONE = 'America/Monterrey';
    var SERVICE_DAY = 0;
    var SERVICE_HOUR = 11;
    var SERVICE_MIN = 0;
    var LIVE_WINDOW_START_MIN = 650;
    var LIVE_WINDOW_END_MIN = 820;
    var POLL_MS = 15 * 60 * 1000;
    var TICK_MS = 1000;
    var CACHE_KEY_SESSION = 'ibmty_latest_video';
    var CACHE_KEY_LOCAL = 'ibmty_latest_video_persistent';
    var CACHE_KEY_QUOTA = 'ibmty_yt_quota_exceeded';
    var CACHE_TTL_MS = 30 * 60 * 1000;
    var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
    var kickerTextEl = document.getElementById('live-kicker-text');
    var digitEls = {
        days: document.getElementById('cd-days'),
        hours: document.getElementById('cd-hours'),
        mins: document.getElementById('cd-mins'),
        secs: document.getElementById('cd-secs')
    };
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
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
        var closeMin = LIVE_WINDOW_END_MIN + 1;
        return zonedWallToUtc(now.year, now.month, now.day, Math.floor(closeMin / 60), closeMin % 60, 0)
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
        if (!motionPreference.matches) {
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

    function refreshScrollTrigger() {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    function setVideoContent(buildFn) {
        if (motionPreference.matches) {
            videoBlock.innerHTML = '';
            buildFn(videoBlock);
            refreshScrollTrigger();
            return
        }
        videoBlock.classList.add('is-swapping');
        setTimeout(function() {
            videoBlock.innerHTML = '';
            buildFn(videoBlock);
            void videoBlock.offsetWidth;
            videoBlock.classList.remove('is-swapping');
            refreshScrollTrigger()
        }, 200)
    }

    function buildVideo(target, videoId, title, isLive) {
        var safeTitle = title || (isLive ? 'Transmisión en vivo' : 'Último video');
        var encodedId = encodeURIComponent(videoId);
        var origin = encodeURIComponent(window.location.origin || '');
        var src = 'https://www.youtube-nocookie.com/embed/' + encodedId + '?rel=0&modestbranding=1&playsinline=1&enablejsapi=1' + (origin ? '&origin=' + origin : '') + (isLive ? '&autoplay=1&mute=1' : '');
        var watchUrl = 'https://www.youtube.com/watch?v=' + encodedId;
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
        iframe.loading = 'lazy';
        iframe.setAttribute('allowfullscreen', '');
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        videoWrap.appendChild(iframe);
        var actions = document.createElement('div');
        actions.className = 'live-actions';
        var channelUrl = config.youtube || 'https://www.youtube.com';
        var subscribeUrl = channelUrl + (channelUrl.includes('?') ? '&' : '?') + 'sub_confirmation=1';
        var subscribe = document.createElement('a');
        subscribe.className = 'btn btn-app btn-app--secondary';
        subscribe.href = subscribeUrl;
        subscribe.target = '_blank';
        subscribe.rel = 'noopener';
        if (typeof makeIcon === 'function') subscribe.appendChild(makeIcon('brand-youtube', 'me-1'));
        subscribe.appendChild(document.createTextNode('Suscríbete'));
        subscribe.setAttribute('data-track-category', 'youtube');
        subscribe.setAttribute('data-track-action', 'subscribe_click');
        subscribe.setAttribute('data-track-label', videoId);
        actions.appendChild(subscribe);
        var share = document.createElement('button');
        share.type = 'button';
        share.className = 'btn btn-app btn-app--secondary';
        share.setAttribute('aria-label', 'Compartir');
        share.setAttribute('data-share-title', safeTitle);
        share.setAttribute('data-share-text', (isLive ? 'Transmisión en vivo de ' : 'Mira esto en ') + (config.appName || 'IBMty'));
        share.setAttribute('data-share-url', watchUrl);
        if (typeof makeIcon === 'function') share.appendChild(makeIcon('share-2'));
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
        link.className = 'btn btn-app btn-app--secondary';
        link.href = config.youtube || 'https://www.youtube.com';
        link.target = '_blank';
        link.rel = 'noopener';
        if (typeof makeIcon === 'function') link.appendChild(makeIcon('brand-youtube', 'me-1'));
        link.appendChild(document.createTextNode(' Visítanos en YouTube'));
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
            trackEvent('youtube', isLive ? 'live_loaded' : 'latest_loaded', mode)
        }
    }

    function showFallback() {
        if (currentMode === 'none') return;
        currentMode = 'none';
        currentVideoId = null;
        if (kickerTextEl) kickerTextEl.textContent = 'Próxima transmisión en vivo';
        setVideoContent(buildFallback)
    }

    function isQuotaExceeded() {
        try {
            return sessionStorage.getItem(CACHE_KEY_QUOTA) === '1'
        } catch {
            return !1
        }
    }

    function markQuotaExceeded() {
        try {
            sessionStorage.setItem(CACHE_KEY_QUOTA, '1');
            console.warn('YouTube API: Cuota diaria alcanzada o restringida. Usando caché local.')
        } catch {}
    }

    function readLatestCache() {
        try {
            var session = sessionStorage.getItem(CACHE_KEY_SESSION);
            if (session) {
                var sObj = JSON.parse(session);
                if (sObj && sObj.id && (Date.now() - sObj.ts < CACHE_TTL_MS)) {
                    return sObj
                }
            }
            var persistent = localStorage.getItem(CACHE_KEY_LOCAL);
            if (persistent) {
                var pObj = JSON.parse(persistent);
                if (pObj && pObj.id) {
                    return pObj
                }
            }
        } catch {}
        return null
    }

    function writeLatestCache(video) {
        if (!video || !video.id) return;
        var payload = JSON.stringify({
            id: video.id,
            title: video.title || '',
            ts: Date.now()
        });
        try {
            sessionStorage.setItem(CACHE_KEY_SESSION, payload)
        } catch {}
        try {
            localStorage.setItem(CACHE_KEY_LOCAL, payload)
        } catch {}
    }

    function apiAvailable() {
        if (isQuotaExceeded()) return !1;
        if (navigator.onLine === !1) return !1;
        return !!(typeof window.fetch === 'function' && typeof config.youtubeApiKey === 'string' && config.youtubeApiKey.trim() && config.youtubeChannelId)
    }

    function uploadsPlaylistId() {
        var ch = (config.youtubeChannelId || '');
        return ch.startsWith('UC') ? 'UU' + ch.slice(2) : ch
    }

    function plFetch() {
        var key = encodeURIComponent(config.youtubeApiKey.trim());
        var playlistId = encodeURIComponent(uploadsPlaylistId());
        var url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=' + playlistId + '&fields=items(snippet(title,resourceId/videoId))&key=' + key;
        return fetch(url).then(function(r) {
            if (r.status === 403) {
                markQuotaExceeded();
                throw new Error('YouTube API quota exceeded (403)')
            }
            if (!r.ok) throw new Error('YouTube API ' + r.status);
            return r.json()
        }).then(function(data) {
            return data && data.items && data.items[0]
        })
    }

    function videoLiveDetailsFetch(videoId) {
        var key = encodeURIComponent(config.youtubeApiKey.trim());
        var vid = encodeURIComponent(videoId);
        var url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=' + vid + '&fields=items(id,snippet(title,liveBroadcastContent),liveStreamingDetails(actualStartTime,actualEndTime))&key=' + key;
        return fetch(url).then(function(r) {
            if (r.status === 403) {
                markQuotaExceeded();
                throw new Error('YouTube API quota exceeded (403)')
            }
            if (!r.ok) throw new Error('YouTube API ' + r.status);
            return r.json()
        }).then(function(data) {
            return data && data.items && data.items[0]
        })
    }

    function ytSearchLive() {
        var key = encodeURIComponent(config.youtubeApiKey.trim());
        var ch = encodeURIComponent(config.youtubeChannelId);
        var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&channelId=' + ch + '&fields=items(id/videoId,snippet/title)&key=' + key;
        return fetch(url).then(function(r) {
            if (r.status === 403) {
                markQuotaExceeded();
                throw new Error('YouTube API quota exceeded (403)')
            }
            if (!r.ok) throw new Error('YouTube API ' + r.status);
            return r.json()
        }).then(function(data) {
            return data && data.items && data.items[0]
        })
    }

    function fetchLatest() {
        if (!apiAvailable()) {
            var cached = readLatestCache();
            if (cached) {
                showVideo(cached.id, cached.title, !1)
            } else {
                showFallback()
            }
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
            var fallback = readLatestCache();
            if (fallback && currentMode !== 'live') {
                showVideo(fallback.id, fallback.title, !1)
            } else if (currentMode !== 'live' && !currentVideoId) {
                showFallback()
            }
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
        if (currentMode === 'live' || currentMode === null) showLatest();
    }

    function checkLive() {
        if (!apiAvailable()) {
            fallbackToLatest();
            return
        }
        plFetch().then(function(item) {
            var snip = item && item.snippet;
            var vid = snip && snip.resourceId && snip.resourceId.videoId;
            if (!vid) return null;
            return videoLiveDetailsFetch(vid).then(function(vDetails) {
                if (!vDetails) return null;
                var vSnip = vDetails.snippet;
                var vLive = vDetails.liveStreamingDetails;
                var isLiveNow = (vSnip && vSnip.liveBroadcastContent === 'live') || (vLive && vLive.actualStartTime && !vLive.actualEndTime);
                if (isLiveNow) {
                    return {
                        id: vid,
                        title: (vSnip && vSnip.title) || snip.title
                    }
                }
                return null
            })
        }).then(function(liveFound) {
            if (liveFound) {
                latestVideo = null;
                showVideo(liveFound.id, liveFound.title, !0);
                stopLivePolling();
                return
            }
            if (apiAvailable()) {
                return ytSearchLive().then(function(searchItem) {
                    var liveId = searchItem && searchItem.id && searchItem.id.videoId;
                    if (liveId) {
                        latestVideo = null;
                        showVideo(liveId, searchItem.snippet && searchItem.snippet.title, !0);
                        stopLivePolling()
                    } else {
                        fallbackToLatest()
                    }
                })
            } else {
                fallbackToLatest()
            }
        }).catch(function(err) {
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