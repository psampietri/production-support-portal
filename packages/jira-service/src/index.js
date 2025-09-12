import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.JIRA_SERVICE_PORT || 3007;
const JIRA_HOST = process.env.JIRA_HOST;
const JIRA_HEADERS = {
    'Cookie': `${process.env.JIRA_COOKIE_NAME}=${process.env.JIRA_COOKIE_VALUE}`,
    'Content-Type': 'application/json'
};

// --- Axios Instances for Different Jira APIs ---
const jiraApi = axios.create({ baseURL: `https://${JIRA_HOST}/rest/api/3`, headers: JIRA_HEADERS });
const agileApi = axios.create({ baseURL: `https://${JIRA_HOST}/rest/agile/1.0`, headers: JIRA_HEADERS });
const greenhopperApi = axios.create({ baseURL: `https://${JIRA_HOST}/rest/greenhopper/1.0`, headers: JIRA_HEADERS });

// --- Error Handling Middleware ---
const handleError = (error, res) => {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message };
    console.error(`Jira Service Error (${status}):`, data);
    res.status(status).json(data);
};

// --- API Endpoints ---

// Main API proxy
app.post('/api/jql', async (req, res) => {
    try {
        const response = await jiraApi.post('/search', req.body);
        res.json(response.data.issues);
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

// Agile API proxy (for sprints)
app.get('/api/agile/board/:boardId/sprint', async (req, res) => {
    try {
        const { boardId } = req.params;
        const response = await agileApi.get(`/board/${boardId}/sprint`, { params: req.query });
        res.json(response.data);
    } catch (error) {
        handleError(error, res);
    }
});

// Greenhopper API proxy (for sprint reports)
app.get('/api/greenhopper/sprintreport', async (req, res) => {
    try {
        const response = await greenhopperApi.get('/rapid/charts/sprintreport', { params: req.query });
        res.json(response.data);
    } catch (error) {
        handleError(error, res);
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Jira Service running on http://localhost:${PORT}`);
});