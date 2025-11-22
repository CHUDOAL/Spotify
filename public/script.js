const widget = document.getElementById('widget');
const albumArt = document.getElementById('album-art');
const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');

let currentTrack = '';
let isVisible = false;

async function updateWidget() {
    try {
        const response = await fetch('/now-playing');
        const data = await response.json();

        if (data.error) {
            console.error(data.error);
            return;
        }

        if (!data.is_playing) {
            if (isVisible) {
                widget.classList.add('hidden');
                isVisible = false;
            }
            return;
        }

        // If we are playing, show widget
        if (!isVisible) {
            widget.classList.remove('hidden');
            isVisible = true;
        }

        // Only update DOM if track changed to avoid jitter/resetting animations
        const newTrackId = data.title + data.artist;
        if (currentTrack !== newTrackId) {
            currentTrack = newTrackId;
            
            trackName.textContent = data.title;
            artistName.textContent = data.artist;
            albumArt.src = data.album_art || 'default-art.png'; // You might want a default image

            // Handle text scrolling logic if needed
            handleScrolling(trackName, data.title);
            handleScrolling(artistName, data.artist);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function handleScrolling(element, text) {
    // Reset animation
    element.classList.remove('scroll-animation');
    element.style.transform = 'translateX(0)';
    
    // Check if text overflows container
    const containerWidth = element.parentElement.clientWidth;
    // Approximate text width calculation or use a temporary span
    const textWidth = getTextWidth(text, window.getComputedStyle(element).font);

    if (textWidth > containerWidth) {
        // Add padding to simulate marquee
        element.textContent = text + "   •   " + text; 
        element.classList.add('scroll-animation');
    } else {
        element.textContent = text;
    }
}

function getTextWidth(text, font) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

// Update every 3 seconds
setInterval(updateWidget, 3000);
updateWidget();


