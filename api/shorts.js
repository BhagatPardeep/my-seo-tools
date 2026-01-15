export default async function handler(req, res) {
    // 1. Enable CORS so your Blogspot can talk to this
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
        // 2. We ask Cobalt (a powerful public tool) to unlock the video for us
        const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            },
            body: JSON.stringify({
                url: url,
                vCodec: 'h264',
                vQuality: '720',
                aFormat: 'mp3',
                isAudioOnly: false
            })
        });

        const data = await cobaltResponse.json();

        // 3. Check if Cobalt succeeded
        if (data.status === 'error' || !data.url) {
            throw new Error(data.text || "Could not fetch video. Try again.");
        }

        // 4. Return the clean download link to your Blogspot
        return res.status(200).json({
            title: "Shorts Video (Ready)", // Cobalt doesn't always give titles, so we use a generic one
            thumbnail: "https://i.ytimg.com/vi/" + extractVideoID(url) + "/hqdefault.jpg",
            downloadUrl: data.url
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Failed to process video. YouTube might be blocking requests." });
    }
}

// Helper function to get the thumbnail image manually
function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
