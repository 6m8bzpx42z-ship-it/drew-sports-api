// Vercel Serverless Function for ESPN Stats proxy
// Bypasses CORS restrictions for client-side fetching

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Get current NFL season
        const now = new Date();
        const month = now.getMonth();
        const season = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;

        // Fetch leaders from ESPN core API
        const leadersUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/types/2/leaders`;
        const leadersRes = await fetch(leadersUrl);
        const leadersData = await leadersRes.json();

        // Process categories and resolve athlete refs
        const categories = leadersData.categories || [];
        const processedCategories = [];

        for (const category of categories.slice(0, 8)) { // Limit to first 8 categories
            const leaders = category.leaders || [];
            const processedLeaders = [];

            for (const leader of leaders.slice(0, 5)) { // Top 5 per category
                try {
                    // Fetch athlete details
                    const athleteRef = leader.athlete?.$ref?.replace('http://', 'https://');
                    const teamRef = leader.team?.$ref?.replace('http://', 'https://');

                    const [athleteRes, teamRes] = await Promise.all([
                        athleteRef ? fetch(athleteRef) : null,
                        teamRef ? fetch(teamRef) : null
                    ]);

                    const athleteData = athleteRes ? await athleteRes.json() : {};
                    const teamData = teamRes ? await teamRes.json() : {};

                    processedLeaders.push({
                        displayValue: leader.displayValue,
                        value: leader.value,
                        athlete: {
                            id: athleteData.id,
                            displayName: athleteData.displayName || 'Unknown',
                            shortName: athleteData.shortName,
                            headshot: athleteData.headshot?.href || '',
                            position: athleteData.position?.abbreviation || ''
                        },
                        team: {
                            id: teamData.id,
                            displayName: teamData.displayName || '',
                            abbreviation: teamData.abbreviation || '',
                            logo: teamData.logos?.[0]?.href || ''
                        }
                    });
                } catch (e) {
                    // Skip this leader if fetch fails
                    console.error('Failed to fetch leader details:', e);
                }
            }

            if (processedLeaders.length > 0) {
                processedCategories.push({
                    name: category.name,
                    displayName: category.displayName,
                    shortDisplayName: category.shortDisplayName,
                    leaders: processedLeaders
                });
            }
        }

        res.status(200).json({
            leaders: {
                categories: processedCategories
            }
        });
    } catch (error) {
        console.error('Stats API error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}
