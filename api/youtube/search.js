// Vercel Serverless Function for YouTube API proxy
// This keeps the API key hidden on the server side

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { awayTeam, homeTeam } = req.query;

    if (!awayTeam || !homeTeam) {
        return res.status(400).json({ error: 'Missing team parameters' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    try {
        const searchQuery = `${awayTeam} vs ${homeTeam} "Game Highlights"`;
        const nflChannelId = 'UCDVYQ4Zhbm3S2dlz7P1GBDg';

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&order=date&channelId=${nflChannelId}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        res.status(200).json(data);
    } catch (error) {
        console.error('YouTube API error:', error);
        res.status(500).json({ error: 'Failed to fetch from YouTube' });
    }
}
