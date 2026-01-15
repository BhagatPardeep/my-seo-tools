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
        const domain = new URL(url).hostname;

        const internalLinks = new Set();
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                if (href.startsWith('/') || href.includes(domain)) {
                    // Normalize the URL
                    try {
                        const absolute = new URL(href, url).href;
                        internalLinks.add(absolute);
                    } catch (e) {}
                }
            }
        });

        return res.status(200).json({
            url,
            domain,
            totalLinks: internalLinks.size,
            links: Array.from(internalLinks).slice(0, 50) // Limiting to top 50 for visualization
        });

    } catch (e) {
        return res.status(500).json({ error: 'Failed to crawl page' });
    }
}