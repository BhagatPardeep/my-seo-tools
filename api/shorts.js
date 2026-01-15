export default async function handler(req, res) {
    // 1. Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // 2. The List of Backup Servers (The "Terminator" Logic)
    const instances = [
        'https://api.cobalt.tools/api/json',
        'https://cobalt.steamworkshopdownloader.io/api/json',
        'https://api.server1.cobalt.tools/api/json', 
        'https://co.wuk.sh/api/json'
    ];

    // 3. Loop through servers until one works
    for (const base of instances) {
        try {
            console.log(`Trying server: ${base}`);
            
            const response = await fetch(base, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    url: url,
                    vCodec: 'h264',
                    vQuality: '720',
                    aFormat: 'mp3',
                    isAudioOnly: false
                })
            });

            const data = await response.json();

            // If this server worked, return the data immediately!
            if (data.url) {
                return res.status(200).json({
                    title: "Download Ready",
                    thumbnail: "https://i.ytimg.com/vi/" + extractVideoID(url) + "/hqdefault.jpg",
                    downloadUrl: data.url,
                    serverUsed: base
                });
            }
        } catch (e) {
            console.error(`Server ${base} failed, trying next...`);
            // Continue to the next server in the list
        }
    }

    // 4. If ALL servers fail
    return res.status(500).json({ 
        error: "All servers are busy. Please try again in 10 seconds.",
        details: "Vercel IP might be temporarily rate-limited."
    });
}

// Helper to get thumbnail
function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
