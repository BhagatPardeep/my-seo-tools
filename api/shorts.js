const ytdl = require('ytdl-core');

export default async function handler(req, res) {
    // 1. Allow connections
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        // 2. Get Video Info
        const info = await ytdl.getInfo(url);

        // 3. Find Best Format (THE FIX)
        // Instead of forcing "18", we ask for any format that has both Audio + Video
        const formats = ytdl.filterFormats(info.formats, 'audioandvideo');
        
        // Grab the best quality one available
        const bestFormat = formats.length > 0 ? formats[0] : null;

        if (!bestFormat) {
             throw new Error("No downloadable format found for this Short.");
        }

        return res.status(200).json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails.pop().url, // Get the largest thumbnail
            downloadUrl: bestFormat.url
        });

    } catch (e) {
        // Return the ACTUAL error message so we can debug if it fails again
        return res.status(500).json({ error: e.message });
    }
}
