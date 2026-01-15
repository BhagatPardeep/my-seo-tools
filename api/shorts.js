const ytdl = require('@distube/ytdl-core');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    // Handle Preflight for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        // 1. Get Info with specific "Agent" settings to fool YouTube
        // This helps bypass the 410/403 errors
        const agent = ytdl.createAgent([{ name: 'cookie', value: '' }]); 
        
        const info = await ytdl.getInfo(url, { agent });

        // 2. Get the best format that has both audio and video
        const formats = ytdl.filterFormats(info.formats, 'audioandvideo');
        const bestFormat = formats.length > 0 ? formats[0] : null;

        if (!bestFormat) throw new Error("No video found");

        return res.status(200).json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails.pop().url,
            downloadUrl: bestFormat.url
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
}
