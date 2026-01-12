// Vercel Serverless Function for Project Dashboard heartbeat
// Sends health status every 5 minutes via Vercel cron

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify cron request (Vercel cron sets this header)
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    if (!isVercelCron && process.env.CRON_SECRET) {
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const heartbeat = {
        status: 'healthy',
        version: '1.0.0',
        metadata: {
            project_name: 'drew-sports-api',
            git_commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || '',
            git_commit_date: new Date().toISOString(),
            git_branch: process.env.VERCEL_GIT_COMMIT_REF || '',
            type: 'vercel-cron',
            script_version: '1.2.0',
        },
    };

    try {
        const response = await fetch('https://projects.paulrbrown.org/api/heartbeats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PROJECT_DASHBOARD_API_KEY}`,
            },
            body: JSON.stringify(heartbeat),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Heartbeat failed:', response.status, errorText);
            return res.status(500).json({ error: 'Heartbeat failed', details: errorText });
        }

        return res.status(200).json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Heartbeat error:', error);
        return res.status(500).json({ error: 'Failed to send heartbeat', details: String(error) });
    }
}
