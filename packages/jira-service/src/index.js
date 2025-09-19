import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import logger from '@production-support-portal/logger';
import { getJiraClients } from './jira-client.js';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

const PORT = process.env.JIRA_SERVICE_PORT;

// Middleware to attach the set of clients to the request object
app.use('/api/:instanceId', (req, res, next) => {
    try {
        req.jira = getJiraClients(req.params.instanceId);
        next();
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

app.post('/api/:instanceId/jql', async (req, res) => {
    try {
        const response = await req.jira.api.post('/search/jql', req.body);
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(error.response?.status || 500).json({ success: false, error: error.response?.data });
    }
});

app.get('/api/:instanceId/sprints', async (req, res) => {
    try {
        const { boardId } = req.query;
        if (!boardId) {
            return res.status(400).json({ success: false, error: 'boardId query parameter is required.' });
        }
        const response = await req.jira.agile.get(`/board/${boardId}/sprint`);
        res.json({ success: true, data: response.data.values || [] });
    } catch (error) {
        res.status(error.response?.status || 500).json({ success: false, error: error.response?.data });
    }
});

app.get('/api/:instanceId/sprint-report', async (req, res) => {
    const { boardId, sprintId } = req.query;
    if (!boardId || !sprintId) {
        return res.status(400).json({ success: false, error: 'boardId and sprintId query parameters are required.' });
    }
    try {
        const reportResponse = await req.jira.greenhopper.get('/rapid/charts/sprintreport', {
            params: {
                rapidViewId: parseInt(boardId, 10),
                sprintId: parseInt(sprintId, 10),
            },
        });
        
        const report = reportResponse.data;
        const issueKeys = [
            ...(report.contents.completedIssues?.map(i => i.key) || []),
            ...(report.contents.issuesNotCompletedInCurrentSprint?.map(i => i.key) || []),
            ...(report.contents.puntedIssues?.map(i => i.key) || [])
        ];

        if (issueKeys.length === 0) {
            return res.json({ 
                success: true, 
                data: { sprint: report.sprint, completedIssues: [], issuesNotCompleted: [], puntedIssues: [] }
            });
        }

        const requiredFields = ['summary', 'status', 'issuetype', 'created', process.env.JIRA_TSHIRT_FIELD_ID].filter(Boolean);
        const issueDetailsResponse = await req.jira.api.post('/search/jql', {
            jql: `issuekey in (${issueKeys.join(',')})`,
            fields: requiredFields,
            expand: ['changelog'],
        });
        const issuesMap = new Map(issueDetailsResponse.data.issues.map(i => [i.key, i]));
        
        const detailedReport = {
            sprint: report.sprint,
            completedIssues: (report.contents.completedIssues || []).map(i => issuesMap.get(i.key)).filter(Boolean),
            issuesNotCompleted: (report.contents.issuesNotCompletedInCurrentSprint || []).map(i => issuesMap.get(i.key)).filter(Boolean),
            puntedIssues: (report.contents.puntedIssues || []).map(i => issuesMap.get(i.key)).filter(Boolean),
        };
        res.json({ success: true, data: detailedReport });
    } catch (error) {
        const errorMessage = error.response?.data?.errorMessages?.join(' ') || error.message;
        res.status(error.response?.status || 500).json({ success: false, error: errorMessage });
    }
});

app.listen(PORT, () => {
    logger.info(`🚀 Jira Service running on http://localhost:${PORT}`);
});