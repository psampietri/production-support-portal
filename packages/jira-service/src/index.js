import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.JIRA_SERVICE_PORT || 3007;

// --- Axios Instance for Jira API ---
const jiraApi = axios.create({
    baseURL: `https://${process.env.JIRA_HOST}/rest/api/3`,
    headers: {
        'Cookie': `${process.env.JIRA_COOKIE_NAME}=${process.env.JIRA_COOKIE_VALUE}`,
        'Content-Type': 'application/json'
    }
});

// --- API Endpoints ---

/**
 * Generic endpoint to proxy JQL searches to Jira.
 * Expects a POST request with a { jql: "..." } body.
 */
app.post('/api/jql', async (req, res) => {
    try {
        const { jql, fields = [], maxResults = 100 } = req.body;
        if (!jql) {
            return res.status(400).json({ message: 'JQL query is required.' });
        }
        const response = await jiraApi.post('/search', { jql, fields, maxResults });
        res.json(response.data.issues);
    } catch (error) {
        console.error('Jira JQL search failed:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data);
    }
});

/**
 * Endpoint to create a new Jira issue.
 * Expects a POST request with the Jira issue payload.
 */
app.post('/api/issue', async (req, res) => {
    try {
        const issueData = req.body;
        const response = await jiraApi.post('/issue', issueData);
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Failed to create Jira issue:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data);
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Jira Service running on http://localhost:${PORT}`);
});