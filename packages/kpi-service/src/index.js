import express from 'express';
import cors from 'cors';
import axios from 'axios';
import pinoHttp from 'pino-http';
import logger from '@production-support-portal/logger';
import * as calculations from './calculations.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

const PORT = process.env.KPI_SERVICE_PORT;
const JIRA_SERVICE_URL = `http://localhost:${process.env.JIRA_SERVICE_PORT}`;
const jiraService = axios.create({ baseURL: JIRA_SERVICE_URL });

/**
 * Recursively builds a tree of Jira issues.
 */
async function fetchInitiativeTree(issueKey, jiraInstanceId, reqLogger) {
    reqLogger.debug({ issueKey }, 'Fetching node for initiative tree');
    const response = await jiraService.post(`/api/${jiraInstanceId}/jql`, {
        jql: `issuekey = "${issueKey}"`,
        fields: ['*all']
    });

    const rootNode = response.data.data.issues[0];
    if (!rootNode) {
        reqLogger.warn({ issueKey }, 'Initiative tree node not found');
        return null;
    }

    const childrenResponse = await jiraService.post(`/api/${jiraInstanceId}/jql`, {
        jql: `parent = "${issueKey}"`,
        fields: ['key']
    });

    const children = childrenResponse.data.data.issues;
    if (children && children.length > 0) {
        reqLogger.debug({ issueKey, childCount: children.length }, 'Fetching children for node');
        const childPromises = children.map(child =>
            fetchInitiativeTree(child.key, jiraInstanceId, reqLogger)
        );
        rootNode.children = (await Promise.all(childPromises)).filter(Boolean);
    } else {
        rootNode.children = [];
    }
    return rootNode;
}


// --- API Endpoints ---

app.get('/dashboard-data', async (req, res) => {
    const { jiraInstance } = req.query;
    if (!jiraInstance) {
        return res.status(400).json({ error: 'The "jiraInstance" query parameter is required.' });
    }
    req.log.info({ jiraInstance }, 'Starting dashboard data generation');

    try {
        const jql = `labels = '${process.env.JIRA_INITIATIVE_LABEL}' AND issuetype = 'Initiative' AND Key NOT IN ('APPS-3367') ORDER BY RANK`;
        req.log.info({ jql }, 'Fetching root initiatives');
        const rootIssuesResponse = await jiraService.post(`/api/${jiraInstance}/jql`, { jql, fields: ['key'] });
        const rootIssues = rootIssuesResponse.data.data.issues;
        req.log.info({ count: rootIssues.length }, 'Found root initiatives. Building trees...');

        const treePromises = rootIssues.map(issue => fetchInitiativeTree(issue.key, jiraInstance, req.log));
        const rawTrees = await Promise.all(treePromises);
        req.log.info('Tree building complete. Starting calculations...');
        
        const processedTrees = calculations.calculateInitiativeTrees(rawTrees.filter(t => t));
        const overallCompletion = calculations.calculateOverallCompletion(processedTrees);
        req.log.info({ overallCompletion: `${(overallCompletion * 100).toFixed(1)}%` }, 'Calculations complete.');

        res.json({ success: true, data: processedTrees, overallCompletion });
    } catch (error) {
        req.log.error({ err: error.message, jiraInstance }, 'Failed to generate dashboard data');
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get('/sprints', async (req, res) => {
    const { jiraInstance } = req.query;
    if (!jiraInstance) {
        return res.status(400).json({ error: 'The "jiraInstance" query parameter is required.' });
    }
    req.log.info({ jiraInstance }, 'Fetching sprints');
    try {
        // This is the critical line that reads the board ID from the environment
        const boardId = process.env.JIRA_AGILE_BOARD_ID;
        if (!boardId) {
            throw new Error('JIRA_AGILE_BOARD_ID is not defined in the environment variables.');
        }

        // FIXED: The boardId is now passed correctly as a query parameter
        const response = await jiraService.get(`/api/${jiraInstance}/sprints`, {
            params: { boardId }
        });
        res.json(response.data);
    } catch (error) {
        req.log.error({ err: error.message, jiraInstance }, 'Failed to fetch sprints');
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/sprint-progress/:sprintId', async (req, res) => {
    const { jiraInstance } = req.query;
    const { sprintId } = req.params;
    if (!jiraInstance) {
        return res.status(400).json({ error: 'The "jiraInstance" query parameter is required.' });
    }
    req.log.info({ jiraInstance, sprintId }, 'Processing sprint progress request');
    try {
        const boardId = process.env.JIRA_AGILE_BOARD_ID;
        
        // Call the new, powerful endpoint in the jira-service
        const response = await jiraService.get(`/api/${jiraInstance}/sprint-report`, {
            params: { boardId, sprintId }
        });

        if (!response.data.success) {
            throw new Error('Failed to get sprint report from jira-service');
        }

        const sprintReport = response.data.data;
        
        // Perform the calculation with the real, detailed data
        const sprintProgress = calculations.calculateSprintProgress(sprintReport, process.env.JIRA_TSHIRT_FIELD_ID);
        
        req.log.info({ sprintId }, 'Successfully calculated sprint progress');
        res.json({ success: true, sprintProgress });

    } catch (error) {
        req.log.error({ err: error.message, jiraInstance, sprintId }, 'Failed to process sprint progress');
        res.status(500).json({ success: false, error: error.message });
    }
});




app.listen(PORT, () => {
    logger.info(`🚀 KPI Service running on http://localhost:${PORT}`);
});