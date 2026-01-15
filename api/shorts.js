const ytdl = require('ytdl-core');
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: '18' }); // 18 is usually standard MP4
        return res.status(200).json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            downloadUrl: format.url
        });
    } catch (e) {
        return res.status(500).json({ error: 'Failed to process video' });
    }
}