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

    // --- PASTE YOUR RAPIDAPI KEY HERE ---
    const rapidApiKey = "ecd7d95a13msh21df9996905ca05p1ba68djsnc15adc9d6abe"; 
    // ------------------------------------

    try {
        // We use a professional API service that rotates IPs for us
        const response = await fetch(`https://yt-stream-download.p.rapidapi.com/GetShorts?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'youtube138.p.rapidapi.com'
            }
        });

        const data = await response.json();

        // Check if the API returned an error
        if (!data.Success && !data.url) {
            throw new Error("RapidAPI could not find video.");
        }

        // Extract the best video link
        // Note: Different RapidAPIs have different response structures. 
        // This example matches 'YT Stream Download'.
        // If you use a different one, check their 'Example Response' on the website.
        const downloadUrl = data.url || data.link || data.data?.url; 
        const title = data.title || "YouTube Short";
        const thumb = data.thumbnail || `https://i.ytimg.com/vi/${extractVideoID(url)}/hqdefault.jpg`;

        return res.status(200).json({
            title: title,
            thumbnail: thumb,
            downloadUrl: downloadUrl
        });

    } catch (error) {
        console.error("RapidAPI Error:", error);
        return res.status(500).json({ 
            error: "Download failed.", 
            details: "Check your RapidAPI Key quota." 
        });
    }
}

function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

