import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.JIRA_SERVICE_PORT || 3007;
const JIRA_HOST = process.env.VWGOA_JIRA_HOST;
const JIRA_HEADERS = {
    'Cookie': `${process.env.VWGOA_JIRA_COOKIE_NAME}=${process.env.VWGOA_JIRA_COOKIE_VALUE}`,
    'Content-Type': 'application/json'
};

// --- Axios Instances for Different Jira APIs ---
const jiraApi = axios.create({ baseURL: `https://${JIRA_HOST}/rest/api/3`, headers: JIRA_HEADERS });
const agileApi = axios.create({ baseURL: `https://${JIRA_HOST}/rest/agile/1.0`, headers: JIRA_HEADERS });
// Re-add Greenhopper for sprint reports as it's used in your working code
const jiraGreenhopperApi = axios.create({ baseURL: `https://${JIRA_HOST}/rest/greenhopper/1.0`, headers: JIRA_HEADERS });

// --- Error Handling Middleware ---
const handleError = (error, res) => {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message };
    console.error(`Jira Service Error (${status}):`, data);
    res.status(status).json(data);
};

// --- API Endpoints ---

// Use the correct endpoint for JQL searches
app.post('/api/jql', async (req, res) => {
    try {
        const response = await jiraApi.post('/search/jql', req.body);
        res.json(response.data.issues);
    } catch (error) {
        handleError(error, res);
    }
});

// Add the bulk fetch endpoint from your working code
app.post('/api/issue/bulkfetch', async (req, res) => {
    try {
        const response = await jiraApi.post('/issue/bulk', req.body); // The actual endpoint is /issue/bulk
        res.json(response.data);
    } catch (error) {
        handleError(error, res);
    }
});

app.post('/api/issue', async (req, res) => {
    try {
        const response = await jiraApi.post('/issue', req.body);
        res.status(201).json(response.data);
    } catch (error) {
        handleError(error, res);
    }
});

app.get('/api/agile/board/:boardId/sprint', async (req, res) => {
    try {
        const { boardId } = req.params;
        const response = await agileApi.get(`/board/${boardId}/sprint`, { params: req.query });
        res.json(response.data);
    } catch (error) {
        handleError(error, res);
    }
});

// Keep the Greenhopper API for sprint reports
app.get('/api/greenhopper/sprintreport', async (req, res) => {
    try {
        const response = await jiraGreenhopperApi.get('/rapid/charts/sprintreport', { params: req.query });
        res.json(response.data);
    } catch (error) {
        handleError(error, res);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Jira Service running on http://localhost:${PORT}`);
});