// --- Configuración ---
const apiKey = "AIzaSyALhMyuq20yoisXXp8sf7rjvUGyHKC7mGg";
const channelId = "UCfhSTnqLb6vFO28eNm_n0qw";
let liveVideoId = null;

const iframePlayer = document.getElementById('youtube-live-embed');
const liveStatusBadge = document.getElementById('liveStatusBadge');
const liveStatusText = document.getElementById('liveStatusText');
const viewerCountContainer = document.getElementById('viewerCountContainer');
const viewerCountSpan = document.getElementById('viewerCount');

async function checkLiveStatus() {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            liveVideoId = data.items[0].id.videoId;
            updateToLiveState(liveVideoId);
            getViewerCount(liveVideoId);
        } else {
            updateToOfflineState();
        }
    } catch (error) {
        console.error("Error al contactar la API de YouTube:", error);
        updateToOfflineState("Error de red");
    }
}

function updateToLiveState(videoId) {
    iframePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
    liveStatusText.textContent = "EN VIVO";
    liveStatusBadge.classList.remove('is-offline', 'bg-secondary');
    liveStatusBadge.classList.add('bg-danger', 'animate__animated', 'animate__pulse', 'animate__infinite');
    if (viewerCountContainer) {
        viewerCountContainer.style.display = 'block';
    }
}

async function getViewerCount(videoId) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0 && data.items[0].liveStreamingDetails) {
            const viewers = data.items[0].liveStreamingDetails.concurrentViewers;
            if (viewers) {
                viewerCountSpan.textContent = new Intl.NumberFormat('es-ES').format(viewers);
                viewerCountSpan.classList.remove('placeholder-glow');
            } else {
                viewerCountSpan.textContent = '--';
            }
        } else {
            viewerCountSpan.textContent = '--';
        }
    } catch (error) {
        console.error("Error al obtener el contador de espectadores:", error);
        viewerCountSpan.textContent = '--';
    }
}

function updateToOfflineState(message = "GRABACIÓN") {
    iframePlayer.src = `https://www.youtube.com/embed?listType=playlist&list=${channelId.replace('UC', 'UU')}`;
    liveStatusText.textContent = message;
    liveStatusBadge.classList.remove('bg-danger', 'animate__pulse', 'animate__infinite');
    liveStatusBadge.classList.add('is-offline', 'bg-secondary');
    if (viewerCountContainer) {
        viewerCountContainer.style.display = 'none';
    }
}

function shareVideo() {
    const urlToShare = liveVideoId
        ? `https://www.youtube.com/watch?v=${liveVideoId}`
        : `https://www.youtube.com/channel/${channelId}`;
    const shareTitle = "Transmisión en vivo - Iglesia Bautista de Monterrey";
    
    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            url: urlToShare
        }).catch(err => console.error('Error al compartir:', err));
    } else {
        // Fallback: copiar al portapapeles
        if (navigator.clipboard) {
            navigator.clipboard.writeText(urlToShare).then(() => {
                alert(`¡Enlace copiado al portapapeles!\n${urlToShare}`);
            }).catch(() => {
                alert(`¡Copia y comparte este enlace!\n${urlToShare}`);
            });
        } else {
            alert(`¡Copia y comparte este enlace!\n${urlToShare}`);
        }
    }
}

function enableNotifications() {
    alert("Para recibir notificaciones, visita nuestro canal de YouTube, haz clic en 'Suscribirse' y luego en el icono de la campana (🔔).");
    window.open(`https://www.youtube.com/channel/${channelId}`, '_blank');
}

// Verificar estado cada 15 minutos
function startLiveStatusCheck() {
    checkLiveStatus();
    setInterval(checkLiveStatus, 900000);
}

document.addEventListener('DOMContentLoaded', startLiveStatusCheck);