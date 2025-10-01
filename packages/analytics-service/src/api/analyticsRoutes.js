import { Router } from 'express';
import * as AnalyticsService from '../services/analyticsService.js';

const router = Router();

router.get('/kpis', async (req, res) => {
    console.log('[Analytics Service] GET /kpis route handler reached.');
    try {
        const kpis = await AnalyticsService.getKpis();
        res.json(kpis);
    } catch (error) {
        console.error('[Analytics Service] Error in /kpis handler:', error);
        res.status(500).json({ error: 'Failed to retrieve KPIs.' });
    }
});

router.get('/charts', async (req, res) => {
    console.log('[Analytics Service] GET /charts route handler reached.');
    try {
        const chartData = await AnalyticsService.getChartData();
        res.json(chartData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Failed to retrieve chart data.' });
    }
});

export default router;
