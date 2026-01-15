export default async function handler(req, res) {
    // 1. Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // --- PASTE YOUR KEY INSIDE THE QUOTES BELOW ---
    const rapidApiKey = "ecd7d95a13msh21df9996905ca05p1ba68djsnc15adc9d6abe"; 
    // ----------------------------------------------

    try {
        // We use the Professional API to fetch the video
        const response = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${extractVideoID(url)}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
            }
        });

        const data = await response.json();

        // Check if it worked
        if (!data.videos) {
            throw new Error("Video not found. Check your API Key.");
        }

        // Get the best video (MP4 with Audio)
        const bestVideo = data.videos.items.find(v => v.hasAudio === true && v.container === 'mp4');
        
        return res.status(200).json({
            title: data.title || "YouTube Short",
            thumbnail: data.thumbnails[data.thumbnails.length - 1].url,
            downloadUrl: bestVideo.url
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            error: "Download Failed", 
            details: "Make sure you subscribed to the Free Plan on RapidAPI." 
        });
    }
}

// Helper to get ID
function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
