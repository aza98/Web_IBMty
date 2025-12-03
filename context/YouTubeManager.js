const CONFIG = {
    API_KEY: "AIzaSyALhMyuq20yoisXXp8sf7rjvUGyHKC7mGg",
    CHANNEL_ID: "UCfhSTnqLb6vFO28eNm_n0qw",
    get UPLOADS_PLAYLIST_ID() {
        return this.CHANNEL_ID.replace("UC", "UU");
    },
    CHECK_INTERVAL_MS: 300000
};

const DOM = {
    iframe: document.getElementById("youtube-live-embed"),
    badge: document.getElementById("liveStatusBadge"),
    statusText: document.getElementById("liveStatusText"),
    viewerContainer: document.getElementById("viewerCountContainer"),
    viewerCount: document.getElementById("viewerCount")
};

let liveVideoId = null;
let pollingInterval = null;

async function checkLiveStatus() {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${CONFIG.UPLOADS_PLAYLIST_ID}&maxResults=1&key=${CONFIG.API_KEY}`;
    try {
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 403) {
                console.warn("API Quota excedida o Key restringida. Deteniendo chequeo.");
                stopPolling();
            }
            throw new Error(`YouTube API Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const videoData = data.items[0].snippet;
            if (videoData.liveBroadcastContent === 'live') {
                const currentLiveId = videoData.resourceId.videoId;
                if (liveVideoId !== currentLiveId) {
                    liveVideoId = currentLiveId;
                    updateToLiveState(liveVideoId);
                }
                getViewerCount(liveVideoId);
            } else {
                updateToOfflineState();
            }
        } else {
            updateToOfflineState();
        }

    } catch (error) {
        console.error("Error en chequeo:", error);
    }
}

function updateToLiveState(videoId) {
    if (!DOM.iframe.src.includes(videoId)) {
        DOM.iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
    }
    DOM.statusText.textContent = "EN VIVO";
    DOM.badge.classList.remove("bg-secondary");
    DOM.badge.classList.add("bg-danger");
    const icon = DOM.badge.querySelector('i');
    if (icon) icon.classList.add("animate__flash", "animate__infinite", "animate__slower");
    if (DOM.viewerContainer) DOM.viewerContainer.classList.remove("d-none");
}

function updateToOfflineState() {
    liveVideoId = null;
    const playlistUrl = `https://www.youtube.com/embed?listType=playlist&list=${CONFIG.UPLOADS_PLAYLIST_ID}`;
    if (!DOM.iframe.src.includes("listType=playlist")) {
        DOM.iframe.src = playlistUrl;
    }
    DOM.statusText.textContent = "Grabación";
    DOM.badge.classList.remove("bg-danger");
    DOM.badge.classList.add("bg-secondary");
    const icon = DOM.badge.querySelector('i');
    if (icon) icon.classList.remove("animate__flash", "animate__infinite");
    if (DOM.viewerContainer) DOM.viewerContainer.classList.add("d-none");
}

async function getViewerCount(videoId) {
    if (!videoId) return;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${CONFIG.API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const stats = data.items[0].liveStreamingDetails;
            const viewers = stats ? stats.concurrentViewers : null;
            DOM.viewerCount.textContent = viewers
                ? new Intl.NumberFormat("es-MX").format(viewers)
                : "--";
        }
    } catch (e) {
        console.log("No se pudieron obtener espectadores", e);
    }
}

function shareVideo() {
    const url = liveVideoId
        ? `https://www.youtube.com/watch?v=${liveVideoId}`
        : `https://www.youtube.com/channel/${CONFIG.CHANNEL_ID}`;

    const title = 'Iglesia Bautista de Monterrey';
    const text = 'Únete a nuestra transmisión en vivo.';

    if (typeof shareContent === "function") {
        shareContent(title, text, url);
    } else {
        // Fallback if shareContent is not available
        if (navigator.share) {
            navigator.share({
                title: title,
                text: text,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert("¡Enlace copiado al portapapeles!");
            });
        }
    }
}

function enableNotifications() {
    const url = `https://www.youtube.com/channel/${CONFIG.CHANNEL_ID}?sub_confirmation=1`;
    window.open(url, "_blank");
}

function startLiveStatusCheck() {
    checkLiveStatus();
    pollingInterval = setInterval(checkLiveStatus, CONFIG.CHECK_INTERVAL_MS);
}

function stopPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
}

document.addEventListener("DOMContentLoaded", startLiveStatusCheck);