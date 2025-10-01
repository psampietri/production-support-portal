import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import logger from '@production-support-portal/logger';
import { getJiraClients, callJiraApi, formatJiraPayload } from './jira-client.js';

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

// --- Generic JQL Search ---
app.post('/api/:instanceId/jql', async (req, res) => {
    try {
        const response = await req.jira.api.post('/search/jql', req.body);
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(error.response?.status || 500).json({ success: false, error: error.response?.data });
    }
});

// --- Agile Board Routes (from KPI Portal) ---
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
    req.log.info({ boardId, sprintId }, '--- Starting sprint report generation ---');

    if (!boardId || !sprintId) {
        req.log.error('Missing boardId or sprintId');
        return res.status(400).json({ error: 'boardId and sprintId query parameters are required.' });
    }

    try {
        req.log.info('Step 1: Creating Greenhopper API client');
        const greenhopperClient = req.jira.greenhopper;

        const requestParams = { rapidViewId: boardId, sprintId };
        req.log.info({ url: `${greenhopperClient.defaults.baseURL}/rapid/charts/sprintreport`, params: requestParams }, 'Step 2: Fetching sprint report from Greenhopper');

        const reportResponse = await greenhopperClient.get('/rapid/charts/sprintreport', { params: requestParams });
        const report = reportResponse.data;
        req.log.info('Step 3: Successfully fetched sprint report data from Greenhopper');

        const issueKeys = [
            ...(report.contents.completedIssues?.map(i => i.key) || []),
            ...(report.contents.issuesNotCompletedInCurrentSprint?.map(i => i.key) || []),
            ...(report.contents.puntedIssues?.map(i => i.key) || [])
        ];
        req.log.info({ issueCount: issueKeys.length }, 'Step 4: Extracted issue keys from report');

        if (issueKeys.length === 0) {
            req.log.info('No issues found in the sprint report. Returning empty data.');
            return res.json({
                success: true,
                data: { sprint: report.sprint, completedIssues: [], issuesNotCompleted: [], puntedIssues: [] }
            });
        }

        const requiredFields = [
            'summary', 'status', 'issuetype', 'created',
            process.env.JIRA_TSHIRT_FIELD_ID
        ].filter(Boolean);

        const jqlPayload = {
            jql: `issuekey in (${issueKeys.join(',')})`,
            fields: requiredFields.join(','), // Join the fields array into a comma-separated string
            expand: 'changelog'
        };

        req.log.info({ jql: jqlPayload.jql, fields: jqlPayload.fields }, 'Step 5: Fetching full issue details via JQL');

        const issueDetailsResponse = await req.jira.api.get('/search/jql', {
            params: {
                jql: jqlPayload.jql,
                fields: jqlPayload.fields,
                expand: jqlPayload.expand
            }
        });
        req.log.info('Step 6: Successfully fetched issue details');

        const issuesMap = new Map(issueDetailsResponse.data.issues.map(i => [i.key, i]));

        const detailedReport = {
            sprint: report.sprint,
            completedIssues: (report.contents.completedIssues || []).map(i => issuesMap.get(i.key)).filter(Boolean),
            issuesNotCompleted: (report.contents.issuesNotCompletedInCurrentSprint || []).map(i => issuesMap.get(i.key)).filter(Boolean),
            puntedIssues: (report.contents.puntedIssues || []).map(i => issuesMap.get(i.key)).filter(Boolean),
        };

        req.log.info('Step 7: Successfully built detailed sprint report. Sending response.');
        res.json({ success: true, data: detailedReport });

    } catch (error) {
        const errorDetails = {
            message: error.message,
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params,
            status: error.response?.status,
            data: error.response?.data
        };
        req.log.error({ err: errorDetails, boardId, sprintId }, '--- Sprint report generation failed ---');
        res.status(error.response?.status || 500).json({ success: false, error: error.response?.data || 'An internal error occurred' });
    }
});

// --- Service Desk Routes (from Onboarding Tool) ---
app.get('/api/:instanceId/servicedesks', async (req, res) => {
    try {
        const serviceDesks = await callJiraApi(req.jira.serviceDesk, '/servicedesk');
        res.json(serviceDesks);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || error.message });
    }
});

app.get('/api/:instanceId/servicedesks/:serviceDeskId/requesttypes', async (req, res) => {
    try {
        const { serviceDeskId } = req.params;
        const requestTypes = await callJiraApi(req.jira.serviceDesk, `/servicedesk/${serviceDeskId}/requesttype`);
        res.json(requestTypes);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || error.message });
    }
});

app.get('/api/:instanceId/servicedesks/:serviceDeskId/requesttypes/:requestTypeId/fields', async (req, res) => {
    try {
        const { serviceDeskId, requestTypeId } = req.params;
        const fields = await callJiraApi(req.jira.serviceDesk, `/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}/field`);
        res.json(fields);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || error.message });
    }
});

app.get('/api/:instanceId/requests/:ticketKey', async (req, res) => {
    try {
        const { ticketKey } = req.params;
        const ticketDetails = await callJiraApi(req.jira.serviceDesk, `/request/${ticketKey}`);
        res.json(ticketDetails);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || error.message });
    }
});

app.post('/api/:instanceId/requests/create', async (req, res) => {
    try {
        const { jiraConfig, user } = req.body;
        if (!jiraConfig || !user) {
            return res.status(400).json({ error: 'Missing jiraConfig or user in request body.' });
        }
        const requestFieldValues = await formatJiraPayload(req.jira.serviceDesk, jiraConfig.serviceDeskId, jiraConfig.requestTypeId, jiraConfig.fieldMappings, user);
        const payload = {
            serviceDeskId: jiraConfig.serviceDeskId,
            requestTypeId: jiraConfig.requestTypeId,
            requestFieldValues
        };
        const result = await callJiraApi(req.jira.serviceDesk, '/request', 'POST', payload);
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || error.message });
    }
});

app.post('/api/:instanceId/requests/dry-run', async (req, res) => {
    try {
        const { jiraConfig, user } = req.body;
        if (!jiraConfig || !user) {
            return res.status(400).json({ error: 'Missing jiraConfig or user in request body.' });
        }
        const requestFieldValues = await formatJiraPayload(req.jira.serviceDesk, jiraConfig.serviceDeskId, jiraConfig.requestTypeId, jiraConfig.fieldMappings, user);
        res.json({
            message: "This is a dry run. The following payload would be sent to Jira.",
            payload: {
                serviceDeskId: jiraConfig.serviceDeskId,
                requestTypeId: jiraConfig.requestTypeId,
                requestFieldValues
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.data || error.message });
    }
});

app.listen(PORT, () => {
    logger.info(`🚀 Jira Service running on http://localhost:${PORT}`);
});