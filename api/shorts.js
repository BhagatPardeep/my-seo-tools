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

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // 2. Use a different Cobalt Instance (co.wuk.sh) which is less likely to be blocked
        const response = await fetch('https://co.wuk.sh/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
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

        // 3. Check for specific API errors
        if (data.status === 'error' || data.text) {
            // Return the REAL error from the API so we can see what's wrong
            throw new Error(data.text || "API Error");
        }

        // 4. Return the clean link
        return res.status(200).json({
            title: "Shorts Video Ready",
            thumbnail: "https://i.ytimg.com/vi/" + extractVideoID(url) + "/hqdefault.jpg",
            downloadUrl: data.url
        });

    } catch (error) {
        // Return the EXACT error message to the screen
        return res.status(500).json({ 
            error: error.message, 
            details: "If this persists, the free API might be overloaded." 
        });
    }
}

function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
