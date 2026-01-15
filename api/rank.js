export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { keyword, domain, country } = req.query;
    if (!keyword || !domain) return res.status(400).json({ error: 'Keyword and Domain required' });

    try {
        const response = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": "d95faaac6b5e955936a19ecd74a65331547a6e6f", // Replace with your key
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ q: keyword, gl: country || "us", num: 100 })
        });

        const data = await response.json();
        const results = data.organic || [];
        
        // Find position
        let position = -1;
        let foundUrl = "";
        
        for (let i = 0; i < results.length; i++) {
            if (results[i].link.includes(domain)) {
                position = i + 1;
                foundUrl = results[i].link;
                break;
            }
        }

        return res.status(200).json({
            keyword,
            targetDomain: domain,
            position: position > 0 ? position : "100+",
            foundUrl: foundUrl || "Not found in top 100",
            resultsCount: data.searchParameters?.num || 0
        });

    } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch rankings' });
    }
}