const cheerio = require('cheerio');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const response = await fetch(url, {
            headers: {
                // Fake being a real browser to avoid blocks
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            }
        });

        if (!response.ok) throw new Error("Site blocked access");

        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'No Title';
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || 'No Description';
        
        return res.status(200).json({ title, description, url });
    } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch website data' });
    }
}
