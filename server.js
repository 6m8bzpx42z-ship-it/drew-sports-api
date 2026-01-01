require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for local development
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// YouTube API proxy endpoint - keeps API key hidden
app.get('/api/youtube/search', async (req, res) => {
    const { awayTeam, homeTeam } = req.query;

    if (!awayTeam || !homeTeam) {
        return res.status(400).json({ error: 'Missing team parameters' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const searchQuery = `${awayTeam} vs ${homeTeam} "Game Highlights"`;
        const nflChannelId = 'UCDVYQ4Zhbm3S2dlz7P1GBDg';
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&order=date&channelId=${nflChannelId}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('YouTube API error:', error);
        res.status(500).json({ error: 'Failed to fetch from YouTube' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
