const cheerio = require('cheerio');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Googlebot/2.1)' } });
        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Meta Data
        const title = $('title').text() || '';
        const desc = $('meta[name="description"]').attr('content') || '';
        
        // 2. Headings
        const h1s = $('h1').length;
        const h2s = $('h2').length;

        // 3. Images
        const images = $('img').length;
        const missingAlt = $('img:not([alt])').length;

        // 4. Links
        const links = $('a').length;

        return res.status(200).json({
            url,
            audit: {
                title: { text: title, len: title.length, status: (title.length > 30 && title.length < 60) ? 'pass' : 'warn' },
                description: { text: desc, len: desc.length, status: (desc.length > 100 && desc.length < 160) ? 'pass' : 'warn' },
                headings: { h1: h1s, h2: h2s, status: (h1s === 1) ? 'pass' : 'fail' },
                images: { total: images, missingAlt: missingAlt, status: (missingAlt === 0) ? 'pass' : 'warn' },
                links: { total: links }
            }
        });
    } catch (e) {
        return res.status(500).json({ error: 'Failed to analyze website' });
    }
}