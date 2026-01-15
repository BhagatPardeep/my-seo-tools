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

    // 2. The New "Community" Backup List
    // These APIs are less strict than Cobalt and usually allow Vercel IPs
    const apis = [
        {
            // API 1: Nyxs (Very stable for Shorts)
            url: `https://api.nyxs.pw/dl/yt-shorts?url=${encodeURIComponent(url)}`,
            method: 'GET',
            extractor: (data) => data.result?.url
        },
        {
            // API 2: GiftedTech (Good backup)
            url: `https://api.giftedtech.my.id/api/download/dl?url=${encodeURIComponent(url)}&apikey=gifted`,
            method: 'GET',
            extractor: (data) => data.result?.url || data.url
        },
        {
            // API 3: DtStudio (Another engine)
            url: `https://api.dts.studio/api/v1/ytdl?url=${encodeURIComponent(url)}`,
            method: 'GET',
            extractor: (data) => data.info?.url
        }
    ];

    // 3. Loop through them until one works
    for (const api of apis) {
        try {
            console.log(`Trying API: ${api.url}`);
            
            const response = await fetch(api.url, { method: api.method });
            const data = await response.json();
            
            // Extract the video link using the specific rule for that API
            const downloadLink = api.extractor(data);

            if (downloadLink) {
                return res.status(200).json({
                    title: "Shorts Video (Ready)",
                    thumbnail: "https://i.ytimg.com/vi/" + extractVideoID(url) + "/hqdefault.jpg",
                    downloadUrl: downloadLink
                });
            }
        } catch (e) {
            console.error("API failed, trying next...");
        }
    }

    // 4. If all fail
    return res.status(500).json({ 
        error: "Server overloaded. Please click the button again in 5 seconds." 
    });
}

// Helper to get thumbnail
function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
