import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import * as calculations from './calculations.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.KPI_SERVICE_PORT || 7001;
const JIRA_SERVICE_URL = process.env.JIRA_SERVICE_URL || 'http://localhost:3007';
const jiraApi = axios.create({ baseURL: JIRA_SERVICE_URL });

// --- Helper Functions to call Jira Service ---
async function fetchIssueTree(issueKey) {
    const issueDetailsResponse = await jiraApi.post('/api/jql', { jql: `issuekey = "${issueKey}"` });
    if (!issueDetailsResponse.data || issueDetailsResponse.data.length === 0) return null;
    
    const currentNode = issueDetailsResponse.data[0];
    const childrenJql = `parent = "${issueKey}"`;
    const childIssuesResponse = await jiraApi.post('/api/jql', { jql: childrenJql });
    
    if (childIssuesResponse.data && childIssuesResponse.data.length > 0) {
        const childPromises = childIssuesResponse.data.map(child => fetchIssueTree(child.key));
        currentNode.children = (await Promise.all(childPromises)).filter(Boolean);
    } else {
        currentNode.children = [];
    }
    return currentNode;
}

// --- API Endpoints ---
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const rootIssuesJql = `labels = '${process.env.JIRA_LABEL}' AND issuetype = 'Initiative'`;
        const rootIssuesResponse = await jiraApi.post('/api/jql', { jql: rootIssuesJql });

        const treePromises = rootIssuesResponse.data.map(issue => fetchIssueTree(issue.key));
        const rawTrees = await Promise.all(treePromises);
        
        const processedTrees = calculations.calculateInitiativeTrees(rawTrees.filter(t => t));
        const overallCompletion = calculations.calculateOverallCompletion(processedTrees);

        res.json({ success: true, data: processedTrees, overallCompletion });
    } catch (error) {
        console.error('Error in /api/dashboard-data:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/sprints', async (req, res) => {
    try {
        const boardId = process.env.JIRA_AGILE_BOARD_ID;
        const response = await jiraApi.get(`/api/agile/board/${boardId}/sprint`);
        res.json({ success: true, sprints: response.data.values });
    } catch (error) {
        console.error('Error in /api/sprints:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/sprint-progress/:sprintId', async (req, res) => {
    try {
        const { sprintId } = req.params;
        const boardId = process.env.JIRA_AGILE_BOARD_ID;
        const response = await jiraApi.get(`/api/greenhopper/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`);
        
        const sprintReport = response.data;
        // The sprint report contains issue keys, now we need to fetch their details
        const issueKeys = [
            ...sprintReport.contents.completedIssues.map(i => i.key),
            ...sprintReport.contents.issuesNotCompletedInCurrentSprint.map(i => i.key),
            ...sprintReport.contents.puntedIssues.map(i => i.key)
        ];

        const issueDetailsResponse = await jiraApi.post('/api/jql', { 
            jql: `issuekey in (${issueKeys.join(',')})`,
            fields: ['*all'], // Fetch all fields for calculation
            expand: ['changelog']
        });
        const issuesMap = new Map(issueDetailsResponse.data.map(i => [i.key, i]));
        
        const detailedReport = {
            sprint: sprintReport.sprint,
            completedIssues: sprintReport.contents.completedIssues.map(i => issuesMap.get(i.key)).filter(Boolean),
            issuesNotCompleted: sprintReport.contents.issuesNotCompletedInCurrentSprint.map(i => issuesMap.get(i.key)).filter(Boolean),
            puntedIssues: sprintReport.contents.puntedIssues.map(i => issuesMap.get(i.key)).filter(Boolean),
        };

        const sprintProgress = calculations.calculateSprintProgress(detailedReport, process.env.JIRA_TSHIRT_FIELD_ID);
        res.json({ success: true, sprintProgress });
    } catch (error) {
        console.error(`Error in /api/sprint-progress/${req.params.sprintId}:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 KPI Service running on http://localhost:${PORT}`);
});