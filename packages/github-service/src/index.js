import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.GITHUB_SERVICE_PORT || 3008;

// --- Helper to create an authenticated Octokit instance from a token ---
const getOctokit = (token) => {
    if (!token) {
        throw new Error('GitHub token was not provided.');
    }
    return new Octokit({ auth: token });
};

// --- API Endpoints ---

/**
 * Endpoint to get a list of repositories for a given team.
 */
app.post('/api/team-repos', async (req, res) => {
    const { token, org, team_slug } = req.body;
    if (!token || !org || !team_slug) {
        return res.status(400).json({ message: 'token, org, and team_slug are required.' });
    }

    try {
        const octokit = getOctokit(token);
        const repos = await octokit.paginate(octokit.rest.teams.listReposInOrg, {
            org,
            team_slug,
            per_page: 100,
        });
        const repoNames = repos.map(repo => repo.full_name);
        res.json(repoNames);
    } catch (error) {
        console.error(`Error fetching repos for team ${org}/${team_slug}:`, error.message);
        res.status(error.status || 500).json({ message: error.message });
    }
});

/**
 * Endpoint to get all de-duplicated vulnerability alerts for a single repository.
 */
app.post('/api/repo-alerts', async (req, res) => {
    const { token, owner, repo } = req.body;
    if (!token || !owner || !repo) {
        return res.status(400).json({ message: 'token, owner, and repo are required.' });
    }

    try {
        const octokit = getOctokit(token);
        let allAlerts = [];

        // 1. Gather all alerts (Dependabot and Code Scanning)
        try {
            const dependabotAlerts = await octokit.paginate(octokit.rest.dependabot.listAlertsForRepo, { owner, repo, state: 'open,fixed,dismissed' });
            allAlerts.push(...dependabotAlerts);
        } catch (error) {
            console.warn(`Could not fetch Dependabot alerts for ${owner}/${repo}: ${error.message}`);
        }
        try {
            const codeScanningAlerts = await octokit.paginate(octokit.rest.codeScanning.listAlertsForRepo, { owner, repo, state: 'open,fixed,dismissed' });
            allAlerts.push(...codeScanningAlerts);
        } catch (error) {
             console.warn(`Could not fetch Code Scanning alerts for ${owner}/${repo}: ${error.message}`);
        }

        // 2. De-duplicate alerts, prioritizing the 'open' state.
        const definitiveAlerts = new Map();
        for (const alert of allAlerts) {
            const isDependabot = !!alert.security_advisory;
            const uniqueKey = isDependabot 
                ? `Dependabot::${alert.security_advisory.ghsa_id}`
                : `CodeScanning::${alert.rule.id}`;
            
            const existing = definitiveAlerts.get(uniqueKey);
            if (!existing || alert.state === 'open') {
                definitiveAlerts.set(uniqueKey, alert);
            }
        }

        res.json(Array.from(definitiveAlerts.values()));
        
    } catch (error) {
        console.error(`Error fetching alerts for ${owner}/${repo}:`, error.message);
        res.status(error.status || 500).json({ message: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 GitHub Service running on http://localhost:${PORT}`);
});