import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { prisma } from 'database-service';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.ONBOARDING_SERVICE_PORT || 3003;
const JIRA_SERVICE_URL = process.env.JIRA_SERVICE_URL || 'http://localhost:3007';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

// --- TEMPLATE ROUTES ---
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await prisma.onboardingTemplate.findMany({
            include: { taskTemplates: true }
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates.' });
    }
});

app.post('/api/templates', async (req, res) => {
    try {
        const { name, description, createdBy, tasks } = req.body;
        const newTemplate = await prisma.onboardingTemplate.create({
            data: {
                name,
                description,
                createdBy,
                taskTemplates: {
                    create: tasks, // Assumes tasks is an array of task template data
                },
            },
        });
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create template.' });
    }
});


// --- ONBOARDING INSTANCE ROUTES ---
app.get('/api/instances', async (req, res) => {
    try {
        const instances = await prisma.onboardingInstance.findMany({
            include: { user: true, onboardingTemplate: true, tasks: true }
        });
        res.json(instances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch instances.' });
    }
});


// --- ANALYTICS ROUTES ---
app.get('/api/analytics/kpis', async (req, res) => {
    try {
        const activeOnboardings = await prisma.onboardingInstance.count({ where: { status: 'in_progress' } });
        const completedLast30Days = await prisma.onboardingInstance.count({
            where: {
                status: 'completed',
                endDate: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 30)),
                },
            },
        });
        res.json({ activeOnboardings, completedLast30Days });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics.' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Onboarding Service running on http://localhost:${PORT}`);
});