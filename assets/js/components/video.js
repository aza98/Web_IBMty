/*
 * Latest live stream of the church's YouTube channel ([data-latest-live]): the one
 * broadcasting right now, otherwise the recording of the last finished stream.
 *
 * Quota: each refresh costs 2 units (playlistItems.list on the uploads playlist +
 * videos.list), never search.list (100). The result is shared by every visit and tab
 * of this browser through localStorage, and refreshed by the schedule:
 * - during the Sunday service window: every 2 minutes, only while the tab is visible;
 * - otherwise: once after each service ends, then at most every 12 hours.
 * shortcut: the cache is per browser, so quota still grows with visitors; a shared
 * server-side cache would be the upgrade if the daily quota runs short.
 */
(function(IBMty) {
    'use strict';
    const API = 'https://www.googleapis.com/youtube/v3';
    const LIVE_REFRESH = 2 * 60 * 1000;
    const IDLE_REFRESH = 12 * 60 * 60 * 1000;

    function pickLatest(items) {
        const live = items.find((item) => item.snippet?.liveBroadcastContent === 'live');
        const video = live || items.find((item) => item.liveStreamingDetails?.actualEndTime);
        return video ? {
            id: video.id,
            title: video.snippet.title,
            live: Boolean(live)
        } : null
    }

    function isFresh(fetchedAt, now, state, durationMinutes) {
        if (state.live) return now - fetchedAt < LIVE_REFRESH;
        const lastServiceEnd = now - (state.sinceStart - durationMinutes * 60) * 1000;
        return fetchedAt >= lastServiceEnd && now - fetchedAt < IDLE_REFRESH
    }
    async function request(path, params) {
        const response = await fetch(`${API}/${path}?${new URLSearchParams(params)}`);
        if (!response.ok) throw new Error(`YouTube ${path}: ${response.status}`);
        return response.json()
    }
    async function fetchLatest({
        youTubeChannelId,
        youTubeApiKey
    }) {
        const uploads = await request('playlistItems', {
            part: 'snippet',
            playlistId: `UU${youTubeChannelId.slice(2)}`,
            maxResults: 15,
            key: youTubeApiKey
        });
        const ids = uploads.items.map((item) => item.snippet.resourceId.videoId);
        if (!ids.length) return null;
        const videos = await request('videos', {
            part: 'snippet,liveStreamingDetails',
            id: ids.join(','),
            key: youTubeApiKey
        });
        videos.items.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        return pickLatest(videos.items)
    }

    function render(root, video, confirmed = !0) {
        document.querySelectorAll('[data-share-live]').forEach((button) => {
            button.dataset.shareUrl = video?.live ? `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}` : IBMty.config.social.youtube
        });
        root.hidden = !video;
        const frame = root.querySelector('[data-latest-live-frame]');
        if (!video) {
            frame.replaceChildren();
            delete frame.dataset.videoId;
            delete root.dataset.live;
            return
        }
        if (frame.dataset.videoId !== video.id) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}`;
            iframe.title = video.title;
            iframe.loading = 'lazy';
            iframe.allow = 'encrypted-media; picture-in-picture; fullscreen';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.replaceChildren(iframe);
            frame.dataset.videoId = video.id
        }
        root.querySelector('[data-latest-live-label]').textContent = video.live ? (confirmed ? 'En vivo ahora' : 'Transmisión por confirmar') : 'Última transmisión';
        root.dataset.live = String(video.live && confirmed)
    }
    IBMty.register('component:video', {
        pickLatest,
        isFresh,
        init(app) {
            const root = document.querySelector('[data-latest-live]');
            const {
                services,
                features,
                service
            } = app.config;
            const key = services.youTubeApiKey;
            if (!root || !features.video || !key) return;
            const {
                KEYS,
                get,
                set
            } = app.storage;
            let busy = !1;
            const refresh = async () => {
                const cached = get(KEYS.latestLive);
                const now = Date.now();
                const state = app.schedule.serviceState(new Date(now), app.config);
                const fresh = Boolean(cached) && isFresh(cached.at, now, state, service.durationMinutes);
                if (cached) render(root, cached.video, fresh);
                if (fresh || busy || !navigator.onLine || document.hidden) return;
                busy = !0;
                try {
                    const video = await fetchLatest(services);
                    set(KEYS.latestLive, {
                        at: Date.now(),
                        video
                    });
                    render(root, video)
                } catch (error) {
                    console.warn('IBMty: latest video unavailable', error)
                } finally {
                    busy = !1
                }
            };
            refresh();
            setInterval(refresh, 60 * 1000);
            document.addEventListener('visibilitychange', refresh)
        }
    })
})(self.IBMty = self.IBMty || {})