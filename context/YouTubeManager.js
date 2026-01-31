const YOUTUBE_CONFIG = {
    API_KEY: "AIzaSyALhMyuq20yoisXXp8sf7rjvUGyHKC7mGg",
    CHANNEL_ID: "UCfhSTnqLb6vFO28eNm_n0qw",
    UPLOADS_PLAYLIST_ID: "UUfhSTnqLb6vFO28eNm_n0qw",
    POLL_INTERVAL: 60000 * 5,
};
class YouTubeManager {
    constructor(config) {
        this.apiKey = config.API_KEY;
        this.playlistId = config.UPLOADS_PLAYLIST_ID;
        this.pollInterval = config.POLL_INTERVAL;
        this.playerIframe = document.getElementById("youtube-live-embed");
        this.badge = document.getElementById("liveStatusBadge");
        this.statusText = document.getElementById("liveStatusText");
        this.badgeIcon = this.badge ? this.badge.querySelector("i") : null;
        this.viewerCountContainer = document.getElementById("viewerCountContainer");
        this.viewerCount = document.getElementById("viewerCount");
        this.shareBtn = document.getElementById("shareBtn");
        this.checkChannelStatus = this.checkChannelStatus.bind(this)
    }
    init() {
        if (!this.playerIframe) return;
        this.checkChannelStatus();
        setInterval(this.checkChannelStatus, this.pollInterval)
    }
    async checkChannelStatus() {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${this.playlistId}&maxResults=1&key=${this.apiKey}`);
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            if (!data.items || data.items.length === 0) {
                this.handleError("No videos found");
                return
            }
            const latestVideo = data.items[0].snippet;
            const videoId = latestVideo.resourceId.videoId;
            const videoTitle = latestVideo.title;
            const broadcastStatus = latestVideo.liveBroadcastContent;
            if (broadcastStatus === 'live') {
                this.setUIMode('LIVE', videoId, videoTitle)
            } else {
                this.setUIMode('OFFLINE', videoId, videoTitle)
            }
        } catch (error) {
            console.error("YouTube Status Check Failed:", error)
        }
    }
    setUIMode(mode, videoId, videoTitle = "") {
        const isLive = mode === 'LIVE';
        const embedUrl = `https://www.youtube.com/embed/${videoId}${isLive ? '?autoplay=1&mute=1' : ''}`;
        const watchUrl = `https://youtu.be/${videoId}`;
        if (!this.playerIframe.src.includes(videoId)) {
            this.playerIframe.src = embedUrl
        }
        if (this.badge) {
            this.badge.classList.remove("d-none", "d-flex");
            this.badge.classList.add("d-flex");
            if (isLive) {
                this.badge.classList.remove("bg-secondary");
                this.badge.classList.add("bg-danger");
                if (this.badgeIcon) this.badgeIcon.className = "fas fa-circle fa-xs animate__animated animate__flash animate__infinite";
                if (this.statusText) this.statusText.textContent = "EN VIVO";
                this.updateViewerCount(videoId)
            } else {
                this.badge.classList.remove("bg-danger");
                this.badge.classList.add("bg-secondary");
                if (this.badgeIcon) this.badgeIcon.className = "fas fa-play fa-xs";
                if (this.statusText) this.statusText.textContent = "Último Mensaje";
                if (this.viewerCountContainer) {
                    this.viewerCountContainer.classList.remove("d-flex");
                    this.viewerCountContainer.classList.add("d-none")
                }
            }
        }
        const shareTitle = videoTitle || (isLive ? "Transmisión en vivo IBMty" : "Último mensaje IBMty");
        this.updateShareButton(shareTitle, isLive ? "¡Únete a nuestra transmisión en vivo!" : "Escucha nuestro último mensaje.", watchUrl)
    }
    async updateViewerCount(videoId) {
        if (!this.viewerCountContainer || !this.viewerCount) return;
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${this.apiKey}`);
            if (!response.ok) return;
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const details = data.items[0].liveStreamingDetails;
                if (details && details.concurrentViewers) {
                    this.viewerCount.textContent = details.concurrentViewers;
                    this.viewerCountContainer.classList.remove("d-none");
                    this.viewerCountContainer.classList.add("d-flex")
                }
            }
        } catch (e) {
            console.warn("Viewer count fetch failed", e)
        }
    }
    updateShareButton(title, text, url) {
        if (!this.shareBtn) return;
        this.shareBtn.dataset.url = url;
        this.shareBtn.dataset.title = title;
        this.shareBtn.dataset.description = text;
        this.shareBtn.dataset.shareType = 'link';
        this.shareBtn.onclick = (e) => {
            e.preventDefault();
            if (typeof ShareManager !== "undefined") {
                ShareManager.share({
                    title: title,
                    text: text,
                    url: url,
                    type: 'link'
                })
            } else if (typeof shareContent === "function") {
                shareContent(title, text, url)
            } else {
                navigator.clipboard.writeText(url).then(() => {}).catch(err => console.error('Error al copiar', err))
            }
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const youtubeManager = new YouTubeManager(YOUTUBE_CONFIG);
    youtubeManager.init()
})