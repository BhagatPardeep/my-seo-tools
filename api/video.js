const cheerio = require('cheerio');
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        const tags = keywords.split(',').map(t => t.trim());
        return res.status(200).json({ 
            title: $('title').text(),
            thumbnail: $('meta[property="og:image"]').attr('content'),
            tags: tags
        });
    } catch (e) {
        return res.status(500).json({ error: 'Failed' });
    }
}