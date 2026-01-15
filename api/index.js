const cheerio = require('cheerio');
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content') || '';
        return res.status(200).json({ title, description, url });
    } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch' });
    }
}