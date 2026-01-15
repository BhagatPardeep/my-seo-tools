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

        // Basic SEO Data
        const title = $('title').text() || '';
        const description = $('meta[name="description"]').attr('content') || '';

        // --- REAL LINK ANALYSIS ---
        const allLinks = $('a');
        let internal = 0, external = 0, nofollow = 0;
        const domain = new URL(url).hostname;

        allLinks.each((i, link) => {
            const href = $(link).attr('href');
            const rel = $(link).attr('rel');
            
            if (href) {
                if (href.includes(domain) || href.startsWith('/')) {
                    internal++;
                } else if (href.startsWith('http')) {
                    external++;
                }
                if (rel && rel.includes('nofollow')) {
                    nofollow++;
                }
            }
        });

        return res.status(200).json({ 
            title, description, url,
            stats: {
                total: internal + external,
                internal: internal,
                external: external,
                nofollow: nofollow,
                dofollow: (internal + external) - nofollow
            }
        });

    } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch page' });
    }
}
