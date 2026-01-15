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

    try {
        // We will use a reliable external API that powers many of these sites
        // This one is specifically designed for Shorts and is very fast
        const targetApi = `https://api.v1.oshara.net/api/v1/convert?url=${encodeURIComponent(url)}&type=video`;

        const response = await fetch(targetApi, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const data = await response.json();

        // 2. Extract the video data
        // Different APIs return data differently, so we check a few common spots
        const downloadUrl = data.url || data.result?.url || data.data?.url;
        const title = data.title || data.meta?.title || "YouTube Short";
        const thumb = data.thumb || data.meta?.thumbnail || `https://i.ytimg.com/vi/${extractVideoID(url)}/hqdefault.jpg`;

        if (!downloadUrl) {
            throw new Error("Could not extract video link.");
        }

        return res.status(200).json({
            title: title,
            thumbnail: thumb,
            downloadUrl: downloadUrl
        });

    } catch (error) {
        console.error("Fetch failed:", error);
        return res.status(500).json({ 
            error: "All servers busy.",
            details: error.message 
        });
    }
}

function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
