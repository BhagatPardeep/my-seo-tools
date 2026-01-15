const cheerio = require('cheerio');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const startTime = Date.now();
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Googlebot/2.1)' } });
        const html = await response.text();
        const $ = cheerio.load(html);
        const responseTime = (Date.now() - startTime) / 1000;

        // 1. Meta Data Analysis
        const title = $('title').text() || '';
        const desc = $('meta[name="description"]').attr('content') || '';
        const canonical = $('link[rel="canonical"]').attr('href') || '';
        const lang = $('html').attr('lang') || 'not defined';

        // 2. Content & Page Quality
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = bodyText.split(' ').length;
        const h1Count = $('h1').length;
        const h2Count = $('h2').length;
        const images = $('img').length;
        const missingAlt = $('img:not([alt])').length;

        // 3. Link Structure
        const links = $('a');
        let internal = 0, external = 0;
        const domain = new URL(url).hostname;
        links.each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes(domain) || href.startsWith('/')) internal++;
            else if (href.startsWith('http')) external++;
        });

        // 4. Calculate Weighted Score
        let score = 100;
        if (h1Count !== 1) score -= 15;
        if (wordCount < 300) score -= 10;
        if (missingAlt > 0) score -= 10;
        if (desc.length === 0) score -= 15;
        if (responseTime > 2) score -= 10;

        return res.status(200).json({
            url,
            score: Math.max(score, 0),
            responseTime: responseTime.toFixed(2),
            wordCount,
            meta: { title, titleLen: title.length, desc, descLen: desc.length, canonical, lang },
            headings: { h1: h1Count, h2: h2Count },
            links: { internal, external },
            images: { total: images, missingAlt }
        });

    } catch (e) {
        return res.status(500).json({ error: 'Failed to analyze page' });
    }
}