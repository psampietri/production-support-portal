import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import logger from '@production-support-portal/logger';
import { getJiraClient } from './jira-client.js';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

const PORT = process.env.JIRA_SERVICE_PORT;

app.use('/api/:instanceId', (req, res, next) => {
    req.log.info({ instanceId: req.params.instanceId }, 'Processing request for Jira instance');
    try {
        req.jiraClient = getJiraClient(req.params.instanceId);
        next();
    } catch (error) {
        req.log.error({ err: error }, 'Failed to get Jira client');
        res.status(404).json({ success: false, error: error.message });
    }
});

app.post('/api/:instanceId/jql', async (req, res) => {
    try {
        const { jql } = req.body;
        req.log.info({ jql }, 'Executing JQL');
        
        const response = await req.jiraClient.post('/search/jql', req.body);
        
        req.log.info({ jql, issueCount: response.data.issues?.length || 0 }, 'JQL executed successfully');
        res.json({ success: true, data: response.data });
    } catch (error) {
        req.log.error({ err: error.response?.data }, 'JQL execution failed');
        res.status(error.response?.status || 500).json({ success: false, error: error.response?.data });
    }
});

app.get('/api/:instanceId/sprints', async (req, res) => {
    try {
        const { boardId } = req.query;
        if (!boardId) {
            return res.status(400).json({ success: false, error: 'boardId query parameter is required.' });
        }
        
        const { instanceId } = req.params;
        req.log.info({ boardId, instanceId }, 'Fetching sprints for board');
        
        const agileClient = getJiraClient(instanceId);
        // Correctly construct the client for the Agile API
        agileClient.defaults.baseURL = `https://${agileClient.defaults.baseURL.split('/')[2]}/rest/agile/1.0`;

        const response = await agileClient.get(`/board/${boardId}/sprint`);
        
        // FIXED: Extract the 'values' array from the Jira API response.
        const sprintsArray = response.data.values || [];

        req.log.info({ boardId, sprintCount: sprintsArray.length }, 'Sprints fetched successfully');
        // Always return the data in a consistent format with the array at the top level.
        res.json({ success: true, data: sprintsArray });

    } catch (error) {
        req.log.error({ err: error.response?.data, boardId: req.query.boardId }, 'Failed to fetch sprints');
        res.status(error.response?.status || 500).json({ success: false, error: error.response?.data });
    }
});

app.get('/api/:instanceId/sprint-report', async (req, res) => {
    const { boardId, sprintId } = req.query;
    if (!boardId || !sprintId) {
        return res.status(400).json({ error: 'boardId and sprintId query parameters are required.' });
    }

    try {
        req.log.info({ boardId, sprintId }, 'Fetching sprint report from Greenhopper API');
        const greenhopperClient = getJiraClient(req.params.instanceId);
        greenhopperClient.defaults.baseURL = `https://${greenhopperClient.defaults.baseURL.split('/')[2]}/rest/greenhopper/1.0`;

        const reportResponse = await greenhopperClient.get('/rapid/charts/sprintreport', {
            params: { rapidViewId: boardId, sprintId }
        });
        const report = reportResponse.data;

        const issueKeys = [
            ...(report.contents.completedIssues?.map(i => i.key) || []),
            ...(report.contents.issuesNotCompletedInCurrentSprint?.map(i => i.key) || []),
            ...(report.contents.puntedIssues?.map(i => i.key) || [])
        ];

        if (issueKeys.length === 0) {
            req.log.info({ sprintId }, 'Sprint report contains no issues.');
            return res.json({ 
                success: true, 
                data: { sprint: report.sprint, completedIssues: [], issuesNotCompleted: [], puntedIssues: [] }
            });
        }

        req.log.info({ sprintId, issueCount: issueKeys.length }, 'Fetching full issue details for sprint report');
        
        // FIXED: Replaced 'fields: ["*all"]' with an explicit list of required fields.
        const requiredFields = [
            'summary',
            'status',
            'issuetype',
            'created',
            process.env.JIRA_TSHIRT_FIELD_ID // Add T-Shirt size field from config
        ].filter(Boolean); // .filter(Boolean) removes any null/undefined fields

        const issueDetailsResponse = await req.jiraClient.post('/search/jql', {
            jql: `issuekey in (${issueKeys.join(',')})`,
            fields: requiredFields,
            expand: ['changelog']
        });
        const issuesMap = new Map(issueDetailsResponse.data.issues.map(i => [i.key, i]));
        
        const detailedReport = {
            sprint: report.sprint,
            completedIssues: (report.contents.completedIssues || []).map(i => issuesMap.get(i.key)).filter(Boolean),
            issuesNotCompleted: (report.contents.issuesNotCompletedInCurrentSprint || []).map(i => issuesMap.get(i.key)).filter(Boolean),
            puntedIssues: (report.contents.puntedIssues || []).map(i => issuesMap.get(i.key)).filter(Boolean),
        };

        req.log.info({ sprintId }, 'Successfully built detailed sprint report');
        res.json({ success: true, data: detailedReport });

    } catch (error) {
        req.log.error({ err: error.response?.data, boardId, sprintId }, 'Failed to fetch sprint report');
        res.status(error.response?.status || 500).json({ success: false, error: error.response?.data });
    }
});


app.listen(PORT, () => {
    logger.info(`🚀 Jira Service running on http://localhost:${PORT}`);
});