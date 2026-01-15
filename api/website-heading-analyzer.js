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

        const headers = [];
        // Extract all headers in order of appearance
        $('h1, h2, h3, h4, h5, h6').each((i, el) => {
            headers.push({
                tag: el.tagName.toLowerCase(),
                text: $(el).text().trim() || '(Empty Header)'
            });
        });

        // Basic Counts
        const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
        headers.forEach(h => { if(counts[h.tag] !== undefined) counts[h.tag]++ });

        return res.status(200).json({ url, headers, counts });

    } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch page' });
    }
}